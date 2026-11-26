import { afterEach, describe, expect, it, vi } from 'vitest';

import { configureSite } from '@/lib/site';
import { setPreviewCode } from '@/lib/preview-code';
import { assertEditionConsistency, EditionLoadError, loadErrorMessage, loadEditionAsset, loadEditionContent, loadManifest, type EditionAssetTiming } from './loader';
import type { Edition } from './registry';

const manifest = {
  schemaVersion: 1,
  editionId: 'fixture-edition',
  year: 2042,
  title: 'Fixture edition',
  status: 'preview',
  period: { start: '2042-01-01', end: '2042-12-31', timezone: 'Europe/Berlin', wahlperioden: [99] },
  dataVersion: 'fixture-v2',
  generatedAt: '2043-01-01T00:00:00Z',
  coverage: { protocolCount: 1, firstProtocolDate: '2042-01-01', lastProtocolDate: '2042-01-01', complete: false },
  assets: { wrapped: 'wrapped.json', speakerIndex: 'speakers/index.json', speakersBase: 'speakers', speeches: 'speeches.json', words: 'words.json', wordRankings: 'word-rankings.json', topicRankings: 'topic-rankings.json' },
  content: 'content.json',
  checksums: 'checksums.json',
} satisfies Edition;

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  configureSite({ embedded: false });
});

describe('edition runtime loader', () => {
  it.each([[false, 1, 'http'], [true, 0, 'unauthorized']])('on a 401 redirects to /zugang only in the browser (embedded=%s)', async (embedded, redirects, kind) => {
    const assign = vi.fn();
    vi.stubGlobal('location', { pathname: '/2026', search: '', hash: '', href: 'http://localhost/2026', origin: 'http://localhost', assign });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    configureSite({ embedded });
    await expect(loadManifest('/data/2025/manifest.json')).rejects.toMatchObject({ kind });
    expect(assign).toHaveBeenCalledTimes(redirects);
  });
  it.each([
    'https://evil.example/data/manifest.json', '//evil.example/data/manifest.json',
    '/api/delete.json', '/data/../api/delete.json', '/data/%2e%2e/api.json',
    '/data/2025/manifest.json?redirect=/api/delete', '/data/2025/manifest.json#fragment',
    '/data/2025/..\\private.json',
  ])('rejects untrusted edition URLs before making a request: %s', async url => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(loadManifest(url)).rejects.toMatchObject({ kind: 'invalid-contract' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('loads and validates content relative to the manifest URL', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ editionId: 'fixture-edition', year: 2042 }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await expect(loadEditionContent('/data/fixtures/nested/v2/manifest.json', manifest)).resolves.toEqual({ editionId: 'fixture-edition', year: 2042 });
    expect(fetch).toHaveBeenCalledWith('/data/fixtures/nested/v2/content.json', { redirect: 'error' });
  });

  it('distinguishes a missing asset from an invalid content document', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' })));
    await expect(loadEditionContent('/data/fixtures/manifest.json', manifest)).rejects.toMatchObject({ kind: 'missing-asset' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ editionId: 'fixture-edition' }), { status: 200 })));
    await expect(loadEditionContent('/data/fixtures/manifest.json', manifest)).rejects.toMatchObject({ kind: 'invalid-contract' });
  });

  it('rejects inconsistent index, manifest, and content metadata', () => {
    expect(() => assertEditionConsistency(
      { id: 'fixture-edition', year: 2042, status: 'preview', manifestUrl: '/data/fixtures/manifest.json' },
      manifest,
      { editionId: 'other-edition', year: 2042 },
    )).toThrow('Edition content and manifest disagree');
  });

  it('requires a concrete runtime validator for manifest assets', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      speakers: [{ slug: 'fixture-speaker', name: 'Fixture Speaker', party: 'Fixture Party', speeches: 2, wortbeitraege: 1, words: 42 }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await expect(loadEditionAsset('/data/fixtures/nested/manifest.json', 'speakers/index.json', 'SpeakerIndexAsset')).resolves.toMatchObject({
      speakers: [{ slug: 'fixture-speaker' }],
    });
    expect(fetch).toHaveBeenCalledWith('/data/fixtures/nested/speakers/index.json', { redirect: 'error' });
  });

  it('reports the asset URL and JSON path when a runtime asset is malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      speakers: [{ slug: 'fixture-speaker', name: 'Fixture Speaker', party: 'Fixture Party', speeches: 'two', wortbeitraege: 1, words: 42 }],
    }), { status: 200 }))));

    await expect(loadEditionAsset('/data/fixtures/manifest.json', 'speakers/index.json', 'SpeakerIndexAsset')).rejects.toMatchObject({
      kind: 'invalid-contract',
      url: '/data/fixtures/speakers/index.json',
    });
    await expect(loadEditionAsset('/data/fixtures/manifest.json', 'speakers/index.json', 'SpeakerIndexAsset')).rejects.toThrow('/speakers/0/speeches');
  });
});


it('separates transfer/parsing/validation timing without changing validated assets', async () => {
  let tick = 0;
  vi.stubGlobal('performance', { now: () => ++tick, getEntriesByName: () => [{ encodedBodySize: 12, decodedBodySize: 34 }] });
  const payload = { parties: [] };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { headers: { 'content-encoding': 'gzip' } })));
  const timing: EditionAssetTiming = {};
  await expect(loadEditionAsset('/data/fixtures/manifest.json', 'words.json', 'WordsAsset', timing)).resolves.toEqual(payload);
  expect(timing).toMatchObject({ contentEncoding: 'gzip', encodedBytes: 12, decodedBytes: 34 });
  for (const duration of [timing.headersMs, timing.bodyMs, timing.jsonMs, timing.validationMs]) expect(duration).toBeGreaterThanOrEqual(0);
});

describe('loadErrorMessage', () => {
  it('shows German copy and never the technical message', () => {
    const network = new EditionLoadError('network', 'Network error while loading /data/editions.json', '/data/editions.json');
    expect(loadErrorMessage(network)).toMatch(/Verbindung/);
    expect(loadErrorMessage(network)).not.toMatch(/Network error|editions\.json/);
    expect(loadErrorMessage(new EditionLoadError('http', '/data/x.json: 500'))).toMatch(/nicht erreichbar/);
    expect(loadErrorMessage(new Error('boom'))).toMatch(/nicht geladen/);
    expect(loadErrorMessage(null)).toMatch(/nicht geladen/);
  });
});

describe('preview code (garden fence) in the app', () => {
  const ok = () => vi.fn().mockImplementation(async () => new Response('{}', { status: 200 }));
  const sentHeaders = (fetch: ReturnType<typeof vi.fn>) => (fetch.mock.calls[0][1] as RequestInit).headers;

  it('sends X-Gartenzaun on gated data paths when embedded and a code is stored', async () => {
    const fetch = ok();
    vi.stubGlobal('fetch', fetch);
    configureSite({ embedded: true });
    setPreviewCode(' Aigner ');
    await loadManifest('/data/2026/v1/manifest.json').catch(() => {});
    expect(fetch.mock.calls[0][0]).toBe('https://bundestag-wrapped.de/data/2026/v1/manifest.json');
    expect(sentHeaders(fetch)).toEqual({ 'X-Gartenzaun': 'aigner' });
  });

  it.each([
    ['embedded without a stored code', true, null, '/data/2026/v1/manifest.json'],
    ['embedded, public edition', true, 'aigner', '/data/2025/v1/manifest.json'],
    ['the browser, even with a code in storage', false, 'aigner', '/data/2026/v1/manifest.json'],
  ])('sends no header: %s', async (_name, embedded, code, url) => {
    const fetch = ok();
    vi.stubGlobal('fetch', fetch);
    configureSite({ embedded });
    if (code) setPreviewCode(code);
    await loadManifest(url).catch(() => {});
    expect(sentHeaders(fetch)).toBeUndefined();
  });

  it('turns a 401 into an unauthorized error in the app, without redirecting', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { pathname: '/', search: '', hash: '', href: 'http://localhost/', origin: 'http://localhost', assign });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    configureSite({ embedded: true });
    await expect(loadManifest('/data/2026/v1/manifest.json')).rejects.toMatchObject({ kind: 'unauthorized', url: '/data/2026/v1/manifest.json' });
    expect(assign).not.toHaveBeenCalled();
  });
});

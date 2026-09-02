import { afterEach, describe, expect, it, vi } from 'vitest';

import { assertEditionConsistency, loadEditionAsset, loadEditionContent } from './loader';
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

afterEach(() => vi.unstubAllGlobals());

describe('edition runtime loader', () => {
  it('loads and validates content relative to the manifest URL', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ editionId: 'fixture-edition', year: 2042 }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await expect(loadEditionContent('/fixtures/nested/v2/manifest.json', manifest)).resolves.toEqual({ editionId: 'fixture-edition', year: 2042 });
    expect(fetch).toHaveBeenCalledWith('/fixtures/nested/v2/content.json');
  });

  it('distinguishes a missing asset from an invalid content document', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' })));
    await expect(loadEditionContent('/fixtures/manifest.json', manifest)).rejects.toMatchObject({ kind: 'missing-asset' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ editionId: 'fixture-edition' }), { status: 200 })));
    await expect(loadEditionContent('/fixtures/manifest.json', manifest)).rejects.toMatchObject({ kind: 'invalid-contract' });
  });

  it('rejects inconsistent index, manifest, and content metadata', () => {
    expect(() => assertEditionConsistency(
      { id: 'fixture-edition', year: 2042, status: 'preview', manifestUrl: '/fixtures/manifest.json' },
      manifest,
      { editionId: 'other-edition', year: 2042 },
    )).toThrow('Edition content and manifest disagree');
  });

  it('requires a concrete runtime validator for manifest assets', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      speakers: [{ slug: 'fixture-speaker', name: 'Fixture Speaker', party: 'Fixture Party', speeches: 2, wortbeitraege: 1, words: 42 }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await expect(loadEditionAsset('/fixtures/nested/manifest.json', 'speakers/index.json', 'SpeakerIndexAsset')).resolves.toMatchObject({
      speakers: [{ slug: 'fixture-speaker' }],
    });
    expect(fetch).toHaveBeenCalledWith('/fixtures/nested/speakers/index.json');
  });

  it('reports the asset URL and JSON path when a runtime asset is malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      speakers: [{ slug: 'fixture-speaker', name: 'Fixture Speaker', party: 'Fixture Party', speeches: 'two', wortbeitraege: 1, words: 42 }],
    }), { status: 200 }))));

    await expect(loadEditionAsset('/fixtures/manifest.json', 'speakers/index.json', 'SpeakerIndexAsset')).rejects.toMatchObject({
      kind: 'invalid-contract',
      url: '/fixtures/speakers/index.json',
    });
    await expect(loadEditionAsset('/fixtures/manifest.json', 'speakers/index.json', 'SpeakerIndexAsset')).rejects.toThrow('/speakers/0/speeches');
  });
});

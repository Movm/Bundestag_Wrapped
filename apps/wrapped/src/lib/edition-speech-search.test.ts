import { afterEach, expect, it, vi } from 'vitest';
import { createEditionSpeechSearch, EditionSpeechSearch } from './edition-speech-search';
import { StaticSpeechSearchEngine } from './static-speech-search-engine';
import { SpeechSearchEngine } from './speech-search-engine';
import { parseStaticSpeechIndex } from './speech-index-model';
import { UnsupportedTextRanges } from './speech-text-ranges';
import type { SpeechSearchRequest } from './speech-search-protocol';
import type { Speech } from './search-utils';
const identity = { editionId: '2025', dataVersion: 'fixture', manifestSha256: 'a'.repeat(64), sourceSha256: 'b'.repeat(64) };
const manifestUrl = '/data/2025/fixture/manifest.json';
const root = `/data/2025/search-v1-${identity.manifestSha256}-${identity.sourceSha256}`;
const request: Extract<SpeechSearchRequest, { type: 'search' }> = { id: 1, type: 'search', manifestUrl, asset: 'speeches.json', query: 'Klima', sort: 'relevance', page: 0, filters: { party: '' } };
const speech: Speech = { id: 0, speaker: 'Name', party: 'SPD', type: 'rede', category: 'rede', words: 20, text: 'Klima und Energie' };
const manifest = { schemaVersion: 1, editionId: '2025', year: 2025, title: 'Fixture', status: 'published', dataVersion: 'fixture', generatedAt: '2025-01-01T00:00:00Z', period: { start: '2025-01-01', end: '2025-12-31', timezone: 'Europe/Berlin', wahlperioden: [21] }, coverage: { protocolCount: 1, firstProtocolDate: '2025-01-01', lastProtocolDate: '2025-01-01', complete: false },
  assets: { wrapped: 'wrapped.json', speakerIndex: 'speakers/index.json', speakersBase: 'speakers', speeches: 'speeches.json', words: 'words.json', wordRankings: 'word_rankings.json', topicRankings: 'topic_rankings.json' }, content: 'content.json', checksums: 'checksums.json' };
const gramCounts = new Map<string, number>();
for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= speech.text.length; i++) {
  const gram = speech.text.toLowerCase().slice(i, i + n); gramCounts.set(gram, (gramCounts.get(gram) ?? 0) + 1);
}
const document = { ...identity, version: 1, speakers: ['Name'], parties: ['SPD'], types: ['rede'], rows: [[0, 0, 0, 0, 20, 17, 17]], grams: [...gramCounts] };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function install(indexStatus: number, index = document) {
  const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    if (String(url) === manifestUrl) return new Response(JSON.stringify(manifest));
    if (String(url).endsWith('/checksums.json')) return new Response(JSON.stringify({ 'manifest.json': identity.manifestSha256, 'speeches.json': identity.sourceSha256 }));
    if (String(url) === `${root}/index.json`) return new Response(JSON.stringify(index), { status: indexStatus });
    if (String(url).endsWith('/speeches.json')) return new Response(JSON.stringify({ speeches: [speech] }));
    throw new Error(`Unexpected asset ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
it('falls back to the existing corpus when an older deployment has no sidecar', async () => {
  const fetchMock = install(404), timing = {};
  const result = await createEditionSpeechSearch(manifestUrl, 'speeches.json', timing);
  expect(result.engine.kind).toBe('legacy');
  expect(await result.engine.search(request)).toEqual(new SpeechSearchEngine([speech]).search(request));
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/speeches.json'))).toHaveLength(1);
});
it('does not download the corpus when a valid index exists', async () => {
  const fetchMock = install(200);
  const result = await createEditionSpeechSearch(manifestUrl, 'speeches.json', {});
  expect(result.engine.kind).toBe('index');
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/speeches.json'))).toBe(false);
});
it('rejects a mismatched index instead of silently accepting different source data', async () => {
  const fetchMock = install(200, { ...document, sourceSha256: 'c'.repeat(64) });
  await expect(createEditionSpeechSearch(manifestUrl, 'speeches.json', {})).rejects.toThrow('Invalid static speech index');
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/speeches.json'))).toBe(false);
});
it('rejects an authentication error instead of treating it as a missing index', async () => {
  const fetchMock = install(401);
  await expect(createEditionSpeechSearch(manifestUrl, 'speeches.json', {})).rejects.toThrow('401');
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/speeches.json'))).toBe(false);
});
it('shares one compatibility fallback when an origin ignores ranges', async () => {
  const initial = new StaticSpeechSearchEngine(parseStaticSpeechIndex(document, identity), `${root}/index.json`);
  vi.spyOn(initial, 'search').mockRejectedValue(new UnsupportedTextRanges('unsupported'));
  const dispose = vi.spyOn(initial, 'dispose');
  const legacy = vi.fn().mockResolvedValue(new SpeechSearchEngine([speech]));
  const engine = new EditionSpeechSearch(initial, legacy);
  const results = await Promise.all([engine.search(request), engine.search({ ...request, query: 'Energie' })]);
  expect(results[0].total).toBe(1); expect(results[1].total).toBe(1);
  expect(legacy).toHaveBeenCalledOnce(); expect(dispose).toHaveBeenCalledOnce();
  expect(engine.kind).toBe('legacy-fallback');
});
it('allows another attempt after a failed compatibility load', async () => {
  const initial = new StaticSpeechSearchEngine(parseStaticSpeechIndex(document, identity), `${root}/index.json`);
  vi.spyOn(initial, 'search').mockRejectedValue(new UnsupportedTextRanges('unsupported'));
  const legacy = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new SpeechSearchEngine([speech]));
  const engine = new EditionSpeechSearch(initial, legacy);
  await expect(engine.search(request)).rejects.toThrow('offline');
  expect((await engine.search(request)).total).toBe(1);
});

import { afterEach, expect, it, vi } from 'vitest';
import { StaticSpeechSearchEngine } from './static-speech-search-engine';
import { SpeechSearchEngine } from './speech-search-engine';
import { encodePostings, gramFilename } from './speech-index-format';
import { parseStaticSpeechIndex } from './speech-index-model';
import type { Speech } from './search-utils';
import type { SpeechSearchRequest } from './speech-search-protocol';
const identity = { editionId: '2025', dataVersion: 'fixture', sourceSha256: 'a'.repeat(64), manifestSha256: 'b'.repeat(64) };
const base = `/data/2025/search-v1-${identity.manifestSha256}-${identity.sourceSha256}`;
const ascii = (text: string) => new TextEncoder().encode(text);
function concat(parts: Uint8Array[]) {
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return bytes;
}
function fixture() {
  const speeches: Speech[] = Array.from({ length: 140 }, (_, id) => ({ id, speaker: `Name ${id}`, party: id % 2 ? 'SPD' : 'GRÜNE', type: 'rede', category: 'rede', words: id * 10,
    text: (id % 2 ? 'Klima Energie ς µμ. ' : 'Atomkraft Migration σ μμ. ') + 'Kontext '.repeat(100) }));
  speeches[138].text = 'İ'.repeat(400) + 'needle';
  speeches[139].text = 'x'.repeat(149) + '😀' + ' tail';
  const grams = new Map<string, number[]>();
  let offset = 0;
  for (const speech of speeches) {
    const text = speech.text.toLowerCase();
    for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= text.length; i++) {
      const gram = text.slice(i, i + n), positions = grams.get(gram) ?? [];
      positions.push(offset + i); grams.set(gram, positions);
    }
    offset += text.length + 1;
  }
  const index = parseStaticSpeechIndex({ ...identity, version: 1, speakers: speeches.map(s => s.speaker), parties: ['GRÜNE', 'SPD'], types: ['rede'],
    rows: speeches.map((s, id) => [id, id % 2, 0, 0, s.words, s.text.toLowerCase().length, s.text.length]), grams: [...grams].map(([gram, positions]) => [gram, positions.length]) }, identity);
  const files = new Map([...grams].map(([gram, positions]) => [`${base}/grams/${gramFilename(gram)}`, encodePostings(positions)]));
  const text = speeches.map(s => s.text).join('');
  const bytes = new Uint8Array(text.length * 2), view = new DataView(bytes.buffer);
  for (let i = 0; i < text.length; i++) view.setUint16(i * 2, text.charCodeAt(i), true);
  const respond = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const posting = files.get(url);
    if (posting) return new Response(Uint8Array.from(posting).buffer);
    if (url === `${base}/texts.bin`) {
      const range = new Headers(init?.headers).get('range');
      if (!range?.startsWith('bytes=')) throw new Error('Full corpus request is forbidden');
      const ranges = range.slice(6).split(',').map(range => range.split('-').map(Number));
      if (ranges.length === 1) {
        const [start, end] = ranges[0];
        return new Response(Uint8Array.from(bytes.subarray(start, end + 1)).buffer, { status: 206, headers: { 'content-type': 'application/octet-stream', 'content-range': `bytes ${start}-${end}/${bytes.length}` } });
      }
      const parts = ranges.flatMap(([start, end]) => [ascii(`\r\n--fixture\r\nContent-Range: bytes ${start}-${end}/${bytes.length}\r\n\r\n`), bytes.subarray(start, end + 1)]);
      parts.push(ascii('\r\n--fixture--\r\n'));
      return new Response(concat(parts).buffer, { status: 206, headers: { 'content-type': 'multipart/byteranges; boundary=fixture' } });
    }
    const detail = /\/details\/(\d+)\.json$/.exec(url);
    if (detail) return new Response(JSON.stringify(speeches[Number(detail[1])]));
    throw new Error(`Unexpected resource ${url}`);
  };
  return { engine: new StaticSpeechSearchEngine(index, `${base}/index.json`), reference: new SpeechSearchEngine(speeches), respond, speeches };
}
function request(query: string): Extract<SpeechSearchRequest, { type: 'search' }> {
  return { id: 1, type: 'search', manifestUrl: '/data/2025/fixture/manifest.json', asset: 'speeches.json', query, sort: 'relevance', filters: { party: '' }, page: 0 };
}
afterEach(() => vi.unstubAllGlobals());
it.each(['', 'Klima', 'Atomkraft OR Klima', 'Klima AND Energie NOT Atomkraft', 'σ OR absent', 'μμ OR absent', '"μμ"', 'NOT μμ', 'needle', 'speaker:Name party:SPD words:>100'])('matches bounded legacy pages including exact snippets: %s', async query => {
  const { engine, reference, respond } = fixture();
  vi.stubGlobal('fetch', vi.fn(respond));
  for (const sort of ['relevance', 'date', 'words-desc', 'words-asc', 'speaker'] as const) {
    const input = { ...request(query), sort };
    expect(await engine.search(input)).toEqual(reference.search(input));
  }
});
it('batches previews, keeps 50 results per page and loads details only on demand', async () => {
  const { engine, reference, respond, speeches } = fixture();
  const fetchMock = vi.fn(respond); vi.stubGlobal('fetch', fetchMock);
  expect(await engine.search(request(''))).toEqual(reference.search(request('')));
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/texts.bin'))).toHaveLength(1);
  expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/details/'))).toHaveLength(0);
  const next = { ...request(''), page: 1 };
  expect(await engine.search(next)).toEqual(reference.search(next));
  expect(await engine.detail(52)).toEqual(speeches[52]);
  await expect(engine.detail(-1)).rejects.toThrow();
});
it('captures each query while an older preview request is still pending', async () => {
  const { engine, reference, respond } = fixture();
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const waiting = new Promise<void>(resolve => { started = resolve; });
  let first = true;
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url).endsWith('/texts.bin') && first) { first = false; started(); await gate; }
    return respond(url, init);
  }));
  const older = engine.search(request('Klima'));
  const olderSettled = older.catch(error => error);
  await waiting;
  const newer = await engine.search(request('Atomkraft'));
  release();
  expect(newer).toEqual(reference.search(request('Atomkraft')));
  expect((await olderSettled).name).toBe('AbortError');
});
it('retries a failed posting instead of retaining a rejected query promise', async () => {
  const { engine, reference, respond } = fixture();
  let fail = true;
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url).includes('/grams/') && fail) { fail = false; throw new Error('temporary'); }
    return respond(url, init);
  }));
  await expect(engine.search(request('Klima'))).rejects.toThrow('temporary');
  expect(await engine.search(request('Klima'))).toEqual(reference.search(request('Klima')));
});

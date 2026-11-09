import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';

const { client, searchProtocolChunks, searchDocumentChunks } = vi.hoisted(() => ({
  client: { scroll: vi.fn(), retrieve: vi.fn(), facet: vi.fn(), count: vi.fn() },
  searchProtocolChunks: vi.fn(),
  searchDocumentChunks: vi.fn()
}));

vi.mock('../src/services/qdrant/client.js', () => ({ getClient: () => client }));
vi.mock('../src/services/qdrant/protocolCollection.js', async (importOriginal) => ({
  ...(await importOriginal()),
  searchProtocolChunks
}));
vi.mock('../src/services/qdrant/documentCollection.js', async (importOriginal) => ({
  ...(await importOriginal()),
  searchDocumentChunks
}));
vi.mock('../src/services/embeddingService.js', () => ({ embed: vi.fn(async () => new Array(1024).fill(0)) }));
vi.mock('../src/config.js', async (importOriginal) => {
  const { config } = await importOriginal();
  return { config: { ...config, notebookApi: { keys: ['k1'], requestsPerMinute: 1000 } } };
});

const { layoutFromPoints, clearLayoutCacheForTests } = await import('../src/notebookApi/units.js');
const { bestExcerpt, drucksachePdfUrl, protocolPdfUrl, shortFactions } = await import(
  '../src/notebookApi/mapping.js'
);
const { planSources } = await import('../src/notebookApi/service.js');
const { createNotebookApiRouter, searchResponseSchema } = await import('../src/notebookApi/router.js');

const pt = (id, chunk_index, chunk_part = 0) => ({ id, payload: { chunk_index, chunk_part } });

describe('speech identity per protocol', () => {
  it('Python path: parts count up chunk_index, the speech starts at index - part', () => {
    const { speechOf, parts } = layoutFromPoints([pt(1, 0), pt(2, 1, 0), pt(3, 2, 1), pt(4, 3)]);
    expect([...speechOf.values()]).toEqual([0, 1, 1, 3]);
    expect(parts.get(1).map((p) => p.part)).toEqual([0, 1]);
  });

  it('JS path: parts share chunk_index', () => {
    const { speechOf } = layoutFromPoints([pt(1, 0), pt(2, 1, 0), pt(3, 1, 1), pt(4, 2)]);
    expect([...speechOf.values()]).toEqual([0, 1, 1, 2]);
  });
});

describe('mapping', () => {
  it('builds DIP PDF links', () => {
    expect(protocolPdfUrl('21/105')).toBe('https://dserver.bundestag.de/btp/21/21105.pdf');
    expect(drucksachePdfUrl('20/5000')).toBe('https://dserver.bundestag.de/btd/20/050/2005000.pdf');
  });

  it('maps long faction names to the short ones and drops non-factions', () => {
    expect(shortFactions(['BÜNDNIS 90/DIE GRÜNEN', 'Bundesregierung', 'SPD'])).toEqual(['GRÜNE', 'SPD']);
  });

  it('picks the window with most query terms, null when the text fits', () => {
    expect(bestExcerpt('kurz', 'Wärmepumpe')).toBeNull();
    const text = `${'Allgemeines Vorwort. '.repeat(120)}Die Wärmepumpe spart Heizkosten. ${'Schluss. '.repeat(200)}`;
    const excerpt = bestExcerpt(text, 'Wärmepumpe Heizkosten');
    expect(excerpt.length).toBeLessThanOrEqual(1800);
    expect(excerpt).toContain('Wärmepumpe spart Heizkosten');
  });
});

describe('planSources', () => {
  it('drops the source a filter cannot match', () => {
    expect(Object.keys(planSources(undefined, { speaker: ['X'] }))).toEqual(['speeches']);
    expect(Object.keys(planSources(undefined, { drucksachetyp: ['Antrag'] }))).toEqual(['documents']);
  });

  it('filters Drucksachen by party through urheber long names', () => {
    const plan = planSources(undefined, { party: ['GRÜNE'] });
    expect(plan.speeches.must).toContainEqual({ key: 'speaker_party', match: { any: ['GRÜNE'] } });
    expect(plan.documents.must).toContainEqual({
      key: 'urheber',
      match: { any: ['BÜNDNIS 90/DIE GRÜNEN'] }
    });
  });

  it('widens day bounds to the whole day', () => {
    const plan = planSources(['speeches'], { from: '2026-01-01', to: '2026-06-30' });
    expect(plan.speeches.must).toContainEqual({
      key: 'datum',
      range: { gte: '2026-01-01T00:00:00Z', lte: '2026-06-30T23:59:59Z' }
    });
  });
});

describe('REST door', () => {
  let server;
  let base;
  beforeAll(async () => {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use('/api/v1', createNotebookApiRouter());
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
  });
  afterAll(() => server.close());
  beforeEach(() => {
    vi.clearAllMocks();
    clearLayoutCacheForTests();
  });

  const post = (path, body, key = 'k1') =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(key && { authorization: `Bearer ${key}` }) },
      body: JSON.stringify(body)
    });

  const speechPoint = {
    id: 9,
    score: 0.8,
    payload: {
      protokoll_id: 6123,
      dokumentnummer: '21/105',
      wahlperiode: 21,
      datum: '2026-11-06',
      chunk_index: 15,
      chunk_part: 1,
      speaker: 'Katharina Dröge',
      speaker_party: 'GRÜNE',
      speech_type: 'rede',
      text: 'Die Wärmepumpe.'
    }
  };

  it('rejects requests without a valid key', async () => {
    expect((await post('/search', { query: 'x' }, null)).status).toBe(401);
    expect((await post('/search', { query: 'x' }, 'wrong')).status).toBe(401);
  });

  it('rejects unknown filter fields', async () => {
    expect((await post('/search', { query: 'x', filters: { themes: ['klima'] } })).status).toBe(400);
  });

  it('searches both sources and returns the documented schema', async () => {
    searchProtocolChunks.mockResolvedValue([speechPoint]);
    searchDocumentChunks.mockResolvedValue([
      {
        id: 4,
        score: 0.7,
        payload: {
          drucksache_id: 300,
          dokumentnummer: '21/1234',
          drucksachetyp: 'Antrag',
          wahlperiode: 21,
          datum: '2026-10-01',
          titel: 'Wärmewende sozial gestalten',
          urheber: ['BÜNDNIS 90/DIE GRÜNEN'],
          chunk_index: 0,
          chunk_type: 'problem',
          text: 'Problem.'
        }
      }
    ]);
    // Protocol 6123 was indexed by the Python path: speech 14 has parts 0 and 1.
    client.scroll.mockResolvedValue({ points: [pt(8, 14, 0), pt(9, 15, 1), pt(10, 16)], next_page_offset: null });

    const res = await post('/search', { query: 'Wärmepumpe', limit: 10 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(() => searchResponseSchema.parse(body)).not.toThrow();
    expect(body.results.map((r) => [r.source, r.doc_id, r.chunk_index])).toEqual([
      ['speeches', '6123-14', 1],
      ['documents', '300', 0]
    ]);
    expect(body.results[1].party).toEqual(['GRÜNE']);
  });

  it('expands a speech to its parts', async () => {
    client.scroll.mockResolvedValue({ points: [pt(8, 14, 0), pt(9, 15, 1)], next_page_offset: null });
    client.retrieve.mockResolvedValue([speechPoint]);

    const res = await post('/chunks', { source: 'speeches', doc_id: '6123-14', chunk_indexes: [1] });

    expect(client.retrieve).toHaveBeenCalledWith('bundestag-protocol-chunks', expect.objectContaining({ ids: [9] }));
    expect((await res.json()).chunks[0]).toMatchObject({ doc_id: '6123-14', chunk_index: 1 });
  });

  it('merges party facets across sources in short names, counted per unit', async () => {
    client.facet
      .mockResolvedValueOnce({ hits: [{ value: 'GRÜNE', count: 30 }] })
      .mockResolvedValueOnce({ hits: [{ value: 'BÜNDNIS 90/DIE GRÜNEN', count: 5 }, { value: 'Bundesregierung', count: 9 }] });

    const res = await post('/facets', { field: 'party' });

    expect(await res.json()).toEqual({ values: [{ value: 'GRÜNE', count: 35 }] });
    expect(client.facet.mock.calls[0][1].filter.must).toContainEqual({ key: 'chunk_part', match: { value: 0 } });
    expect(client.facet.mock.calls[1][1].filter.must).toContainEqual({ key: 'chunk_index', match: { value: 0 } });
  });

  it('answers 503, not an empty list, when Qdrant fails', async () => {
    searchProtocolChunks.mockRejectedValue(new Error('timeout'));
    searchDocumentChunks.mockResolvedValue([]);
    expect((await post('/search', { query: 'x' })).status).toBe(503);
  });
});

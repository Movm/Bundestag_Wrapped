import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchAktivitaeten } from '../src/api/bundestag.js';
import { buildMainPayload } from '../src/jobs/indexer.js';
import { buildFilter } from '../src/services/qdrant/mainCollection.js';
import { semanticSearchTool } from '../src/tools/semanticSearch.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('activity person filters', () => {
  it('maps person_id to the DIP person ID filter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ numFound: 1, documents: [] })
    });
    vi.stubGlobal('fetch', fetchMock);

    await searchAktivitaeten({ person_id: 2413, limit: 5 }, { useCache: false });

    expect(fetchMock).toHaveBeenCalledOnce();
    const requestUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestUrl.searchParams.get('f.person_id')).toBe('2413');
    expect(requestUrl.searchParams.has('f.person')).toBe(false);
  });

  it('stores activity person IDs as integers in the vector payload', () => {
    const payload = buildMainPayload(
      { id: '1493545', person_id: '2413', aktivitaetsart: 'Rede' },
      'aktivitaet',
      20
    );

    expect(payload.person_id).toBe(2413);
  });

  it('builds a Qdrant integer match condition for person_id', () => {
    expect(buildFilter({ person_id: 2413 })).toEqual({
      must: [{ key: 'person_id', match: { value: 2413 } }]
    });
  });

  it('exposes person_id as a positive integer semantic-search filter', () => {
    expect(semanticSearchTool.inputSchema.person_id.safeParse(2413).success).toBe(true);
    expect(semanticSearchTool.inputSchema.person_id.safeParse('2413').success).toBe(false);
  });
});

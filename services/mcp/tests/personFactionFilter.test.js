import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api/bundestag.js';
import {
  matchesPersonFaction,
  searchPersonenTool
} from '../src/tools/search.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('person faction filtering', () => {
  it('does not send the unsupported f.fraktion parameter to DIP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ numFound: 1, documents: [] })
    });
    vi.stubGlobal('fetch', fetchMock);

    await api.searchPersonen(
      { fraktion: 'SPD', wahlperiode: 21, limit: 5 },
      { useCache: false }
    );

    const requestUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestUrl.searchParams.has('f.fraktion')).toBe(false);
    expect(requestUrl.searchParams.get('f.wahlperiode')).toBe('21');
  });

  it('treats short and long Green faction names as aliases', () => {
    const person = { fraktion: ['BÜNDNIS 90/DIE GRÜNEN'] };

    expect(matchesPersonFaction(person, 'GRÜNE')).toBe(true);
    expect(matchesPersonFaction(person, 'Gruene')).toBe(true);
    expect(matchesPersonFaction(person, 'B90/GR')).toBe(true);
    expect(matchesPersonFaction(person, 'SPD')).toBe(false);
  });

  it('filters across DIP pages and reports the exact filtered total', async () => {
    const searchSpy = vi.spyOn(api, 'searchPersonen')
      .mockResolvedValueOnce({
        numFound: 1017,
        documents: [
          { id: '1', fraktion: ['CDU/CSU'] },
          { id: '2', fraktion: ['SPD'] }
        ],
        cursor: 'page-2',
        cached: false
      })
      .mockResolvedValueOnce({
        numFound: 1017,
        documents: [
          { id: '3', fraktion: ['SPD'] },
          { id: '4', fraktion: ['AfD'] }
        ],
        cursor: null,
        cached: false
      });

    const response = await searchPersonenTool.handler({
      fraktion: 'SPD',
      limit: 10,
      fields: 'full',
      useCache: false
    });

    expect(searchSpy).toHaveBeenCalledTimes(2);
    expect(response.totalResults).toBe(2);
    expect(response.apiTotalResults).toBe(1017);
    expect(response.returnedResults).toBe(2);
    expect(response.results.map((person) => person.id)).toEqual(['2', '3']);
    expect(response.scannedPages).toBe(2);
    expect(response.scannedResults).toBe(4);
    expect(response.filterMode).toBe('client-side-page-spanning');
  });

  it('paginates filtered results with an MCP-owned cursor', async () => {
    const documents = [
      { id: '1', fraktion: ['SPD'] },
      { id: '2', fraktion: ['SPD'] },
      { id: '3', fraktion: ['SPD'] }
    ];
    vi.spyOn(api, 'searchPersonen').mockResolvedValue({
      numFound: 1017,
      documents,
      cursor: null,
      cached: true
    });

    const first = await searchPersonenTool.handler({
      fraktion: 'SPD',
      limit: 2,
      fields: 'full',
      useCache: true
    });
    const second = await searchPersonenTool.handler({
      fraktion: 'SPD',
      limit: 2,
      cursor: first.cursor,
      fields: 'full',
      useCache: true
    });

    expect(first.results.map((person) => person.id)).toEqual(['1', '2']);
    expect(first.hasMore).toBe(true);
    expect(second.results.map((person) => person.id)).toEqual(['3']);
    expect(second.hasMore).toBe(false);
    expect(second.totalResults).toBe(3);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backfillDocumentHerausgeber } from '../src/jobs/herausgeberBackfill.js';

const unmarked = { must: [{ is_empty: { key: 'herausgeber' } }] };

describe('backfillDocumentHerausgeber', () => {
  let qdrant;
  let searchDrucksachen;

  beforeEach(() => {
    qdrant = { count: vi.fn(), setPayload: vi.fn() };
    searchDrucksachen = vi.fn();
  });

  const run = () =>
    backfillDocumentHerausgeber({
      qdrant,
      collection: 'docs',
      wahlperioden: [21],
      searchDrucksachen
    });

  it('does nothing once every chunk carries herausgeber', async () => {
    qdrant.count.mockResolvedValue({ count: 0 });

    expect(await run()).toEqual({ bundesrat: 0, bundestag: 0 });
    expect(searchDrucksachen).not.toHaveBeenCalled();
    expect(qdrant.setPayload).not.toHaveBeenCalled();
  });

  it('marks DIP Bundesrat ids BR first, then the rest BT', async () => {
    qdrant.count.mockResolvedValue({ count: 7 });
    searchDrucksachen
      .mockResolvedValueOnce({ documents: [{ id: '1' }, { id: '2' }], cursor: 'c1' })
      .mockResolvedValueOnce({ documents: [{ id: '3' }], cursor: 'c1' });

    expect(await run()).toEqual({ bundesrat: 3, bundestag: 7 });

    expect(searchDrucksachen).toHaveBeenNthCalledWith(
      1,
      { wahlperiode: 21, zuordnung: 'BR', limit: 100, cursor: null },
      { useCache: false }
    );
    expect(searchDrucksachen).toHaveBeenNthCalledWith(
      2,
      { wahlperiode: 21, zuordnung: 'BR', limit: 100, cursor: 'c1' },
      { useCache: false }
    );
    expect(qdrant.setPayload.mock.calls).toEqual([
      [
        'docs',
        {
          payload: { herausgeber: 'BR' },
          filter: { must: [{ key: 'drucksache_id', match: { any: [1, 2, 3] } }] },
          wait: true
        }
      ],
      ['docs', { payload: { herausgeber: 'BT' }, filter: unmarked, wait: true }]
    ]);
  });
});

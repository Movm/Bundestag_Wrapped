import { beforeEach, describe, expect, it, vi } from 'vitest';

const getClient = vi.fn();

vi.mock('../src/services/qdrant/client.js', () => ({ getClient }));

const { createSearcher } = await import('../src/services/qdrant/baseOperations.js');

describe('createSearcher', () => {
  beforeEach(() => {
    getClient.mockReset();
  });

  it('uses the Qdrant query API and preserves the existing result shape', async () => {
    const query = vi.fn().mockResolvedValue({
      points: [
        { id: 42, score: 0.91, payload: { title: 'Bürgergeld' }, vector: [0.1, 0.2] }
      ]
    });
    getClient.mockReturnValue({ query });

    const search = createSearcher('bundestag-docs', 'QDRANT');
    const results = await search([0.25, 0.75], {
      limit: 3,
      filter: { must: [{ key: 'wahlperiode', match: { value: 21 } }] },
      scoreThreshold: 0.4
    });

    expect(query).toHaveBeenCalledWith('bundestag-docs', {
      query: [0.25, 0.75],
      limit: 3,
      filter: { must: [{ key: 'wahlperiode', match: { value: 21 } }] },
      score_threshold: 0.4,
      with_payload: true
    });
    expect(results).toEqual([
      { id: 42, score: 0.91, payload: { title: 'Bürgergeld' } }
    ]);
  });
});

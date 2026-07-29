import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getClientMock } = vi.hoisted(() => ({
  getClientMock: vi.fn()
}));

vi.mock('../src/services/qdrant/client.js', () => ({
  getClient: getClientMock
}));

import { ensureCollectionExists } from '../src/services/qdrant/baseOperations.js';
import { setActivityPersonIds } from '../src/services/qdrant/mainCollection.js';

beforeEach(() => {
  getClientMock.mockReset();
});

describe('Qdrant activity person_id migration', () => {
  it('creates only missing payload indexes on an existing collection', async () => {
    const client = {
      getCollections: vi.fn().mockResolvedValue({
        collections: [{ name: 'bundestag-docs' }]
      }),
      getCollection: vi.fn().mockResolvedValue({
        payload_schema: { doc_type: { data_type: 'keyword' } }
      }),
      createPayloadIndex: vi.fn().mockResolvedValue({})
    };
    getClientMock.mockReturnValue(client);

    await expect(ensureCollectionExists(
      'bundestag-docs',
      [
        { field: 'doc_type', type: 'keyword' },
        { field: 'person_id', type: 'integer' }
      ],
      'TEST'
    )).resolves.toBe(true);

    expect(client.createPayloadIndex).toHaveBeenCalledOnce();
    expect(client.createPayloadIndex).toHaveBeenCalledWith('bundestag-docs', {
      field_name: 'person_id',
      field_schema: 'integer'
    });
  });

  it('backfills person IDs in one Qdrant batch request', async () => {
    const client = {
      batchUpdate: vi.fn().mockResolvedValue([])
    };
    getClientMock.mockReturnValue(client);

    await setActivityPersonIds([
      { id: 101, personId: 2413 },
      { id: 102, personId: 2414 }
    ]);

    expect(client.batchUpdate).toHaveBeenCalledOnce();
    expect(client.batchUpdate.mock.calls[0][1]).toEqual({
      wait: true,
      operations: [
        {
          set_payload: {
            payload: { person_id: 2413 },
            points: [101]
          }
        },
        {
          set_payload: {
            payload: { person_id: 2414 },
            points: [102]
          }
        }
      ]
    });
  });
});

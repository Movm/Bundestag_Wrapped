import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/qdrant/index.js', () => ({
  getPoints: vi.fn(), upsertPoints: vi.fn(), setPointPayload: vi.fn(), setActivityPersonIds: vi.fn()
}));
vi.mock('../src/services/indexerState.js', () => ({}));
vi.mock('../src/services/embeddingService.js', () => ({
  prepareDocumentText: doc => doc.titel,
  embedBatch: vi.fn(async texts => texts.map(() => [1, 2, 3]))
}));

import * as qdrant from '../src/services/qdrant/index.js';
import * as embedding from '../src/services/embeddingService.js';
import { processBatch } from '../src/jobs/indexer.js';

describe('metadata embedding deduplication', () => {
  const doc = { id: '1', titel: 'Klimaschutz', fraktion: 'SPD' };
  beforeEach(() => { vi.clearAllMocks(); qdrant.getPoints.mockResolvedValue([]); });

  it('embeds new or changed text once and reuses the vector on repeated runs', async () => {
    expect(await processBatch([doc], 'person', 21, { isIncremental: true })).toEqual({ indexed: 1, skipped: 0 });
    const point = qdrant.upsertPoints.mock.calls[0][0][0];
    qdrant.getPoints.mockResolvedValue([point]);
    expect(await processBatch([doc], 'person', 21, { isIncremental: true })).toEqual({ indexed: 0, skipped: 1 });
    expect(embedding.embedBatch).toHaveBeenCalledTimes(1);
    expect(qdrant.setPointPayload).not.toHaveBeenCalled();
    expect(await processBatch([{ ...doc, titel: 'Neuer Text' }], 'person', 21, { isIncremental: true })).toEqual({ indexed: 1, skipped: 0 });
    expect(embedding.embedBatch).toHaveBeenCalledTimes(2);
  });

  it('updates metadata without paying for another embedding', async () => {
    await processBatch([doc], 'person', 21, { isIncremental: true });
    qdrant.getPoints.mockResolvedValue([qdrant.upsertPoints.mock.calls[0][0][0]]);
    await processBatch([{ ...doc, fraktion: 'GRÜNE' }], 'person', 21, { isIncremental: true });
    expect(embedding.embedBatch).toHaveBeenCalledTimes(1);
    expect(qdrant.setPointPayload).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ fraktion: 'GRÜNE' }));
  });

  it('does not re-embed legacy points on a full scan but migrates them on an incremental run', async () => {
    await processBatch([doc], 'person', 21, { isIncremental: true });
    const point = qdrant.upsertPoints.mock.calls[0][0][0];
    delete point.payload.embedding_text_hash;
    qdrant.getPoints.mockResolvedValue([point]);
    vi.clearAllMocks();
    expect(await processBatch([doc], 'person', 21, { isIncremental: false })).toEqual({ indexed: 0, skipped: 1 });
    expect(embedding.embedBatch).not.toHaveBeenCalled();
    expect(await processBatch([doc], 'person', 21, { isIncremental: true })).toEqual({ indexed: 1, skipped: 0 });
  });

  it('keeps the activity person ID backfill on legacy full scans', async () => {
    const activity = { id: '2', titel: 'Rede', person_id: 42 };
    await processBatch([activity], 'aktivitaet', 21, { isIncremental: true });
    const point = qdrant.upsertPoints.mock.calls[0][0][0];
    delete point.payload.embedding_text_hash;
    qdrant.getPoints.mockResolvedValue([point]);
    vi.clearAllMocks();
    await processBatch([activity], 'aktivitaet', 21, { backfillActivityPersonIds: true });
    expect(qdrant.setActivityPersonIds).toHaveBeenCalledWith([{ id: point.id, personId: 42 }]);
    expect(embedding.embedBatch).not.toHaveBeenCalled();
  });

  it('does not call Mistral if the Qdrant lookup fails', async () => {
    qdrant.getPoints.mockRejectedValue(new Error('unavailable'));
    await expect(processBatch([doc], 'person', 21, { isIncremental: true })).rejects.toThrow('unavailable');
    expect(embedding.embedBatch).not.toHaveBeenCalled();
  });
});

import { expect, it, vi } from 'vitest';

const create = vi.hoisted(() => vi.fn());
vi.mock('@mistralai/mistralai', () => ({ Mistral: class { embeddings = { create }; } }));
vi.mock('../src/config.js', () => ({ config: { mistral: { apiKey: 'test', embeddingModel: 'mistral-embed', batchSize: 32 } } }));
import { embed, embedBatch, getUsageStats } from '../src/services/embeddingService.js';

it('tracks Mistral usage separately and marks responses without usage', async () => {
  create.mockResolvedValueOnce({ data: [{ embedding: [1] }], usage: { promptTokens: 12, totalTokens: 12 } });
  create.mockResolvedValueOnce({ data: [{ embedding: [2] }], usage: { prompt_tokens: 30, total_tokens: 30 } });
  create.mockResolvedValueOnce({ data: [{ embedding: [3] }] });
  await embed('query');
  await embedBatch(['document'], 'indexing');
  await embedBatch(['another document'], 'indexing');
  expect(getUsageStats().byPurpose).toEqual({
    search: { requests: 1, requestsWithoutUsage: 0, inputTokens: 12, totalTokens: 12 },
    indexing: { requests: 2, requestsWithoutUsage: 1, inputTokens: 30, totalTokens: 30 }
  });
});

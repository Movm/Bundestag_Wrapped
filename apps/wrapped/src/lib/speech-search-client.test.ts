import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeechSearchClient } from './speech-search-client';
import type { SpeechSearchResponse } from './speech-search-protocol';

class FakeWorker {
  static current: FakeWorker;
  onmessage?: (event: { data: SpeechSearchResponse }) => void;
  onerror?: () => void;
  onmessageerror?: () => void;
  sent: { id: number }[] = [];
  terminate = vi.fn();
  constructor() { FakeWorker.current = this; }
  postMessage(message: { id: number }) { this.sent.push(message); }
}
afterEach(() => vi.unstubAllGlobals());
describe('speech search request lifecycle', () => {
  it('correlates out-of-order replies and propagates worker errors', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const client = new SpeechSearchClient();
    const first = client.request({ type: 'detail', speechId: 1 });
    const second = client.request({ type: 'detail', speechId: 2 });
    const worker = FakeWorker.current;
    worker.onmessage!({ data: { id: worker.sent[1].id, type: 'page', data: { items: [], total: 2 } } });
    await expect(second).resolves.toMatchObject({ data: { total: 2 } });
    worker.onmessage!({ data: { id: worker.sent[0].id, type: 'error', message: 'missing asset' } });
    await expect(first).rejects.toThrow('missing asset');
    client.dispose();
  });
  it('rejects all pending requests when an edition is left', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const client = new SpeechSearchClient();
    const pending = client.request({ type: 'detail', speechId: 1 });
    client.dispose();
    await expect(pending).rejects.toThrow('Suche beendet');
    expect(FakeWorker.current.terminate).toHaveBeenCalledOnce();
    await expect(client.request({ type: 'detail', speechId: 2 })).rejects.toThrow('Suche beendet');
  });
});

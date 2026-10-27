import type { SpeechSearchRequest, SpeechSearchResponse } from './speech-search-protocol';

type RequestPayload = SpeechSearchRequest extends infer R ? R extends SpeechSearchRequest ? Omit<R, 'id'> : never : never;
export class SpeechSearchClient {
  private nextId = 0;
  private closed: Error | null = null;
  private pending = new Map<number, { resolve: (value: SpeechSearchResponse) => void; reject: (reason: Error) => void }>();
  private worker: Worker;
  constructor() {
    this.worker = new Worker(new URL('../workers/speech-search.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<SpeechSearchResponse>) => {
      const response = event.data;
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);
      if (response.type === 'error') pending.reject(new Error(response.message));
      else pending.resolve(response);
    };
    this.worker.onerror = () => this.dispose(new Error('Suchdienst konnte nicht gestartet werden'));
    this.worker.onmessageerror = () => this.dispose(new Error('Ungültige Antwort des Suchdienstes'));
  }
  request(payload: RequestPayload): Promise<SpeechSearchResponse> {
    if (this.closed) return Promise.reject(this.closed);
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ ...payload, id });
    });
  }
  dispose(reason = new Error('Suche beendet')) {
    this.closed = reason;
    this.worker.terminate();
    for (const pending of this.pending.values()) pending.reject(reason);
    this.pending.clear();
  }
}

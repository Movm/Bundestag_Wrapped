import type { SpeechSearchRequest, SpeechSearchResponse, SpeechWorkerMessage } from './speech-search-protocol';

type RequestPayload = SpeechSearchRequest extends infer R ? R extends SpeechSearchRequest ? Omit<R, 'id'> : never : never;
export class SpeechSearchClient {
  private nextId = 0;
  private started = performance.now();
  private profile = Boolean((globalThis as typeof globalThis & { __WRAPPED_PERFORMANCE__?: boolean }).__WRAPPED_PERFORMANCE__);
  private measure(name: string, duration: number, detail?: unknown) {
    if (!this.profile) return;
    performance.clearMeasures(name);
    performance.measure(name, { start: Math.max(0, performance.now() - duration), duration, detail });
  }
  private closed: Error | null = null;
  private pending = new Map<number, { resolve: (value: SpeechSearchResponse) => void; reject: (reason: Error) => void; started: number }>();
  private worker: Worker;
  constructor() {
    this.worker = new Worker(new URL('../workers/speech-search.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<SpeechWorkerMessage>) => {
      const response = event.data;
      if (response.type === 'ready') { this.measure('wrapped:speech-worker-startup', performance.now() - this.started); return; }
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);
      this.measure('wrapped:speech-round-trip', performance.now() - pending.started, response.type === 'page' ? response.timing : undefined);
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
      this.pending.set(id, { resolve, reject, started: performance.now() });
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

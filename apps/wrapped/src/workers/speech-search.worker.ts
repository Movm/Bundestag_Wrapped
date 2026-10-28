import { loadEditionAsset, type EditionAssetTiming } from '@/edition/loader';
import { SpeechSearchEngine } from '@/lib/speech-search-engine';
import { isSpeechSearchRequest, type SpeechSearchRequest, type SpeechSearchResponse } from '@/lib/speech-search-protocol';

let corpusKey = '';
let engine: Promise<SpeechSearchEngine> | undefined;
let loadTiming: EditionAssetTiming;
let engineMs = 0;
async function respond(request: SpeechSearchRequest): Promise<SpeechSearchResponse> {
  if (request.type === 'search') {
    const key = JSON.stringify([request.manifestUrl, request.asset]);
    const cold = key !== corpusKey || !engine;
    if (cold) {
      corpusKey = key;
      loadTiming = {};
      engine = loadEditionAsset(request.manifestUrl, request.asset, 'SpeechesAsset', loadTiming)
        .then(data => { const started = performance.now(); const result = new SpeechSearchEngine(data.speeches); engineMs = performance.now() - started; return result; });
    }
    const current = engine;
    try {
      const ready = await current!;
      const started = performance.now();
      const data = ready.search(request);
      return { id: request.id, type: 'page', data, timing: { cold, load: cold ? loadTiming : undefined, engineMs: cold ? engineMs : 0, queryMs: performance.now() - started } };
    }
    catch (error) { if (engine === current) engine = undefined; throw error; }
  }
  if (!engine) throw new Error('Reden noch nicht geladen');
  return { id: request.id, type: 'detail', data: (await engine).detail(request.speechId) };
}
self.onmessage = (event: MessageEvent<unknown>) => {
  // Dedicated Worker.postMessage events have an empty origin and a null source.
  // If a browser supplies an origin, only the worker's own origin is accepted.
  if (event.origin !== '' && event.origin !== self.location.origin) return;
  if (event.source !== null || !isSpeechSearchRequest(event.data)) return;
  const request = event.data;
  void respond(request).then(response => self.postMessage(response)).catch(error => {
    self.postMessage({ id: request.id, type: 'error', message: error instanceof Error ? error.message : 'Suche fehlgeschlagen' } satisfies SpeechSearchResponse);
  });
};

self.postMessage({ type: 'ready' });

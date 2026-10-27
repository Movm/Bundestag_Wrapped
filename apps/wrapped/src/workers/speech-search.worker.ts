import { loadEditionAsset } from '@/edition/loader';
import { SpeechSearchEngine } from '@/lib/speech-search-engine';
import { isSpeechSearchRequest, type SpeechSearchRequest, type SpeechSearchResponse } from '@/lib/speech-search-protocol';

let corpusKey = '';
let engine: Promise<SpeechSearchEngine> | undefined;
async function respond(request: SpeechSearchRequest): Promise<SpeechSearchResponse> {
  if (request.type === 'search') {
    const key = JSON.stringify([request.manifestUrl, request.asset]);
    if (key !== corpusKey || !engine) {
      corpusKey = key;
      engine = loadEditionAsset(request.manifestUrl, request.asset, 'SpeechesAsset')
        .then(data => new SpeechSearchEngine(data.speeches));
    }
    const current = engine;
    try { return { id: request.id, type: 'page', data: (await current).search(request) }; }
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

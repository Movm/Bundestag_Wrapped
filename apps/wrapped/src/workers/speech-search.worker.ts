import type { EditionAssetTiming } from '@/edition/loader';
import { createEditionSpeechSearch } from '@/lib/edition-speech-search';
import { isSpeechSearchRequest, type SpeechSearchRequest, type SpeechSearchResponse } from '@/lib/speech-search-protocol';

function createCorpus(request: Extract<SpeechSearchRequest, { type: 'search' }>) {
  const timing: EditionAssetTiming = {};
  return { key: JSON.stringify([request.manifestUrl, request.asset]), timing, delivered: false,
    ready: createEditionSpeechSearch(request.manifestUrl, request.asset, timing) };
}
let corpus: ReturnType<typeof createCorpus> | undefined;
async function respond(request: SpeechSearchRequest): Promise<SpeechSearchResponse> {
  if (request.type === 'search') {
    const key = JSON.stringify([request.manifestUrl, request.asset]);
    if (!corpus || key !== corpus.key) corpus = createCorpus(request);
    const current = corpus;
    let ready: Awaited<typeof current.ready>;
    try { ready = await current.ready; }
    catch (error) { if (corpus === current) corpus = undefined; throw error; }
    const started = performance.now(), initialBackend = ready.engine.kind;
    const data = await ready.engine.search(request);
    const cold = !current.delivered;
    current.delivered = true;
    return { id: request.id, type: 'page', data, timing: { cold, backend: ready.engine.kind, queryIncludesResources: initialBackend === 'index',
      load: cold ? current.timing : undefined, engineMs: cold ? ready.engineMs : 0, queryMs: performance.now() - started } };
  }
  if (!corpus) throw new Error('Reden noch nicht geladen');
  return { id: request.id, type: 'detail', data: await (await corpus.ready).engine.detail(request.speechId) };
}
self.onmessage = (event: MessageEvent<unknown>) => {
  // Dedicated Worker.postMessage events have an empty origin and a null source.
  if (event.origin !== '' && event.origin !== self.location.origin) return;
  if (event.source !== null || !isSpeechSearchRequest(event.data)) return;
  const request = event.data;
  void respond(request).then(response => self.postMessage(response)).catch(error => {
    self.postMessage({ id: request.id, type: 'error', message: error instanceof Error ? error.message : 'Suche fehlgeschlagen' } satisfies SpeechSearchResponse);
  });
};
self.postMessage({ type: 'ready' });

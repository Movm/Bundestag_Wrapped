/**
 * Runs inline at the end of <body>, before the app bundle (see the cover-shell
 * Vite plugin). Paints and animates the cover at first paint and starts the
 * edition requests the story will need, so neither waits for the main bundle.
 */
import { createCover } from './cover';
import { COVER_ROUTE, EAGLE_SRC, type CoverShell } from './shell';

const DATA_PATH = /^\/data\/(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*\.json$/;

function prefetch(match: RegExpMatchArray) {
  const cache = new Map<string, Promise<Response>>();
  window.__btPrefetch = cache;
  const get = (url: string) => {
    if (!DATA_PATH.test(url)) return Promise.reject(new Error('untrusted'));
    const request = fetch(url, { redirect: 'error' });
    cache.set(url, request);
    return request.then(response => (response.ok ? response.clone().json() : Promise.reject(new Error(String(response.status)))));
  };
  const asset = (manifestUrl: string, path: string) => new URL(path, new URL('.', new URL(manifestUrl, location.origin))).pathname;
  get('/data/editions.json')
    .then((registry: { currentEdition: string; editions: { id: string; manifestUrl: string }[] }) => {
      const id = match[1] ?? registry.currentEdition;
      const manifestUrl = registry.editions.find(edition => edition.id === id)?.manifestUrl;
      if (!manifestUrl) return;
      return get(manifestUrl).then((manifest: { content: string; assets: { wrapped: string } }) => {
        get(asset(manifestUrl, manifest.content)).catch(() => {});
        get(asset(manifestUrl, manifest.assets.wrapped)).catch(() => {});
      });
    })
    .catch(() => { /* the app loads everything itself and reports errors */ });
}

window.__btCreateCover = createCover;
const host = document.getElementById('cover-shell');
const match = location.pathname.match(COVER_ROUTE);
// The head script sets `cover-boot` only on story routes that show the cover (not on superseded editions).
if (host && match && document.documentElement.classList.contains('cover-boot')) {
  prefetch(match);
  const root = document.createElement('div');
  host.appendChild(root);
  const year = match[1] ?? document.documentElement.dataset.coverYear ?? null;
  const controller = createCover(root, { eagleSrc: EAGLE_SRC, year });
  const shell: CoverShell = { controller, host, startRequested: false };
  controller.onStart = () => { shell.startRequested = true; };
  window.__btCover = shell;
} else {
  host?.remove();
}

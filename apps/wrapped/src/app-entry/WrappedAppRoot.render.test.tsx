import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCover } from '@/cover/cover';
import { configureSite, SITE_ORIGIN } from '@/lib/site';
import WrappedAppRoot from './WrappedAppRoot';

// Raw JSON from apps/wrapped/public, loaded lazily per requested file.
const PUBLIC_FILES = import.meta.glob<string>('/public/data/**/*.json', { query: '?raw', import: 'default' });
const SLUG = 'aaron-valent';

window.matchMedia = ((query: string) => ({
  matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
})) as typeof window.matchMedia;
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } root = null; rootMargin = ''; thresholds = []; } as unknown as typeof IntersectionObserver;
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
// jsdom has no Web Animations; the cover only needs an inert handle.
Element.prototype.animate ??= function animate() {
  return { cancel() {}, finish() {}, pause() {}, play() {}, commit() {}, addEventListener() {}, removeEventListener() {}, finished: Promise.resolve(), onfinish: null } as unknown as Animation;
};
Element.prototype.scrollTo = (() => {}) as typeof Element.prototype.scrollTo;
window.scrollTo = (() => {}) as typeof window.scrollTo;

/** Serves the checked-in data from apps/wrapped/public; the 2026 edition is a basic-auth preview there. */
async function servePublic(input: RequestInfo | URL): Promise<Response> {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const pathname = new URL(raw, SITE_ORIGIN).pathname;
  const load = PUBLIC_FILES[`/public${pathname}`];
  if (!load) return new Response('not found', { status: 404 });
  return new Response(await load(), { status: 200, headers: { 'content-type': 'application/json' } });
}

let container: HTMLDivElement;
let root: Root;
let requested: string[];

beforeEach(() => {
  window.__btCreateCover = createCover;
  requested = [];
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
    requested.push(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    return servePublic(input);
  }));
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  configureSite({ embedded: false });
  delete window.__btCreateCover;
});

async function renderAt(initialPath: string, until: () => boolean) {
  await act(async () => root.render(<WrappedAppRoot initialPath={initialPath} />));
  for (let i = 0; i < 100 && !until(); i++) {
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
  }
}

describe('WrappedAppRoot', () => {
  it('renders the story cover for /2026', async () => {
    await renderAt('/2026', () => container.querySelector('#intro') !== null);
    expect(requested.some(url => url.startsWith(`${SITE_ORIGIN}/data/`))).toBe(true);
    expect(container.querySelector('#intro')).not.toBeNull();
  });

  it('renders the quiz for /2026/abgeordnete/<slug>/quiz', async () => {
    await renderAt(`/2026/abgeordnete/${SLUG}/quiz`, () => container.querySelector('main') !== null && !container.textContent?.includes('Fehler beim Laden') && (container.textContent?.length ?? 0) > 200);
    expect(container.textContent).not.toContain('Fehler beim Laden');
    expect(container.querySelector('main')).not.toBeNull();
    expect(requested.some(url => url.includes(`/speakers/${SLUG}`))).toBe(true);
  });
});

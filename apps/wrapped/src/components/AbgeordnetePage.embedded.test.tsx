import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureSite, SITE_ORIGIN } from '@/lib/site';
import WrappedAppRoot from '@/app-entry/WrappedAppRoot';

// Raw JSON from apps/wrapped/public, loaded lazily per requested file.
const PUBLIC_FILES = import.meta.glob<string>('/public/data/**/*.json', { query: '?raw', import: 'default' });

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
});

/** WrappedAppRoot embeds on first render; `browser` flips that back before any page content renders. */
async function renderAt(initialPath: string, until: () => boolean, browser = false) {
  await act(async () => root.render(<WrappedAppRoot initialPath={initialPath} />));
  if (browser) configureSite({ embedded: false });
  for (let i = 0; i < 100 && !until(); i++) {
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
  }
}
const text = () => container.textContent ?? '';

describe('AbgeordnetePage search link', () => {
  const ready = () => text().includes('Abgeordnete verfügbar');
  it('is hidden when embedded', async () => {
    await renderAt('/2026/abgeordnete', ready);
    expect(text()).not.toContain('Alle Abgeordneten durchsuchen');
  });
  it('is shown in the browser', async () => {
    await renderAt('/2026/abgeordnete', ready, true);
    const link = [...container.querySelectorAll('a')].find(el => el.textContent?.includes('Alle Abgeordneten durchsuchen'));
    expect(link?.getAttribute('href')).toBe('/2026/suche?tab=speakers');
  });
});

describe('AbgeordnetePage person links', () => {
  async function searchHain(browser: boolean) {
    await renderAt('/2026/abgeordnete', () => text().includes('Abgeordnete verfügbar'), browser);
    const input = container.querySelector('input')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Hain');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    for (let i = 0; i < 40 && !container.querySelector('a[href*="/abgeordnete/"]'); i++) {
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    }
    return [...container.querySelectorAll('a[href*="/abgeordnete/"]')].map(a => a.getAttribute('href')!);
  }
  it('sends every result link to the quiz when embedded', async () => {
    const hrefs = await searchHain(false);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^\/2026\/abgeordnete\/[^/]+\/quiz$/);
  });
  it('keeps the profile link in the browser', async () => {
    const hrefs = await searchHain(true);
    expect(hrefs.some(h => /^\/2026\/abgeordnete\/[^/]+$/.test(h))).toBe(true);
  });
});

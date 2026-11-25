/** @jest-environment jsdom */
import { interceptLinks, polyfillShare, reportCrashes } from './domShell';

const isAppRoute = (p: string) => ['/2026', '/2026/perfect-match', '/'].includes(p);

/** `event.defaultPrevented` is what the capture handler decided; the link itself then cancels jsdom's navigation. */
function click(href: string): { event: { defaultPrevented: boolean } } {
  const link = document.createElement('a');
  link.setAttribute('href', href);
  document.body.append(link);
  const seen = { defaultPrevented: false };
  link.addEventListener('click', e => { seen.defaultPrevented = e.defaultPrevented; e.preventDefault(); });
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  return { event: seen };
}

describe('interceptLinks', () => {
  let post: jest.Mock;
  let off: () => void;
  beforeEach(() => { post = jest.fn(); off = interceptLinks(post, isAppRoute); });
  afterEach(() => { off(); document.body.innerHTML = ''; });

  it('external link opens natively and is prevented', () => {
    const { event } = click('https://de.wikipedia.org/wiki/X');
    expect(post).toHaveBeenCalledWith({ type: 'openUrl', url: 'https://de.wikipedia.org/wiki/X' });
    expect(event.defaultPrevented).toBe(true);
  });

  it('internal non-app path opens the site, keeping query and hash', () => {
    const { event } = click('/2026/abgeordnete/max-muster?a=1#b');
    expect(post).toHaveBeenCalledWith({ type: 'openUrl', url: 'https://bundestag-wrapped.de/2026/abgeordnete/max-muster?a=1#b' });
    expect(event.defaultPrevented).toBe(true);
  });

  it('app route is left to the router', () => {
    const { event } = click('/2026/perfect-match');
    expect(post).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('app route with query and hash is still an app route', () => {
    click('/2026?x=1#y');
    expect(post).not.toHaveBeenCalled();
  });

  it('hash-only links and clicks outside links are ignored', () => {
    click('#top');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(post).not.toHaveBeenCalled();
  });
});

describe('polyfillShare', () => {
  it('posts base64 files and resolves on ok', async () => {
    const post = jest.fn();
    polyfillShare(post, async () => true);
    const file = new File(['hello'], 'bild.png', { type: 'image/png' });
    await navigator.share({ title: 'T', files: [file] });
    expect(post).toHaveBeenCalledWith({
      type: 'share', id: 1, title: 'T', text: undefined, url: undefined,
      files: [{ name: 'bild.png', type: 'image/png', base64: btoa('hello') }],
    });
  });

  it('rejects with AbortError when dismissed', async () => {
    polyfillShare(jest.fn(), async () => false);
    await expect(navigator.share({ url: 'https://x.test' })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('canShare reflects content', () => {
    polyfillShare(jest.fn(), async () => true);
    expect(navigator.canShare({ url: 'https://x.test' })).toBe(true);
    expect(navigator.canShare({})).toBe(false);
  });
});

describe('reportCrashes', () => {
  it('posts errors and rejections as log messages', () => {
    const post = jest.fn();
    const off = reportCrashes(post);
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom', filename: 'f.js', lineno: 3 }));
    const rejection = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(rejection, 'reason', { value: new Error('nope') });
    window.dispatchEvent(rejection);
    expect(post).toHaveBeenNthCalledWith(1, { type: 'log', level: 'error', text: 'boom @ f.js:3' });
    expect(post.mock.calls[1][0].text).toContain('nope');
    off();
  });

  it('does not loop when post itself throws', () => {
    const post = jest.fn(() => { window.dispatchEvent(new ErrorEvent('error', { message: 'again' })); throw new Error('post failed'); });
    const off = reportCrashes(post);
    window.dispatchEvent(new ErrorEvent('error', { message: 'first' }));
    expect(post).toHaveBeenCalledTimes(1);
    off();
  });
});

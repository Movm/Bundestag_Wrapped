/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "file:///app/www.bundle/x.html"}
 */
import { interceptLinks } from './domShell';

// Release build: the page is a file: URL, whose origin (like mailto:'s) is the opaque string "null".
const isAppRoute = (p: string) => p === '/2026';

function click(href: string) {
  const link = document.createElement('a');
  link.setAttribute('href', href);
  document.body.append(link);
  const seen = { defaultPrevented: false };
  link.addEventListener('click', e => { seen.defaultPrevented = e.defaultPrevented; e.preventDefault(); });
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  return seen;
}

describe('interceptLinks on a file: page', () => {
  const post = jest.fn();
  let off: () => void;
  beforeEach(() => { post.mockClear(); off = interceptLinks(post, isAppRoute); });
  afterEach(() => { off(); document.body.innerHTML = ''; });

  it('is on file:', () => expect(location.protocol).toBe('file:'));

  it('mailto and tel are not treated as internal paths', () => {
    expect(click('mailto:a@b.de').defaultPrevented).toBe(false);
    click('tel:+4930123');
    expect(post).not.toHaveBeenCalled();
  });

  it('root-relative non-app path opens the site', () => {
    click('/2026/abgeordnete/max');
    expect(post).toHaveBeenCalledWith({ type: 'openUrl', url: 'https://bundestag-wrapped.de/2026/abgeordnete/max' });
  });

  it('app route is left alone and https links open natively', () => {
    expect(click('/2026').defaultPrevented).toBe(false);
    click('https://de.wikipedia.org/wiki/X');
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({ type: 'openUrl', url: 'https://de.wikipedia.org/wiki/X' });
  });
});

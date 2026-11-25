import { afterEach, describe, expect, it } from 'vitest';

import { editionShareUrl, type EditionSurface } from '@/edition/surface';
import { resolveAssetUrl } from '@/edition/registry';
import { assetUrl, configureSite, isEmbedded, shareableUrl, siteBase, SITE_ORIGIN } from './site';

afterEach(() => configureSite({ embedded: false }));

describe('site base', () => {
  it('leaves paths untouched in the browser', () => {
    expect(isEmbedded()).toBe(false);
    expect(assetUrl('/data/editions.json')).toBe('/data/editions.json');
    expect(siteBase()).toBe(window.location.origin);
  });

  it('prefixes the site origin when embedded', () => {
    configureSite({ embedded: true });
    expect(isEmbedded()).toBe(true);
    expect(SITE_ORIGIN).toBe('https://bundestag-wrapped.de');
    expect(assetUrl('/sounds/start.wav')).toBe('https://bundestag-wrapped.de/sounds/start.wav');
    expect(siteBase()).toBe(SITE_ORIGIN);
  });

  it('keeps absolute and protocol-relative URLs', () => {
    configureSite({ embedded: true });
    expect(assetUrl('https://upload.wikimedia.org/x.jpg')).toBe('https://upload.wikimedia.org/x.jpg');
    expect(assetUrl('//cdn.x/y')).toBe('//cdn.x/y');
  });

  it('builds share URLs on the site origin when embedded', () => {
    const surface: EditionSurface = { editionId: '2026', dataVersion: 'v1', title: 'T', year: 2026, canonicalPath: '/2026' };
    expect(editionShareUrl(surface, 'perfect-match')).toBe(`${window.location.origin}/2026/perfect-match`);
    configureSite({ embedded: true });
    expect(editionShareUrl(surface, 'perfect-match')).toBe('https://bundestag-wrapped.de/2026/perfect-match');
  });

  it('resolveAssetUrl stays a same-origin path when embedded', () => {
    configureSite({ embedded: true });
    expect(resolveAssetUrl('/data/2026/preview/manifest.json', 'speakers/index.json')).toBe('/data/2026/preview/speakers/index.json');
  });

  it('shareableUrl is the page URL in the browser and the site path when embedded', () => {
    expect(shareableUrl('/2026/abgeordnete/x/quiz', '?a=1')).toBe(window.location.href);
    configureSite({ embedded: true });
    expect(shareableUrl('/2026/abgeordnete/x/quiz', '?a=1')).toBe('https://bundestag-wrapped.de/2026/abgeordnete/x/quiz?a=1');
  });
});

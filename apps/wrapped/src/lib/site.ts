/**
 * Where data and assets come from. In the browser every path stays root-relative
 * (same origin, byte-identical requests). Embedded in the app there is no site
 * origin, so root-relative paths are prefixed with the production site.
 */
export const SITE_ORIGIN = 'https://bundestag-wrapped.de';

let embedded = false;

/** Called once by the app entry; the browser never calls it. */
export function configureSite(options: { embedded: boolean }): void {
  embedded = options.embedded;
}

export function isEmbedded(): boolean {
  return embedded;
}

export function siteBase(): string {
  if (embedded) return SITE_ORIGIN;
  return typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
}

/** Root-relative paths (`/x`, not `//x`) get the site origin when embedded; everything else is untouched. */
export function assetUrl(path: string): string {
  if (!embedded || !path.startsWith('/') || path.startsWith('//')) return path;
  return SITE_ORIGIN + path;
}

/** The public URL of a page for sharing. Embedded, the WebView location is a file or dev-server URL, so use the router path on the site. */
export function shareableUrl(pathname: string, search: string): string {
  if (embedded) return SITE_ORIGIN + pathname + search;
  return typeof window === 'undefined' ? SITE_ORIGIN + pathname + search : window.location.href;
}

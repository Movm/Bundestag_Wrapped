import type { EditionManifest, EditionsIndex } from '@/generated/wrapped-contract-v1';
import { matchPath } from 'react-router';
import { isEmbedded, siteBase } from '@/lib/site';

export type EditionRegistry = EditionsIndex;
export type Edition = EditionManifest;

export const LEGACY_EDITION_ID = 'legacy';
/** Static top-level names that are pages, never edition ids (pinned to App.tsx by routes/reserved-routes.test.ts). */
export const RESERVED_ROUTES = new Set(['abgeordnete', 'datenschutz', 'dokumentation', 'mcp', 'reden', 'statistiken', 'suche', 'terms', 'wrapped']);

/** The only routes the app renders itself; every other internal path opens on the website. */
export const APP_ROUTE_PATTERNS = [
  '/',
  '/:editionId',
  '/:editionId/abgeordnete',
  '/:editionId/abgeordnete/:slug/quiz',
  '/:editionId/perfect-match',
] as const;

/** Takes a pathname (`URL.pathname`), not a href: a query or hash never matches. */
export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PATTERNS.some(pattern => {
    const match = matchPath(pattern, pathname);
    if (!match) return false;
    const editionId = match.params.editionId;
    if (editionId === undefined) return true;
    return !RESERVED_ROUTES.has(editionId);
  });
}

/** In the browser every page exists; embedded, only the app routes do. `path` may carry a query or hash. */
export function appHas(path: string): boolean {
  if (!isEmbedded()) return true;
  return isAppRoute(path.split(/[?#]/)[0]);
}

export function isEditionId(value: string | undefined): value is string {
  return Boolean(value) && !RESERVED_ROUTES.has(value!);
}

export function resolveAssetUrl(manifestUrl: string, asset: string): string {
  const manifest = new URL(manifestUrl, siteBase());
  return new URL(asset, new URL('.', manifest)).pathname;
}

/**
 * A superseded edition is offline: its routes show the construction page. When
 * the current edition is superseded, the front door ("/") shows it too, until the
 * next edition is published and becomes current.
 */
export function isRetired(registry: EditionRegistry, editionId: string): boolean {
  return registry.editions.find(item => item.id === editionId)?.status === 'superseded';
}

export function currentEditionPath(registry: EditionRegistry): string {
  const edition = registry.editions.find(item => item.id === registry.currentEdition);
  if (!edition) throw new Error(`Invalid editions index: current edition ${registry.currentEdition} is not listed`);
  return `/${edition.id}`;
}

export function resolveLegacyEditionPath(registry: EditionRegistry, pathname: string): string | null {
  const basePath = currentEditionPath(registry);
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/suche' || normalized === '/reden') return `${basePath}/suche`;
  if (normalized === '/abgeordnete') return `${basePath}/abgeordnete`;
  if (normalized === '/dokumentation') return `${basePath}/dokumentation`;
  if (normalized.startsWith('/wrapped/')) return `${basePath}${normalized}`;
  if (normalized.startsWith('/abgeordnete/')) return `${basePath}${normalized}`;
  return null;
}

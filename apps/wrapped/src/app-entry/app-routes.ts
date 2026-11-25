import { matchPath } from 'react-router';
import { RESERVED_ROUTES } from '@/edition/registry';
import { isEmbedded } from '@/lib/site';

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

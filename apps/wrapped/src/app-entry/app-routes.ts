import { matchPath } from 'react-router';
import { RESERVED_ROUTES } from '@/edition/registry';

/** The only routes the app renders itself; every other internal path opens on the website. */
export const APP_ROUTE_PATTERNS = [
  '/',
  '/:editionId',
  '/:editionId/abgeordnete',
  '/:editionId/abgeordnete/:slug/quiz',
  '/:editionId/perfect-match',
] as const;

/** Edition ids are years; this keeps static top-level pages such as `/terms` out. */
const EDITION_ID = /^\d{4}$/;

export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PATTERNS.some(pattern => {
    const match = matchPath(pattern, pathname);
    if (!match) return false;
    const editionId = match.params.editionId;
    if (editionId === undefined) return true;
    return !RESERVED_ROUTES.has(editionId) && EDITION_ID.test(editionId);
  });
}

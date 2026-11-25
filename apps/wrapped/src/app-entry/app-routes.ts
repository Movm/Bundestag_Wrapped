// Lives in edition/registry.ts so the pages that call appHas() do not pull a separate chunk for it.
export { APP_ROUTE_PATTERNS, appHas, isAppRoute } from '@/edition/registry';

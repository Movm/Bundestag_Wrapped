import type { EditionManifest, EditionsIndex } from '@/generated/wrapped-contract-v1';

export type EditionRegistry = EditionsIndex;
export type Edition = EditionManifest;

export const LEGACY_EDITION_ID = 'legacy';
export const RESERVED_ROUTES = new Set(['abgeordnete', 'datenschutz', 'dokumentation', 'mcp', 'reden', 'suche', 'wrapped']);

export function isEditionId(value: string | undefined): value is string {
  return Boolean(value) && !RESERVED_ROUTES.has(value!);
}

export function resolveAssetUrl(manifestUrl: string, asset: string): string {
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const manifest = new URL(manifestUrl, origin);
  return new URL(asset, new URL('.', manifest)).pathname;
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

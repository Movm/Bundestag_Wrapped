import type { EditionManifest, EditionsIndex } from '@/generated/wrapped-contract-v1';

export type EditionRegistry = EditionsIndex;
export type Edition = EditionManifest;

export const LEGACY_EDITION_ID = 'legacy';
export const RESERVED_ROUTES = new Set(['abgeordnete', 'datenschutz', 'dokumentation', 'mcp', 'reden', 'suche', 'wrapped']);

export function isEditionId(value: string | undefined): value is string {
  return Boolean(value) && !RESERVED_ROUTES.has(value!);
}

export function resolveAssetUrl(manifestUrl: string, asset: string): string {
  const manifest = new URL(manifestUrl, window.location.origin);
  return new URL(asset, new URL('.', manifest)).pathname;
}

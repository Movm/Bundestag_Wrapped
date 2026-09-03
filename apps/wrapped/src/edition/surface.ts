import type { EditionContextValue } from './types';

export interface EditionSurface {
  editionId: string;
  dataVersion: string;
  title: string;
  year?: number;
  canonicalPath: string;
}

export const LEGACY_SURFACE: EditionSurface = {
  editionId: 'legacy',
  dataVersion: 'legacy',
  title: 'Bundestag Wrapped',
  canonicalPath: '/',
};

/**
 * Keeps browser-visible labels and persisted keys tied to the loaded edition.
 * The legacy route deliberately has no year label: it is only a compatibility
 * adapter until published edition data is available.
 */
export function editionSurface(edition: Pick<EditionContextValue, 'editionId' | 'manifest'> | null): EditionSurface {
  const manifest = edition?.manifest;
  if (!manifest) return LEGACY_SURFACE;

  return {
    editionId: manifest.editionId,
    dataVersion: manifest.dataVersion,
    title: manifest.title,
    year: manifest.year,
    canonicalPath: `/${manifest.editionId}`,
  };
}

export function editionPath(surface: EditionSurface, path = ''): string {
  const suffix = path.replace(/^\/+/, '');
  if (surface.editionId === LEGACY_SURFACE.editionId) return suffix ? `/${suffix}` : '/';
  return suffix ? `${surface.canonicalPath}/${suffix}` : surface.canonicalPath;
}

export function editionShareUrl(surface: EditionSurface, path = ''): string {
  const target = editionPath(surface, path);
  if (typeof window === 'undefined') return target;
  return new URL(target, window.location.origin).toString();
}

export function editionStorageKey(base: string, surface: Pick<EditionSurface, 'editionId' | 'dataVersion'> = LEGACY_SURFACE): string {
  return `${base}:${surface.editionId}:${surface.dataVersion}`;
}

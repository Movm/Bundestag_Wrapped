import { describe, expect, it } from 'vitest';
import { editionPath, editionStorageKey, editionSurface } from './surface';

const edition = {
  editionId: '2026',
  manifest: {
    editionId: '2026',
    dataVersion: '2026-08-31',
    title: 'Bundestag Wrapped 2026',
    year: 2026,
  },
};

describe('edition surface', () => {
  it('uses the published edition for public URLs and browser keys', () => {
    const surface = editionSurface(edition as never);
    expect(surface.canonicalPath).toBe('/2026');
    expect(editionPath(surface, 'wrapped/max-mustermann')).toBe('/2026/wrapped/max-mustermann');
    expect(editionStorageKey('quiz', surface)).toBe('quiz:2026:2026-08-31');
  });

  it('keeps the legacy adapter neutral and unyearred', () => {
    const surface = editionSurface(null);
    expect(surface.title).toBe('Bundestag Wrapped');
    expect(editionPath(surface, 'suche')).toBe('/suche');
  });
});

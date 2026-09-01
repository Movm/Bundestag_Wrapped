import { describe, expect, it } from 'vitest';

import { currentEditionPath, isEditionId, resolveAssetUrl, resolveLegacyEditionPath } from './registry';
import type { EditionRegistry } from './registry';

const registry: EditionRegistry = {
  schemaVersion: 1,
  currentEdition: 'edition-b',
  editions: [
    { id: 'edition-a', year: 2025, status: 'published', manifestUrl: '/fixtures/a/manifest.json' },
    { id: 'edition-b', year: 2026, status: 'preview', manifestUrl: '/fixtures/b/manifest.json' },
  ],
};

describe('edition routing helpers', () => {
  it('does not treat reserved static routes as editions', () => {
    expect(isEditionId('dokumentation')).toBe(false);
    expect(isEditionId('2026')).toBe(true);
  });

  it('resolves assets relative to the versioned manifest', () => {
    expect(resolveAssetUrl('/data/2026/preview/manifest.json', 'speakers/index.json')).toBe('/data/2026/preview/speakers/index.json');
  });

  it('uses the registry currentEdition instead of a hardcoded year', () => {
    expect(currentEditionPath(registry)).toBe('/edition-b');
  });

  it('redirects every legacy edition surface while leaving static routes unmapped', () => {
    expect(resolveLegacyEditionPath(registry, '/wrapped/shared-slug')).toBe('/edition-b/wrapped/shared-slug');
    expect(resolveLegacyEditionPath(registry, '/suche')).toBe('/edition-b/suche');
    expect(resolveLegacyEditionPath(registry, '/reden')).toBe('/edition-b/suche');
    expect(resolveLegacyEditionPath(registry, '/abgeordnete')).toBe('/edition-b/abgeordnete');
    expect(resolveLegacyEditionPath(registry, '/abgeordnete/shared-slug')).toBe('/edition-b/abgeordnete/shared-slug');
    expect(resolveLegacyEditionPath(registry, '/dokumentation')).toBe('/edition-b/dokumentation');
    expect(resolveLegacyEditionPath(registry, '/mcp')).toBeNull();
    expect(resolveLegacyEditionPath(registry, '/datenschutz')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { buildDevRegistry } from './prepare-dev-edition.mjs';

describe('local preview registry', () => {
  it('keeps the published current edition and adds a dev-only preview', () => {
    const registry = buildDevRegistry({
      schemaVersion: 1,
      currentEdition: '2025',
      editions: [{ id: '2025', year: 2025, status: 'published', manifestUrl: '/data/2025/final/manifest.json' }],
    }, {
      editionId: '2026',
      year: 2026,
    }, 'preview-2026-10-12');

    expect(registry.currentEdition).toBe('2025');
    expect(registry.editions).toEqual([
      { id: '2025', year: 2025, status: 'published', manifestUrl: '/data/2025/final/manifest.json' },
      { id: '2026', year: 2026, status: 'preview', manifestUrl: '/__dev-editions/2026/preview-2026-10-12/manifest.json' },
    ]);
  });
});

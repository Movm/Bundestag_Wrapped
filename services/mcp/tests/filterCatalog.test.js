import { describe, it, expect } from 'vitest';
import { filterCatalogTool } from '../src/tools/filterCatalog.js';

const ALL_SURFACES = ['semantic_search', 'search_speeches', 'search_document_sections', 'dip'];

describe('bundestag_get_filters', () => {
  it('has the fields the MCP registration requires', () => {
    expect(filterCatalogTool.name).toBe('bundestag_get_filters');
    expect(typeof filterCatalogTool.description).toBe('string');
    expect(filterCatalogTool.description.length).toBeGreaterThan(0);
    expect(typeof filterCatalogTool.inputSchema).toBe('object');
    expect(typeof filterCatalogTool.handler).toBe('function');
  });

  it('scope "all" returns every surface with a filters array', () => {
    const res = filterCatalogTool.handler({ scope: 'all' });
    expect(res.success).toBe(true);
    expect(res.scope).toBe('all');
    expect(Object.keys(res.surfaces).sort()).toEqual([...ALL_SURFACES].sort());
    for (const surface of Object.values(res.surfaces)) {
      expect(typeof surface.tool).toBe('string');
      expect(Array.isArray(surface.filters)).toBe(true);
      expect(surface.filters.length).toBeGreaterThan(0);
      for (const f of surface.filters) {
        expect(typeof f.field).toBe('string');
        expect(typeof f.type).toBe('string');
        expect(typeof f.valueSource).toBe('string');
      }
    }
  });

  it('defaults scope to "all" when omitted', () => {
    const res = filterCatalogTool.handler({});
    expect(res.scope).toBe('all');
    expect(Object.keys(res.surfaces).length).toBe(ALL_SURFACES.length);
  });

  it('scope filter narrows to a single surface', () => {
    const res = filterCatalogTool.handler({ scope: 'search_speeches' });
    expect(res.scope).toBe('search_speeches');
    expect(Object.keys(res.surfaces)).toEqual(['search_speeches']);
  });

  it('documents the short-vs-long party naming difference', () => {
    const res = filterCatalogTool.handler({ scope: 'all' });
    expect(res.partyNaming.speechesShortNames).toContain('GRÜNE');
    expect(res.partyNaming.dipAndSemanticLongNames).toContain('BÜNDNIS 90/DIE GRÜNEN');
    // The short-name list must NOT contain the long GRÜNE spelling and vice versa.
    expect(res.partyNaming.speechesShortNames).not.toContain('BÜNDNIS 90/DIE GRÜNEN');
    expect(res.partyNaming.dipAndSemanticLongNames).not.toContain('GRÜNE');
  });

  it('speeches speakerParty lists SHORT names, dip fraktion lists LONG names', () => {
    const res = filterCatalogTool.handler({ scope: 'all' });
    const speakerParty = res.surfaces.search_speeches.filters.find(f => f.field === 'speakerParty');
    expect(speakerParty.values).toContain('GRÜNE');
    const dipFraktion = res.surfaces.dip.filters.find(f => f.field === 'fraktion');
    expect(dipFraktion.values).toContain('BÜNDNIS 90/DIE GRÜNEN');
  });
});

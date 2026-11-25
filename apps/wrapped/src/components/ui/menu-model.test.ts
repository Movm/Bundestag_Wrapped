import { describe, expect, it } from 'vitest';
import { isAppRoute } from '@/app-entry/app-routes';
import { LEGACY_SURFACE, type EditionSurface } from '@/edition/surface';
import { buildMenu } from './menu-model';

const surface: EditionSurface = { editionId: '2026', dataVersion: 'v1', title: 'Bundestag Wrapped', year: 2026, canonicalPath: '/2026' };
const base = { pathname: '/2026', search: '', hash: '', surface, hasMatch: false };

describe('buildMenu', () => {
  it('lists wrapped, abgeordnete, dokumentation and mcp without a match asset', () => {
    expect(buildMenu({ ...base, hasMatch: false }).entries.map(e => e.label)).toEqual([
      'Bundestag Wrapped',
      'Abgeordnete-Wrapped',
      'Dokumentation',
      'MCP-Server',
    ]);
  });

  it('adds Perfect Match as the third entry when the edition has a match asset', () => {
    const entries = buildMenu({ ...base, hasMatch: true }).entries;
    expect(entries.map(e => e.label)).toEqual(['Bundestag Wrapped', 'Abgeordnete-Wrapped', 'Perfect Match', 'Dokumentation', 'MCP-Server']);
    expect(entries[2]).toMatchObject({ href: '/2026/perfect-match', color: 'mint', rotate: -1.5, tile: false });
  });

  it('keeps colors, rotations, tiles and the soft hyphen exactly', () => {
    const entries = buildMenu(base).entries;
    expect(entries.map(e => [e.color, e.rotate, e.tile])).toEqual([
      ['pink', -2, false],
      ['violet', 1.5, false],
      ['white', -1, true],
      ['mint', 2, true],
    ]);
    expect(entries[2].title).toBe('Doku­mentation');
  });

  it('keeps search and hash on every in-edition href', () => {
    const entries = buildMenu({ ...base, search: '?a=1', hash: '#x' }).entries;
    expect(entries.map(e => e.href)).toEqual(['/2026?a=1#x', '/2026/abgeordnete?a=1#x', '/2026/dokumentation?a=1#x', '/mcp']);
  });

  it('marks only the current page active and isMainPage only on the edition root', () => {
    const root = buildMenu({ ...base, search: '?a=1' });
    expect(root.isMainPage).toBe(true);
    expect(root.entries.filter(e => e.active).map(e => e.label)).toEqual(['Bundestag Wrapped']);
    const sub = buildMenu({ ...base, pathname: '/2026/abgeordnete' });
    expect(sub.isMainPage).toBe(false);
    expect(sub.entries.filter(e => e.active).map(e => e.label)).toEqual(['Abgeordnete-Wrapped']);
  });

  it('uses root paths on the legacy surface', () => {
    const menu = buildMenu({ ...base, surface: LEGACY_SURFACE, pathname: '/' });
    expect(menu.entries[0].href).toBe('/');
    expect(menu.entries[1].href).toBe('/abgeordnete');
    expect(menu.isMainPage).toBe(true);
  });

  it('footer has Datenschutz, Nutzungsbedingungen and the external Impressum', () => {
    expect(buildMenu(base).footer).toEqual([
      { href: '/datenschutz', label: 'Datenschutz', external: false },
      { href: '/terms', label: 'Nutzungsbedingungen', external: false },
      { href: 'https://www.moritz-waechter.de/impressum', label: 'Impressum', external: true },
    ]);
  });

  it('with appRoutesOnly, Dokumentation, MCP-Server, Datenschutz and Nutzungsbedingungen become absolute site URLs and app routes stay relative', () => {
    const menu = buildMenu({ ...base, search: '?a=1', appRoutesOnly: isAppRoute });
    const href = (label: string) => menu.entries.find(e => e.label === label)!.href;
    expect(href('Dokumentation')).toBe('https://bundestag-wrapped.de/2026/dokumentation?a=1');
    expect(href('MCP-Server')).toBe('https://bundestag-wrapped.de/mcp');
    expect(href('Abgeordnete-Wrapped')).toBe('/2026/abgeordnete?a=1');
    expect(href('Bundestag Wrapped')).toBe('/2026?a=1');
    expect(menu.footer).toEqual([
      { href: 'https://bundestag-wrapped.de/datenschutz', label: 'Datenschutz', external: true },
      { href: 'https://bundestag-wrapped.de/terms', label: 'Nutzungsbedingungen', external: true },
      { href: 'https://www.moritz-waechter.de/impressum', label: 'Impressum', external: true },
    ]);
  });
});

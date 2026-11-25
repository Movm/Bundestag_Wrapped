import { SITE_ORIGIN } from '@/lib/site';
import { editionPath, type EditionSurface } from '@/edition/surface';
import type { MenuEntry, MenuFooterLink } from '@/shared/native-bridge/protocol';

interface MenuInput {
  pathname: string;
  search: string;
  hash: string;
  surface: EditionSurface;
  hasMatch: boolean;
  /** Set in the native shell: everything that is not an app route opens on the website. */
  appRoutesOnly?: (pathname: string) => boolean;
}

const FOOTER_LINKS: MenuFooterLink[] = [
  { href: '/datenschutz', label: 'Datenschutz', external: false },
  { href: '/terms', label: 'Nutzungsbedingungen', external: false },
  { href: 'https://www.moritz-waechter.de/impressum', label: 'Impressum', external: true },
];

const pathOf = (href: string) => href.split(/[?#]/)[0];

export function buildMenu({ pathname, search, hash, surface, hasMatch, appRoutesOnly }: MenuInput): {
  entries: MenuEntry[];
  footer: MenuFooterLink[];
  isMainPage: boolean;
} {
  const suffix = `${search}${hash}`;
  const toSite = (href: string) => (appRoutesOnly && href.startsWith('/') && !appRoutesOnly(pathOf(href)) ? SITE_ORIGIN + href : href);
  const raw: Omit<MenuEntry, 'active'>[] = [
    { href: `${editionPath(surface)}${suffix}`, label: 'Bundestag Wrapped', title: 'Bundestag Wrapped', color: 'pink', rotate: -2, tile: false },
    { href: `${editionPath(surface, 'abgeordnete')}${suffix}`, label: 'Abgeordnete-Wrapped', title: 'Abgeordnete-Wrapped', color: 'violet', rotate: 1.5, tile: false },
    ...(hasMatch
      ? [{ href: `${editionPath(surface, 'perfect-match')}${suffix}`, label: 'Perfect Match', title: 'Perfect Match', color: 'mint', rotate: -1.5, tile: false } as const]
      : []),
    // Soft hyphen keeps long German words from overflowing the narrow tiles.
    { href: `${editionPath(surface, 'dokumentation')}${suffix}`, label: 'Dokumentation', title: 'Doku­mentation', color: 'white', rotate: -1, tile: true },
    { href: '/mcp', label: 'MCP-Server', title: 'MCP-Server', color: 'mint', rotate: 2, tile: true },
  ];

  return {
    entries: raw.map(item => ({ ...item, active: pathname === pathOf(item.href), href: toSite(item.href) })),
    footer: FOOTER_LINKS.map(link => {
      const href = toSite(link.href);
      return { ...link, href, external: link.external || href !== link.href };
    }),
    isMainPage: pathname === editionPath(surface),
  };
}

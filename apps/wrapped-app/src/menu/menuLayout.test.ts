import { type MenuEntry } from '../../../wrapped/src/shared/native-bridge/protocol';
import { cardAccessibilityLabel, cardLabel, cardRotation, drawerWidth, hyphenateTitle, splitMenu, TITLE_ADVANCE, tileTitleSize, titleBoxWidth, wideTitleSize } from './menuLayout';

const entry = (title: string, tile: boolean, active = false): MenuEntry => ({
  href: `/${title}`,
  label: title,
  title,
  color: 'pink',
  rotate: -2,
  tile,
  active,
});

const five = [
  entry('Wrapped', false, true),
  entry('Abgeordnete', false),
  entry('Perfect Match', false),
  entry('Dokumentation', true),
  entry('MCP', true),
];

describe('splitMenu', () => {
  it('splits five entries into two lead cards and a grid of three; Perfect Match in the grid is a wide card (tile false), Dokumentation and MCP-Server are tiles', () => {
    const { lead, grid } = splitMenu(five);
    expect(lead.map(e => e.title)).toEqual(['Wrapped', 'Abgeordnete']);
    expect(grid.map(e => e.title)).toEqual(['Perfect Match', 'Dokumentation', 'MCP']);
    expect(grid.map(e => e.tile)).toEqual([false, true, true]);
  });

  it('handles lists shorter than two', () => {
    expect(splitMenu([])).toEqual({ lead: [], grid: [] });
    expect(splitMenu(five.slice(0, 1))).toEqual({ lead: five.slice(0, 1), grid: [] });
  });
});

describe('cardRotation', () => {
  it('applies the entry rotation', () => {
    expect(cardRotation(-1.5, false)).toBe(-1.5);
  });
  it('reduced motion renders the cards without rotation', () => {
    expect(cardRotation(-1.5, true)).toBe(0);
  });
});

describe('cardLabel', () => {
  it('numbers by list position and marks the active wide card', () => {
    expect(cardLabel(five[0], 0)).toBe('01 · Du bist hier');
    expect(cardLabel(five[1], 1)).toBe('02');
  });
  it('never marks tiles as active', () => {
    expect(cardLabel(entry('x', true, true), 4)).toBe('05');
  });
});

describe('sizes', () => {
  it('drawer is min(448, width - 28)', () => {
    expect(drawerWidth(402)).toBe(374);
    expect(drawerWidth(375)).toBe(347);
    expect(drawerWidth(1024)).toBe(448);
  });
  it('wide title is clamp(20, 16 + 1.6vw, 25) (README: 22.43 at 402, 22 at 375, 25 at 1024)', () => {
    expect(wideTitleSize(402)).toBeCloseTo(22.432, 3);
    expect(wideTitleSize(375)).toBeCloseTo(22, 3);
    expect(wideTitleSize(1024)).toBe(25);
  });
  it('tile title is clamp(15, 12.8 + 0.7vw, 17) (README: 15.61 at 402, 15.43 at 375, 17 at 1024)', () => {
    expect(tileTitleSize(402)).toBeCloseTo(15.614, 3);
    expect(tileTitleSize(375)).toBeCloseTo(15.425, 3);
    expect(tileTitleSize(1024)).toBe(17);
  });
});

describe('cardAccessibilityLabel', () => {
  it('announces the active card as current page and strips soft hyphens', () => {
    expect(cardAccessibilityLabel(entry('Wrapped', false, true))).toBe('Wrapped, aktuelle Seite');
    expect(cardAccessibilityLabel(entry('Doku\u00admentation', true))).toBe('Dokumentation');
  });
});

describe('hyphenateTitle', () => {
  const SHY = '\u00ad';
  const wide = (width: number, index: number) => ({ width: titleBoxWidth(width, { tile: false }, index), size: wideTitleSize(width), advance: TITLE_ADVANCE.wide });
  const tile = (width: number, index: number) => ({ width: titleBoxWidth(width, { tile: true }, index), size: tileTitleSize(width), advance: TITLE_ADVANCE.tile });
  it('hyphenates a word that cannot fit the half tile (PERFECT on a phone)', () => {
    expect(hyphenateTitle('Perfect Match', wide(402, 2))).toBe(`Per${SHY}fect Match`);
  });
  it('leaves words that fit alone: wide cards wrap between words', () => {
    expect(hyphenateTitle('Bundestag Wrapped', wide(402, 0))).toBe('Bundestag Wrapped');
    expect(hyphenateTitle('Bundestag Wrapped', wide(768, 0))).toBe('Bundestag Wrapped');
    expect(hyphenateTitle('Abgeordnete-Wrapped', wide(402, 1))).toBe('Abgeordnete-Wrapped');
  });
  it('leaves short words and existing hyphens alone', () => {
    expect(hyphenateTitle('MCP-Server', tile(402, 4))).toBe('MCP-Server');
  });
  it('drops the web soft hyphen when the word fits, re-adds one when it does not', () => {
    expect(hyphenateTitle(`Doku${SHY}mentation`, { width: 1000, size: 17, advance: 0.85 })).toBe('Dokumentation');
    expect(hyphenateTitle(`Doku${SHY}mentation`, tile(402, 3))).toContain(SHY);
  });
  it('never changes the visible letters', () => {
    for (const t of ['Bundestag Wrapped', 'Abgeordnete-Wrapped', 'Dokumentation', 'Perfect Match', 'MCP-Server']) {
      expect(hyphenateTitle(t, tile(402, 3)).replace(/\u00ad/g, '')).toBe(t);
    }
  });
});

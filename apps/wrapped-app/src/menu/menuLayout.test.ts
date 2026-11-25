import { type MenuEntry } from '../../../wrapped/src/shared/native-bridge/protocol';
import { cardLabel, cardRotation, drawerWidth, splitMenu, tileTitleSize, wideTitleSize } from './menuLayout';

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

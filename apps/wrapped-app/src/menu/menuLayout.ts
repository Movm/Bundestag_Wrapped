import { type MenuEntry } from '../../../wrapped/src/shared/native-bridge/protocol';

export const DRAWER_MAX_WIDTH = 448;
export const DRAWER_MARGIN = 28;

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

/** The first two entries stand wide above each other, the rest forms the two-column grid. Looks come from `entry.tile`, not from the position. */
export function splitMenu(entries: MenuEntry[]): { lead: MenuEntry[]; grid: MenuEntry[] } {
  return { lead: entries.slice(0, 2), grid: entries.slice(2) };
}

/** min(28rem, 100vw - 1.75rem) */
export const drawerWidth = (screenWidth: number) => Math.min(DRAWER_MAX_WIDTH, screenWidth - DRAWER_MARGIN);

/** clamp(1.25rem, 1rem + 1.6vw, 1.5625rem) */
export const wideTitleSize = (screenWidth: number) => clamp(20, 16 + 0.016 * screenWidth, 25);

/** clamp(0.9375rem, 0.8rem + 0.7vw, 1.0625rem) */
export const tileTitleSize = (screenWidth: number) => clamp(15, 12.8 + 0.007 * screenWidth, 17);

/** Reduced motion renders the cards upright (web: CSS `transform: none`). */
export const cardRotation = (rotate: number, reduceMotion: boolean) => (reduceMotion ? 0 : rotate);

/** "01", or "01 · Du bist hier" on the active wide card. The number is the position in the whole list. */
export function cardLabel(entry: MenuEntry, index: number): string {
  const number = String(index + 1).padStart(2, '0');
  return entry.active && !entry.tile ? `${number} · Du bist hier` : number;
}

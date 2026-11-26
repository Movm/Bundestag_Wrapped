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

/** Screen-reader name: the title without soft hyphens, plus ", aktuelle Seite" on the active card. */
export const cardAccessibilityLabel = (entry: MenuEntry) =>
  `${entry.title.replace(/\u00ad/g, '')}${entry.active ? ', aktuelle Seite' : ''}`;

const isVowel = (c: string | undefined) => !!c && /[aeiouyäöü]/i.test(c);
const LONG_WORD = /[A-Za-zÄÖÜäöüß\u00ad]{7,}/g;

/** One break point per long word (VC|CV or V|CV), the one closest to the middle; none found → unchanged. */
function softBreak(word: string): string {
  if (word.includes('\u00ad')) return word;
  let best = -1;
  for (let i = 3; i <= word.length - 3; i++) {
    const vccv = isVowel(word[i - 2]) && !isVowel(word[i - 1]) && !isVowel(word[i]) && isVowel(word[i + 1]);
    const vcv = isVowel(word[i - 1]) && !isVowel(word[i]) && isVowel(word[i + 1]);
    if (!vccv && !vcv) continue;
    if (best === -1 || Math.abs(i - word.length / 2) < Math.abs(best - word.length / 2)) best = i;
  }
  return best === -1 ? word : `${word.slice(0, best)}\u00ad${word.slice(best)}`;
}

/** Measured on device (iPad, drawer 448): average advance incl. letter-spacing, in em, per title font. */
export const TITLE_ADVANCE = { wide: 0.82, tile: 0.85 } as const;

/** The advance is an average; wide glyph runs ("PERFECT" on a 440 pt phone) come out wider. A word counts as fitting only below this share of the box. */
const FIT_SHARE = 0.85;

const DRAWER_PADDING_X = 22;
const GRID_GAP = 12;

/** Width the title text can use: full drawer content for the lead cards, one grid column otherwise (index >= 2), minus the card padding. */
export function titleBoxWidth(screenWidth: number, entry: { tile: boolean }, index: number): number {
  const content = drawerWidth(screenWidth) - 2 * DRAWER_PADDING_X;
  const column = index >= 2 ? (content - GRID_GAP) / 2 : content;
  return column - 2 * (entry.tile ? 18 : 22);
}

/**
 * iOS has no automatic hyphenation: a word wider than its box breaks mid-word ("PERFEC / T"). So a soft hyphen goes only
 * into words that cannot fit the box at all; words that fit stay whole and wrap between words. Manual soft hyphens
 * from the web title are dropped first, the decision is made here. The web title stays untouched.
 */
export function hyphenateTitle(title: string, box: { width: number; size: number; advance: number }): string {
  return title
    .replace(/\u00ad/g, '')
    .replace(LONG_WORD, word => (word.length * box.size * box.advance > box.width * FIT_SHARE ? softBreak(word) : word));
}

/**
 * Party Colors - Single Source of Truth
 *
 * Hex values defined here, CSS variables in index.css reference these same values.
 * Keep both in sync when changing colors.
 */

export const PARTY_COLORS: Record<string, string> = {
  SPD: '#E3000F',
  'CDU/CSU': '#000000',  // Black - traditional CDU color
  GRÜNE: '#1AA037',
  AfD: '#009EE0',
  'DIE LINKE': '#BE3075',
  BSW: '#FF6B35',
  fraktionslos: '#6B7280',
};

export const PARTY_BG_COLORS: Record<string, string> = {
  SPD: '#E3000F',
  'CDU/CSU': '#000000',  // Traditional black for backgrounds (white doesn't work)
  GRÜNE: '#13752A',
  AfD: '#006C99',
  'DIE LINKE': '#BE3075',
  BSW: '#AE3A10',
  fraktionslos: '#6B7280',
};

export const PARTY_GRADIENTS: Record<string, string> = {
  SPD: 'from-spd/80 to-spd',
  'CDU/CSU': 'from-gray-800 to-cdu',
  GRÜNE: 'from-[#13752A] to-[#0D5B20]',
  AfD: 'from-[#006C99] to-[#005477]',
  'DIE LINKE': 'from-linke/80 to-linke',
  BSW: 'from-[#AE3A10] to-[#8E2E0B]',
  fraktionslos: 'from-fraktionslos/80 to-fraktionslos',
};

export const PARTY_BG_CLASSES: Record<string, string> = {
  SPD: 'bg-spd',
  'CDU/CSU': 'bg-cdu',
  GRÜNE: 'bg-[#13752A]',
  AfD: 'bg-[#006C99]',
  'DIE LINKE': 'bg-linke',
  BSW: 'bg-[#AE3A10]',
  fraktionslos: 'bg-fraktionslos',
};

export function getPartyColor(party: string): string {
  return PARTY_COLORS[party] || PARTY_COLORS.fraktionslos;
}

export function getPartyBgColor(party: string): string {
  return PARTY_BG_COLORS[party] || PARTY_BG_COLORS.fraktionslos;
}

export function getPartyGradient(party: string): string {
  return PARTY_GRADIENTS[party] || PARTY_GRADIENTS.fraktionslos;
}

export function getPartyBgClass(party: string): string {
  return PARTY_BG_CLASSES[party] || PARTY_BG_CLASSES.fraktionslos;
}

/**
 * Text colors visible on dark backgrounds
 * CDU is black (#000000) which is invisible on dark backgrounds,
 * so we use white text for CDU content instead.
 */
const PARTY_TEXT_COLORS: Record<string, string> = {
  'CDU/CSU': '#FFFFFF',  // White text - black invisible on dark bg
};

export function getPartyTextColor(party: string): string {
  return PARTY_TEXT_COLORS[party] || getPartyColor(party);
}

/**
 * Party colours as readable text/marks (≥ 4.5:1) on the two kinds of ground the
 * design system uses. `light` = white cards, `dark` = ink/deep/card surfaces.
 * Measured values are pinned in party-tone.test.ts.
 */
const PARTY_ON_DARK: Record<string, string> = {
  SPD: '#FF6B6B',
  'CDU/CSU': '#E4E4E7',
  GRÜNE: '#3DDC84',
  AfD: '#4FC3F7',
  'DIE LINKE': '#F06BB0',
  BSW: '#FF9466',
  fraktionslos: '#A1A1AA',
};

export function getPartyTone(party: string, ground: 'light' | 'dark'): string {
  const table = ground === 'light' ? PARTY_BG_COLORS : PARTY_ON_DARK;
  return table[party] ?? table.fraktionslos;
}

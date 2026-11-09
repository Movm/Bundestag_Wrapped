/**
 * DIP faction strings.
 *
 * The DIP matches `f.urheber` and `f.initiative` exactly, and stores Fraktionen
 * as "Fraktion der AfD" / "Fraktion BÜNDNIS 90/DIE GRÜNEN" etc. The names
 * advertised by bundestag_get_filters ("BÜNDNIS 90/DIE GRÜNEN", "CDU/CSU", …)
 * therefore match nothing and return a silent 0. Expand them to the exact DIP
 * value. This is deliberately an exact lookup, not a substring match: a loose
 * match would also catch other Urheber. Anything unknown (Bundesregierung, a
 * Bundesland, an already-full "Fraktion …" string) passes through unchanged.
 */
const DIP_FACTION_ALIASES = {
  'afd': 'Fraktion der AfD',
  'spd': 'Fraktion der SPD',
  'cdu': 'Fraktion der CDU/CSU',
  'csu': 'Fraktion der CDU/CSU',
  'cdu/csu': 'Fraktion der CDU/CSU',
  'union': 'Fraktion der CDU/CSU',
  'grüne': 'Fraktion BÜNDNIS 90/DIE GRÜNEN',
  'gruene': 'Fraktion BÜNDNIS 90/DIE GRÜNEN',
  'grünen': 'Fraktion BÜNDNIS 90/DIE GRÜNEN',
  'die grünen': 'Fraktion BÜNDNIS 90/DIE GRÜNEN',
  'bündnis 90/die grünen': 'Fraktion BÜNDNIS 90/DIE GRÜNEN',
  'linke': 'Fraktion DIE LINKE',
  'die linke': 'Fraktion DIE LINKE'
};

export function normalizeDipFaction(value) {
  if (typeof value !== 'string') return value;
  return DIP_FACTION_ALIASES[value.trim().toLowerCase()] || value;
}

/**
 * Small counts in running German text: "zweimal", "Drei Themen", "Die anderen
 * acht". Above twelve (and below one) the digits read better, so they stay.
 */
const CARDINALS = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
const numeric = new Intl.NumberFormat('de-DE');

export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('de-DE') + text.slice(1);
}

/** "zwei", "acht", … up to twelve; digits beyond. */
export function cardinal(count: number): string {
  return Number.isInteger(count) && count >= 0 && count < CARDINALS.length ? CARDINALS[count] : numeric.format(count);
}

/** "einmal", "zweimal", … up to twelve; "13-mal" beyond. */
export function times(count: number): string {
  if (count === 1) return 'einmal';
  return count >= 2 && count < CARDINALS.length ? `${CARDINALS[count]}mal` : `${numeric.format(count)}-mal`;
}

/** Dative with article: "bei der SPD", "bei den Grünen". Unknown names get no article. */
export function atParty(party: string): string {
  switch (party) {
    case 'GRÜNE': return 'bei den Grünen';
    case 'DIE LINKE': return 'bei der Linken';
    case 'SPD':
    case 'AfD':
    case 'CDU/CSU': return `bei der ${party}`;
    default: return `bei ${party}`;
  }
}

/** Nominative with article, for the start of a sentence: "Die SPD", "Die Grünen". */
export function theParty(party: string): string {
  switch (party) {
    case 'GRÜNE': return 'Die Grünen';
    case 'DIE LINKE': return 'Die Linke';
    case 'SPD':
    case 'AfD':
    case 'CDU/CSU': return `Die ${party}`;
    default: return party;
  }
}

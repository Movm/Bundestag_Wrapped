import type { YouthLanguageAnalysis } from '@/generated/wrapped-contract-v1';
import { atParty, capitalize, cardinal, times } from '@/lib/german-count';

/** Plain-language meaning of a Jugendwort, where the edition explains it. */
const MEANINGS: Record<string, string> = {
  ragebait: 'Gemeint sind Inhalte, die absichtlich wütend machen sollen, um Aufmerksamkeit zu bekommen.',
};

export function youthWordMeaning(word: string): string | undefined {
  return MEANINGS[word.toLowerCase()];
}

export type YouthGeneration = 'genz' | 'older' | 'both';

/** "Dr. Fabian Fahl" and "Fabian Fahl" are the same person: titles are dropped. */
function personKey(name: string): string {
  return name.split(/\s+/).filter(part => part && !part.endsWith('.')).join(' ').toLocaleLowerCase('de-DE');
}

/**
 * Which generation said a word: Gen Z MPs (the edition's `generations.speakers`),
 * older MPs, or both. Everyone not listed as Gen Z counts as older; the pipeline
 * leaves out the few MPs without a known birth year (`unknownSpeakers`).
 */
export function youthGeneration(
  speakers: ReadonlyArray<{ name: string }>,
  genzSpeakers: ReadonlyArray<{ name: string }>,
): YouthGeneration | null {
  if (speakers.length === 0) return null;
  const genz = new Set(genzSpeakers.map(speaker => personKey(speaker.name)));
  const young = speakers.filter(speaker => genz.has(personKey(speaker.name))).length;
  if (young === 0) return 'older';
  return young === speakers.length ? 'genz' : 'both';
}

/**
 * What the chapter found, in a few sentences: this year's Jugendwörter, the
 * earlier ones that are still said, and who said them. `highlight` is the
 * sentence the slide marks.
 */
export function youthSummary(youth: YouthLanguageAnalysis, generation: YouthGeneration | null): { body: string; highlight?: string } {
  const sentences: string[] = [];
  const hits = youth.words.filter(item => item.count > 0);
  const parties = youth.byParty.filter(item => item.count > 0);
  const [top] = hits;
  if (!top) {
    sentences.push(`Keins der ${cardinal(youth.words.length)} Jugendwörter fiel im Plenum.`);
  } else {
    const where = parties.length === 1 ? `, ${top.count === 1 ? '' : top.count === 2 ? 'beide Male ' : 'jedes Mal '}${atParty(parties[0].party)}` : '';
    sentences.push(hits.length === 1
      ? `Von ${cardinal(youth.words.length)} Jugendwörtern fiel nur eins: „${capitalize(top.word)}“, ${times(top.count)}${where}.`
      : `Von ${cardinal(youth.words.length)} Jugendwörtern fielen ${cardinal(hits.length)}, am häufigsten „${capitalize(top.word)}“ (${times(top.count)}).`);
  }
  const past = youth.pastWinners ?? [];
  if (past.length > 0) {
    const since = Math.min(...past.map(item => item.winnerYear));
    const survivors = past.filter(item => item.count > 0).sort((a, b) => b.count - a.count);
    const [first] = survivors;
    sentences.push(!first
      ? `Von den Jugendwörtern seit ${since} kam keins vor.`
      : survivors.length === 1
        ? `Von den Jugendwörtern seit ${since} hat nur „${first.word}“ (${first.winnerYear}) überlebt: ${times(first.count)} im Plenum.`
        : `Von den Jugendwörtern seit ${since} kamen ${cardinal(survivors.length)} vor, am häufigsten „${first.word}“ (${first.winnerYear}, ${times(first.count)}).`);
  }
  let highlight: string | undefined;
  if (generation === 'older') {
    highlight = 'Die Jungen reden wie Erwachsene, die Erwachsenen wie die Jungen.';
    sentences.push(`Niemand davon gehört zur Gen Z. ${highlight}`);
  } else if (generation === 'genz') {
    sentences.push('Gesagt haben sie nur Abgeordnete der Gen Z.');
  }
  return { body: sentences.join(' '), highlight };
}

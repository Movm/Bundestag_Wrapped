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

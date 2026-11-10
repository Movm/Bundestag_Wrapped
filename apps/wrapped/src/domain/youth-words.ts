/** Plain-language meaning of a Jugendwort, where the edition explains it. */
const MEANINGS: Record<string, string> = {
  ragebait: 'Gemeint sind Inhalte, die gezielt Wut provozieren sollen, um Reichweite zu erzeugen.',
};

export function youthWordMeaning(word: string): string | undefined {
  return MEANINGS[word.toLowerCase()];
}

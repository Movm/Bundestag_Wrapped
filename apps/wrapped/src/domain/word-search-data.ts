import type { WordsAsset } from '@/generated/wrapped-contract-v1';
import type { WordsIndex, WordFrequency } from '@/lib/search-utils';

/** Validated edition assets group words by party; the search UI groups them by word. */
export function buildWordSearchIndex(asset: WordsAsset, totals: readonly { party: string; totalWords: number }[]): WordsIndex {
  const denominators = new Map(totals.map(party => [party.party, party.totalWords]));
  const words = new Map<string, WordFrequency>();
  for (const party of asset.parties) {
    const denominator = denominators.get(party.party) ?? 0;
    for (const entry of party.words) {
      const word = words.get(entry.word) ?? { word: entry.word, total: 0, parties: {} };
      const count = (word.parties[party.party]?.count ?? 0) + entry.count;
      word.total += entry.count;
      word.parties[party.party] = { count, per1000: denominator > 0 ? count / denominator * 1000 : 0 };
      words.set(entry.word, word);
    }
  }
  return { words: [...words.values()] };
}

import type { RankMovement, TopicAnalysis, TopicSpeaker, YearOverYearAnalysis } from '@/generated/wrapped-contract-v1';
import { pickRiserOptions } from './edition-quiz';

export interface TopicPartyShare {
  party: string;
  /** Topic score of the parliamentary group divided by the Bundestag-wide score. */
  vsAverage: number;
}

export interface TopicRiserContext {
  riser: RankMovement;
  parties: TopicPartyShare[];
  /** The words that carry the topic in speeches, most frequent first. */
  words: string[];
  /** MPs with the largest share of the topic in their own speeches. */
  speakers: TopicSpeaker[];
}

// Individual MPs without a group are not a comparable "Fraktion".
const NON_GROUPS = new Set(['fraktionslos']);

/**
 * Evidence for the topic-riser quiz answer: the words behind the topic and
 * who talks about it most relative to the Bundestag average. The riser is picked exactly like
 * the quiz picks its correct answer, so the slide can never explain a
 * different topic than the one the reader just guessed.
 */
export function buildTopicRiserContext(
  analysis: YearOverYearAnalysis,
  topics: TopicAnalysis | null | undefined,
): TopicRiserContext | null {
  const riser = pickRiserOptions(analysis.topics)?.winner;
  if (!riser || riser.rankChange <= 0) return null;

  const average = topics?.overall[riser.label];
  const parties = average && average > 0
    ? Object.entries(topics.byParty)
      .filter(([party, scores]) => !NON_GROUPS.has(party) && typeof scores[riser.label] === 'number')
      .map(([party, scores]) => ({ party, vsAverage: scores[riser.label] / average }))
      .sort((a, b) => b.vsAverage - a.vsAverage || a.party.localeCompare(b.party, 'de'))
    : [];

  const words = (topics?.topWords?.[riser.label] ?? []).slice(0, 8).map(item => displayWord(item.word));

  const speakers = (topics?.topSpeakers?.[riser.label] ?? []).slice(0, 3);

  return { riser, parties, words, speakers };
}

/** Lexicon words are lower case: nouns get their capital, short acronyms stay upper case ("BIP"). */
function displayWord(word: string): string {
  return word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1);
}

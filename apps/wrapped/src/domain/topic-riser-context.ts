import type { RankMovement, TopicAnalysis, YearOverYearAnalysis } from '@/generated/wrapped-contract-v1';
import { pickRiserOptions } from './edition-quiz';

export interface TopicPartyShare {
  party: string;
  /** Topic score of the parliamentary group divided by the Bundestag-wide score. */
  vsAverage: number;
}

export interface TopicRiserContext {
  riser: RankMovement;
  faller: RankMovement | null;
  parties: TopicPartyShare[];
  leader: { party: string; newSignatureWords: string[] } | null;
}

// Individual MPs without a group are not a comparable "Fraktion".
const NON_GROUPS = new Set(['fraktionslos']);

/**
 * Evidence for the topic-riser quiz answer. The riser is picked exactly like
 * the quiz picks its correct answer, so the slide can never explain a
 * different topic than the one the reader just guessed.
 */
export function buildTopicRiserContext(
  analysis: YearOverYearAnalysis,
  topics: TopicAnalysis | null | undefined,
): TopicRiserContext | null {
  const riser = pickRiserOptions(analysis.topics)?.winner;
  if (!riser || riser.rankChange <= 0) return null;

  const faller = analysis.topics.reduce<RankMovement | null>(
    (worst, item) => (item.rankChange < 0 && (!worst || item.rankChange < worst.rankChange) ? item : worst),
    null,
  );

  const average = topics?.overall[riser.label];
  const parties = average && average > 0
    ? Object.entries(topics.byParty)
      .filter(([party, scores]) => !NON_GROUPS.has(party) && typeof scores[riser.label] === 'number')
      .map(([party, scores]) => ({ party, vsAverage: scores[riser.label] / average }))
      .sort((a, b) => b.vsAverage - a.vsAverage || a.party.localeCompare(b.party, 'de'))
    : [];

  const leaderParty = parties[0]?.party;
  const newWords = analysis.signatureWords
    .find(entry => entry.party === leaderParty)
    ?.risers.filter(item => item.previousRank === null)
    .sort((a, b) => (a.currentRank ?? Infinity) - (b.currentRank ?? Infinity))
    .map(item => item.word) ?? [];

  return {
    riser,
    faller,
    parties,
    leader: leaderParty && newWords.length > 0 ? { party: leaderParty, newSignatureWords: newWords } : null,
  };
}

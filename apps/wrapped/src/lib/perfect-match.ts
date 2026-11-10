import type { MatchAnimal, MatchAsset } from '@/generated/wrapped-contract-v1';
import { TOPIC_BY_ID } from '@/shared/constants/topics';

/**
 * Perfect Match: scores every MP in the edition's `match.json` against the
 * user's answers. Pure and synchronous: ~600 MPs × ~30 operations, well under
 * a millisecond, so it runs on the "Match finden" tap without a worker.
 *
 * The score is a weighted sum of four parts, each in 0..1:
 * - party (35 %): the rank the user gave the MP's party (1 → 1, 2 → .55, 3 → .25, 4 → 0)
 * - topics (30 %): how much the MP talks about the user's three topics, each
 *   relative to the MP's own strongest topic, weighted .5 / .3 / .2 by slot
 * - words (25 %): mean over the picked words of log2(ratio) / 3, clamped,
 *   so "8× as often as the Bundestag" is a full hit and "as often" is none
 * - animal (10 %): the user liked the MP's spirit animal
 * The percentage shown is that sum × 100, so 100 % means a perfect answer set.
 */

export type { MatchAnimal, MatchMp, MatchWord } from '@/generated/wrapped-contract-v1';
/** `match.json`: topic scores × 100 and smoothed word ratios × 10, column-aligned with `topics` / `words`. */
export type MatchData = MatchAsset;

export interface MatchAnswers {
  /** Party names, most preferred first. */
  order: string[];
  /** Topic ids, slot 1 first. */
  topics: string[];
  words: string[];
  /** Ids of the animals the user liked. */
  likedAnimals: string[];
}

export interface MatchResult {
  slug: string;
  name: string;
  party: string;
  animal: MatchAnimal | null;
  pct: number;
  reasons: string[];
}

const PARTY_POINTS = [1, 0.55, 0.25, 0];
const SLOT_WEIGHTS = [0.5, 0.3, 0.2];
const WEIGHTS = { party: 0.35, topics: 0.3, words: 0.25, animal: 0.1 };
/** A topic counts as "theirs" in the reasons from half the MP's top topic on. */
const TOPIC_REASON_SHARE = 0.5;
const WORD_REASON_RATIO = 1.5;

/** Animals for the swipe deck: the most common ones first. */
export const DECK_SIZE = 8;

export function topicName(id: string): string {
  return TOPIC_BY_ID[id]?.name ?? id;
}

export function formatTimes(ratio: number): string {
  return `${ratio.toLocaleString('de-DE', { maximumFractionDigits: 1 })}×`;
}

const LIST = new Intl.ListFormat('de', { type: 'conjunction' });
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function wordPoints(ratio: number): number {
  return ratio > 0 ? clamp01(Math.log2(ratio) / 3) : 0;
}

export function scoreMatches(data: MatchData, answers: MatchAnswers, limit = 3): MatchResult[] {
  const topicIndex = answers.topics.map(id => data.topics.indexOf(id));
  const wordIndex = answers.words.map(word => data.words.findIndex(item => item.word === word)).filter(index => index >= 0);
  const liked = new Set(answers.likedAnimals);

  const scored = data.mps.map(mp => {
    const party = data.parties[mp.party];
    const rank = answers.order.indexOf(party);
    const partyScore = rank >= 0 ? PARTY_POINTS[rank] ?? 0 : 0;

    const top = Math.max(...mp.topics, 1);
    const shares = topicIndex.map(index => (index >= 0 ? mp.topics[index] / top : 0));
    const topicScore = shares.reduce((sum, share, slot) => sum + share * (SLOT_WEIGHTS[slot] ?? 0), 0);

    const ratios = wordIndex.map(index => mp.words[index] / 10);
    const wordScore = ratios.length ? ratios.reduce((sum, ratio) => sum + wordPoints(ratio), 0) / ratios.length : 0;

    const animal = mp.animal >= 0 ? data.animals[mp.animal] ?? null : null;
    const animalScore = animal && liked.has(animal.id) ? 1 : 0;

    const total = WEIGHTS.party * partyScore + WEIGHTS.topics * topicScore + WEIGHTS.words * wordScore + WEIGHTS.animal * animalScore;
    return { mp, party, rank, shares, ratios, animal, animalScore, total };
  });

  scored.sort((a, b) => b.total - a.total || a.mp.name.localeCompare(b.mp.name, 'de'));

  return scored.slice(0, limit).map(item => {
    const reasons: string[] = [];
    reasons.push(item.rank === 0 ? `${item.party} ist deine Nr. 1` : `${item.party} auf deinem Platz ${item.rank + 1}`);
    const sharedTopics = answers.topics.filter((_, slot) => item.shares[slot] >= TOPIC_REASON_SHARE).map(topicName);
    if (sharedTopics.length) reasons.push(`Spricht viel über ${LIST.format(sharedTopics)}`);
    const best = item.ratios.reduce((bestIndex, ratio, index) => (ratio > (item.ratios[bestIndex] ?? 0) ? index : bestIndex), 0);
    const bestRatio = item.ratios[best];
    if (bestRatio !== undefined && bestRatio >= WORD_REASON_RATIO) {
      reasons.push(`Sagt „${data.words[wordIndex[best]].word}“ ${formatTimes(bestRatio)} so oft wie der Bundestag`);
    }
    if (item.animalScore && item.animal) reasons.push(`Teilt dein Spirit Animal: ${item.animal.name}`);
    return {
      slug: item.mp.slug,
      name: item.mp.name,
      party: item.party,
      animal: item.animal,
      pct: Math.round(item.total * 100),
      reasons,
    };
  });
}

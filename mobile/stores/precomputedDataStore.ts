/**
 * Precomputed Data Store
 *
 * Precomputes heavy slide calculations once when WrappedData loads.
 * This eliminates expensive useMemo calculations during scroll,
 * reducing jank on heavy slides like Topics, Speeches, and Tone.
 *
 * Usage:
 * - Initialize in WrappedExperience when data loads
 * - Heavy slides consume precomputed values via selectors
 */

import { Dimensions } from 'react-native';
import { create } from 'zustand';
import type {
  WrappedData,
  PartyStats,
  PartyProfile,
  TopicAnalysis,
  ToneAnalysis,
  ExtendedToneScores,
} from '@/data/wrapped';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface PartyRanking {
  party: string;
  score: number;
}

interface PrecomputedData {
  // TopicsRevealSlide - O(n×m) calculation done ONCE
  topicPartyRankings: Record<string, PartyRanking[]>;

  // SpeechesChartSlide - bubble sizes precomputed
  speechBubbleSizes: number[];
  totalSpeeches: number;

  // ToneRevealSlide - holistic summaries precomputed per party
  partyToneSummaries: Record<string, string>;

  // Sorted/filtered party lists (used by multiple slides)
  top5Parties: PartyStats[];
  sortedToneProfiles: PartyProfile[];

  // Top 5 topics for TopicsRevealSlide
  displayTopics: { topic: string; rank: number }[];

  // Status
  isReady: boolean;
}

interface PrecomputedStore extends PrecomputedData {
  initialize: (data: WrappedData) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────
// Computation Functions (run ONCE on initialize)
// ─────────────────────────────────────────────────────────────

const PARTY_ORDER = ['DIE LINKE', 'BSW', 'SPD', 'GRÜNE', 'CDU/CSU', 'AfD'];

function getTop5Parties(parties: PartyStats[]): PartyStats[] {
  return parties.filter((p) => p.party !== 'fraktionslos').slice(0, 5);
}

function computeBubbleSizes(top5: PartyStats[]): { sizes: number[]; total: number } {
  const speeches = top5.map((p) => p.speeches);
  const minSpeeches = Math.min(...speeches);
  const speechRange = Math.max(...speeches) - minSpeeches || 1;

  const minSize = SCREEN_WIDTH * 0.22;
  const maxSize = SCREEN_WIDTH * 0.36;

  const sizes = top5.map((p) => {
    const sizePercent = (p.speeches - minSpeeches) / speechRange;
    return minSize + sizePercent * (maxSize - minSize);
  });

  return {
    sizes,
    total: top5.reduce((sum, p) => sum + p.speeches, 0),
  };
}

function computeTopicPartyRankings(
  topicAnalysis: TopicAnalysis | null | undefined
): { rankings: Record<string, PartyRanking[]>; displayTopics: { topic: string; rank: number }[] } {
  if (!topicAnalysis) {
    return { rankings: {}, displayTopics: [] };
  }

  const { topTopics, byParty } = topicAnalysis;
  const displayTopics = topTopics.slice(0, 5).map((t) => ({ topic: t.topic, rank: t.rank }));

  const rankings: Record<string, PartyRanking[]> = {};
  for (const topicScore of displayTopics) {
    const partyRankings: PartyRanking[] = [];
    for (const [party, topics] of Object.entries(byParty)) {
      if (party === 'fraktionslos') continue;
      const score = topics[topicScore.topic] || 0;
      partyRankings.push({ party, score });
    }
    rankings[topicScore.topic] = partyRankings.sort((a, b) => b.score - a.score);
  }

  return { rankings, displayTopics };
}

function getHolisticSummary(scores: ExtendedToneScores): string {
  const {
    aggression,
    collaboration,
    solution_focus,
    demand_intensity,
    affirmative,
    labeling,
    discriminatory,
    inclusivity,
  } = scores;

  const isConstructive = solution_focus > 50 && collaboration > 40;
  const isAggressive = aggression > 5 || discriminatory > 3;
  const isDemanding = demand_intensity > 10;
  const isPositive = affirmative > 15 && aggression < 3;
  const isLabeling = labeling > 10;
  const isInclusive = inclusivity > 5 && discriminatory < 2;

  if (isAggressive && isLabeling) return 'Konfrontativ';
  if (isAggressive && isDemanding) return 'Kämpferisch';
  if (isConstructive && isPositive) return 'Lösungsorientiert';
  if (isConstructive && isInclusive) return 'Kooperativ';
  if (isDemanding && !isAggressive) return 'Fordernd';
  if (isPositive && collaboration > 50) return 'Verbindend';
  if (isLabeling && !isAggressive) return 'Analytisch';
  if (solution_focus > 60) return 'Pragmatisch';
  if (affirmative > 20) return 'Optimistisch';
  if (collaboration > 55) return 'Teamorientiert';

  return 'Sachlich';
}

function sortToneProfiles(toneAnalysis: ToneAnalysis | null | undefined): PartyProfile[] {
  if (!toneAnalysis?.partyProfiles) return [];

  const entries = Object.values(toneAnalysis.partyProfiles);
  return entries
    .filter((p) => p.party !== 'fraktionslos')
    .sort((a, b) => {
      const indexA = PARTY_ORDER.indexOf(a.party);
      const indexB = PARTY_ORDER.indexOf(b.party);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });
}

function computeToneSummaries(
  toneAnalysis: ToneAnalysis | null | undefined
): Record<string, string> {
  if (!toneAnalysis?.partyProfiles) return {};

  const summaries: Record<string, string> = {};
  for (const [party, profile] of Object.entries(toneAnalysis.partyProfiles)) {
    summaries[party] = getHolisticSummary(profile.scores);
  }
  return summaries;
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

const initialState: PrecomputedData = {
  topicPartyRankings: {},
  speechBubbleSizes: [],
  totalSpeeches: 0,
  partyToneSummaries: {},
  top5Parties: [],
  sortedToneProfiles: [],
  displayTopics: [],
  isReady: false,
};

export const usePrecomputedStore = create<PrecomputedStore>((set) => ({
  ...initialState,

  initialize: (data: WrappedData) => {
    const startTime = Date.now();
    console.log('[PrecomputedStore] initializing...');

    // Compute ALL heavy data upfront
    const top5Parties = getTop5Parties(data.parties);
    console.log(`[PrecomputedStore] top5Parties: ${Date.now() - startTime}ms`);

    // SpeechesChartSlide bubble sizes
    const { sizes, total } = computeBubbleSizes(top5Parties);
    console.log(`[PrecomputedStore] bubbleSizes: ${Date.now() - startTime}ms`);

    // TopicsRevealSlide rankings
    const { rankings, displayTopics } = computeTopicPartyRankings(data.topicAnalysis);
    console.log(`[PrecomputedStore] topicRankings: ${Date.now() - startTime}ms`);

    // ToneRevealSlide summaries
    const partyToneSummaries = computeToneSummaries(data.toneAnalysis);
    console.log(`[PrecomputedStore] toneSummaries: ${Date.now() - startTime}ms`);

    // Sorted profiles for ToneRevealSlide
    const sortedToneProfiles = sortToneProfiles(data.toneAnalysis);
    console.log(`[PrecomputedStore] DONE in ${Date.now() - startTime}ms`);

    set({
      topicPartyRankings: rankings,
      speechBubbleSizes: sizes,
      totalSpeeches: total,
      partyToneSummaries,
      top5Parties,
      sortedToneProfiles,
      displayTopics,
      isReady: true,
    });
  },

  reset: () => set(initialState),
}));

// ─────────────────────────────────────────────────────────────
// Selector Hooks (for optimal re-render performance)
// ─────────────────────────────────────────────────────────────

/**
 * Get precomputed top 5 parties (used by multiple slides)
 */
export function useTop5Parties(): PartyStats[] {
  return usePrecomputedStore((state) => state.top5Parties);
}

/**
 * Get precomputed bubble sizes for SpeechesChartSlide
 * Returns stable array reference from store (no new object creation)
 */
export function useSpeechBubbleSizes(): number[] {
  return usePrecomputedStore((state) => state.speechBubbleSizes);
}

/**
 * Get total speeches count
 * Returns primitive for optimal re-render performance
 */
export function useTotalSpeeches(): number {
  return usePrecomputedStore((state) => state.totalSpeeches);
}

/**
 * Get precomputed party rankings for a specific topic
 */
export function useTopicPartyRankings(topic: string): PartyRanking[] {
  return usePrecomputedStore((state) => state.topicPartyRankings[topic] || []);
}

/**
 * Get all precomputed topic rankings (for TopicsRevealSlide)
 */
export function useAllTopicRankings(): Record<string, PartyRanking[]> {
  return usePrecomputedStore((state) => state.topicPartyRankings);
}

/**
 * Get display topics (top 5)
 */
export function useDisplayTopics(): { topic: string; rank: number }[] {
  return usePrecomputedStore((state) => state.displayTopics);
}

/**
 * Get precomputed holistic summary for a party
 */
export function usePartyToneSummary(party: string): string {
  return usePrecomputedStore((state) => state.partyToneSummaries[party] || 'Sachlich');
}

/**
 * Get sorted tone profiles for ToneRevealSlide
 */
export function useSortedToneProfiles(): PartyProfile[] {
  return usePrecomputedStore((state) => state.sortedToneProfiles);
}

/**
 * Check if precomputed data is ready
 */
export function usePrecomputedReady(): boolean {
  return usePrecomputedStore((state) => state.isReady);
}

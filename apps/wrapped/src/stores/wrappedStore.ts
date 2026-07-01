/**
 * Wrapped Data Store - Zustand-based data management
 *
 * Similar to quizStore, this prevents re-render cascades when data loads.
 * Each slide subscribes only to the specific data fields it needs.
 *
 * Flow:
 * 1. React Query fetches wrapped.json
 * 2. useWrappedData() syncs data to this store
 * 3. Slides subscribe via selective hooks (useParties, useDrama, etc.)
 * 4. Only slides using specific data re-render when that data changes
 */

import { create } from 'zustand';
import type { WrappedData, PartyStats, TopicAnalysis, ToneAnalysis, DramaStats, GenderAnalysis } from '@/data/wrapped';

interface WrappedStore {
  data: WrappedData | null;
  isLoading: boolean;
  error: Error | null;
  setData: (data: WrappedData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useWrappedStore = create<WrappedStore>((set) => ({
  data: null,
  isLoading: true,
  error: null,
  setData: (data) => set({ data, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));

// ============================================================================
// Selective subscriptions - components only re-render when their data changes
// ============================================================================

/** Party statistics (vocabulary, speeches) - used by 2 slides */
export function useParties(): PartyStats[] | undefined {
  return useWrappedStore((s) => s.data?.parties);
}

/** Drama statistics - used by 1 slide */
export function useDrama(): DramaStats | undefined {
  return useWrappedStore((s) => s.data?.drama);
}

/** Topic analysis - used by 2 slides */
export function useTopicAnalysis(): TopicAnalysis | null | undefined {
  return useWrappedStore((s) => s.data?.topicAnalysis);
}

/** Tone analysis - used by 3 slides */
export function useToneAnalysis(): ToneAnalysis | null | undefined {
  return useWrappedStore((s) => s.data?.toneAnalysis);
}

/** Hot topics / common words - used by 1 slide */
export function useHotTopics(): string[] | undefined {
  return useWrappedStore((s) => s.data?.hotTopics);
}

/** Moin speakers - used by 1 slide */
export function useMoinSpeakers(): WrappedData['moinSpeakers'] | undefined {
  return useWrappedStore((s) => s.data?.moinSpeakers);
}

/** Gender analysis - used by 1 slide */
export function useGenderAnalysis(): GenderAnalysis | null | undefined {
  return useWrappedStore((s) => s.data?.genderAnalysis);
}

// ============================================================================
// Loading/error state - used by MainWrappedPage for initial render
// ============================================================================

/** Check if data is still loading */
export function useIsDataLoading(): boolean {
  return useWrappedStore((s) => s.isLoading);
}

/** Get any error that occurred during loading */
export function useDataError(): Error | null {
  return useWrappedStore((s) => s.error);
}

/** Get full data (only for components that need everything, like share) */
export function useFullWrappedData(): WrappedData | null {
  return useWrappedStore((s) => s.data);
}

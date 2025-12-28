import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loadWrappedData, type WrappedData } from '../data/wrapped'
import { loadSpeakerIndex, loadSpeakerData, type SpeakerIndex, type SpeakerWrapped } from '../data/speaker-wrapped'
import { type Speech, type WordsIndex, type WordRankingsData, type TopicRankingsData } from '../lib/search-utils'
import { useWrappedStore } from '@/stores/wrappedStore'

export interface SpeechesData {
  speeches: Speech[]
}

// Static data never changes during a session - cache indefinitely
const STATIC_DATA_OPTIONS = {
  staleTime: Infinity,  // Data is never considered stale
  gcTime: Infinity,     // Keep in cache indefinitely (prevents GC)
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const

/**
 * Fetches wrapped data and syncs to Zustand store.
 *
 * React Query handles fetching/caching, Zustand handles selective subscriptions.
 * Slides use store hooks (useParties, useDrama, etc.) to avoid re-render cascade.
 */
export function useWrappedData() {
  const setData = useWrappedStore((s) => s.setData)
  const setError = useWrappedStore((s) => s.setError)

  const query = useQuery<WrappedData, Error>({
    queryKey: ['wrapped'],
    queryFn: loadWrappedData,
    ...STATIC_DATA_OPTIONS,
  })

  // Sync React Query state to Zustand store
  useEffect(() => {
    if (query.data) {
      setData(query.data)
    }
  }, [query.data, setData])

  useEffect(() => {
    if (query.error) {
      setError(query.error)
    }
  }, [query.error, setError])

  return query
}

export function useSpeakerIndex() {
  return useQuery<SpeakerIndex, Error>({
    queryKey: ['speakerIndex'],
    queryFn: loadSpeakerIndex,
    ...STATIC_DATA_OPTIONS,
  })
}

export function useSpeakerData(slug: string) {
  return useQuery<SpeakerWrapped, Error>({
    queryKey: ['speaker', slug],
    queryFn: () => loadSpeakerData(slug),
    enabled: !!slug,
    ...STATIC_DATA_OPTIONS,
  })
}

export function useSpeechesDb(options?: { enabled?: boolean }) {
  return useQuery<SpeechesData, Error>({
    queryKey: ['speeches'],
    queryFn: () => fetch('/speeches_db.json').then(r => {
      if (!r.ok) throw new Error('Failed to load speeches')
      return r.json()
    }),
    ...STATIC_DATA_OPTIONS,
    enabled: options?.enabled ?? true,
  })
}

export function useWordsIndex(options?: { enabled?: boolean }) {
  return useQuery<WordsIndex, Error>({
    queryKey: ['words-index'],
    queryFn: () => fetch('/words_index.json').then(r => {
      if (!r.ok) throw new Error('Failed to load words index')
      return r.json()
    }),
    ...STATIC_DATA_OPTIONS,
    enabled: options?.enabled ?? true,
  })
}

export function useWordRankings(options?: { enabled?: boolean }) {
  return useQuery<WordRankingsData, Error>({
    queryKey: ['word-rankings'],
    queryFn: () => fetch('/word_rankings.json').then(r => {
      if (!r.ok) throw new Error('Failed to load word rankings')
      return r.json()
    }),
    ...STATIC_DATA_OPTIONS,
    enabled: options?.enabled ?? true,
  })
}

export function useTopicRankings(options?: { enabled?: boolean }) {
  return useQuery<TopicRankingsData, Error>({
    queryKey: ['topic-rankings'],
    queryFn: () => fetch('/topic_rankings.json').then(r => {
      if (!r.ok) throw new Error('Failed to load topic rankings')
      return r.json()
    }),
    ...STATIC_DATA_OPTIONS,
    enabled: options?.enabled ?? true,
  })
}

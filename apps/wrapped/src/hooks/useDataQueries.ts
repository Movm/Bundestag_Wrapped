import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { WrappedData } from '@/data/wrapped';
import { enrichSpeakerData, type SpeakerIndex, type SpeakerWrapped } from '@/data/speaker-wrapped';
import type { TopicRankingsData, WordRankingsData, WordsIndex } from '@/lib/search-utils';
import { loadEditionAsset, type EditionAssetDocument, type SpeechesData } from '@/edition/loader';
import { useOptionalEdition } from '@/edition/EditionProvider';
import type { EditionContextValue } from '@/edition/types';
import type { Edition } from '@/edition/registry';
import { useWrappedStore } from '@/stores/wrappedStore';

const STATIC_DATA_OPTIONS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

type AssetType = 'speaker-index' | 'speaker' | 'speeches' | 'words' | 'word-rankings' | 'topic-rankings';
type EditionQueryIdentity = { editionId?: string; manifest?: Pick<Edition, 'editionId' | 'dataVersion'> } | null;

export function editionAssetQueryKey(
  edition: EditionQueryIdentity,
  assetType: AssetType,
  suffix?: string,
): readonly string[] {
  return [
    'edition',
    edition?.manifest?.editionId ?? edition?.editionId ?? 'missing-edition',
    edition?.manifest?.dataVersion ?? 'missing-version',
    assetType,
    ...(suffix ? [suffix] : []),
  ];
}

function editionAsset<Document extends EditionAssetDocument>(
  edition: EditionContextValue | null,
  asset: string,
  document: Document,
) {
  if (!edition?.manifest || !edition.manifestUrl) {
    return Promise.reject(new Error('Edition context is unavailable for this data asset'));
  }
  return loadEditionAsset(edition.manifestUrl, asset, document);
}

function speakerAssetPath(speakersBase: string, slug: string): string {
  return `${speakersBase.replace(/\/?$/, '/')}${slug}.json`;
}

/** Keeps the Zustand slide store in lockstep with the active edition only. */
export function useWrappedData(): UseQueryResult<WrappedData, Error> {
  const edition = useOptionalEdition();
  const setData = useWrappedStore((state) => state.setData);
  const setError = useWrappedStore((state) => state.setError);
  const reset = useWrappedStore((state) => state.reset);
  const editionId = edition?.manifest?.editionId ?? edition?.editionId;
  const dataVersion = edition?.manifest?.dataVersion;

  useEffect(() => {
    reset();
  }, [editionId, dataVersion, reset]);

  useEffect(() => {
    if (edition?.data) setData(edition.data);
    if (edition?.error) setError(edition.error);
  }, [edition?.data, edition?.error, setData, setError]);

  const error = edition?.error ?? (!edition ? new Error('Edition context is unavailable for Wrapped data') : null);
  return {
    data: edition?.data,
    error,
    isLoading: edition?.isLoading ?? false,
    isError: Boolean(error),
    isSuccess: Boolean(edition?.data),
    status: error ? 'error' : edition?.data ? 'success' : 'pending',
    fetchStatus: 'idle',
  } as UseQueryResult<WrappedData, Error>;
}

export function useSpeakerIndex() {
  const edition = useOptionalEdition();
  return useQuery<SpeakerIndex, Error>({
    queryKey: editionAssetQueryKey(edition, 'speaker-index'),
    queryFn: () => editionAsset(edition, edition!.manifest!.assets.speakerIndex, 'SpeakerIndexAsset'),
    enabled: Boolean(edition?.manifest && edition.manifestUrl),
    ...STATIC_DATA_OPTIONS,
  });
}

export function useSpeakerData(slug: string) {
  const edition = useOptionalEdition();
  return useQuery<SpeakerWrapped, Error>({
    queryKey: editionAssetQueryKey(edition, 'speaker', slug),
    queryFn: async () => {
      const speaker = await editionAsset(edition, speakerAssetPath(edition!.manifest!.assets.speakersBase, slug), 'SpeakerWrappedAsset');
      return enrichSpeakerData(speaker, slug);
    },
    enabled: Boolean(slug && edition?.manifest && edition.manifestUrl),
    ...STATIC_DATA_OPTIONS,
  });
}

function useEditionJsonAsset<T>(
  assetType: Exclude<AssetType, 'speaker-index' | 'speaker'>,
  asset: (edition: NonNullable<ReturnType<typeof useOptionalEdition>>) => string,
  load: (edition: NonNullable<ReturnType<typeof useOptionalEdition>>, asset: string) => Promise<T>,
  enabled = true,
) {
  const edition = useOptionalEdition();
  return useQuery<T, Error>({
    queryKey: editionAssetQueryKey(edition, assetType),
    queryFn: () => load(edition!, asset(edition!)),
    enabled: Boolean(enabled && edition?.manifest && edition.manifestUrl),
    ...STATIC_DATA_OPTIONS,
  });
}

export function useSpeechesDb(options?: { enabled?: boolean }) {
  return useEditionJsonAsset<SpeechesData>(
    'speeches',
    (edition) => edition.manifest!.assets.speeches,
    (edition, asset) => editionAsset(edition, asset, 'SpeechesAsset'),
    options?.enabled ?? true,
  );
}

export function useWordsIndex(options?: { enabled?: boolean }) {
  return useEditionJsonAsset<WordsIndex>(
    'words',
    (edition) => edition.manifest!.assets.words,
    (edition, asset) => editionAsset(edition, asset, 'WordsAsset'),
    options?.enabled ?? true,
  );
}

export function useWordRankings(options?: { enabled?: boolean }) {
  return useEditionJsonAsset<WordRankingsData>(
    'word-rankings',
    (edition) => edition.manifest!.assets.wordRankings,
    (edition, asset) => editionAsset(edition, asset, 'WordRankingsAsset'),
    options?.enabled ?? true,
  );
}

export function useTopicRankings(options?: { enabled?: boolean }) {
  return useEditionJsonAsset<TopicRankingsData>(
    'topic-rankings',
    (edition) => edition.manifest!.assets.topicRankings,
    (edition, asset) => editionAsset(edition, asset, 'TopicRankingsAsset'),
    options?.enabled ?? true,
  );
}

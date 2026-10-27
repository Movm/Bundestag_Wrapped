import { useSpeechSearch } from '@/hooks/useSpeechSearch';
import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';
import {
  parseSearchQuery,
  searchSpeakers,
  searchWords,
  sortSpeakers,
  sortWords,
  hasSearchContent,
  type Speech,
  type ScoredSpeech,
  type ScoredSpeaker,
  type ScoredWord,
  type SpeakerSortOption,
  type WordSortOption,
} from '@/lib/search-utils';
import { useSearchState } from '@/hooks/useSearchState';
import { useSpeakerIndex, useWordsIndex, useWordRankings } from '@/hooks/useDataQueries';
import {
  SearchHero,
  SearchHeader,
  SearchResults,
  SpeechDetailModal,
} from './suche';
import { SuchePageSkeleton } from './skeletons/SuchePageSkeleton';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

const EMPTY_SPEECHES: ScoredSpeech[] = [];

export function SuchePage() {
  const surface = editionSurface(useOptionalEdition());
  const [state, updateState, resetFilters] = useSearchState();

  // Conditional fetching: only load data for the active tab (saves 20MB+ on initial load)
  // Speaker index is always loaded (small, needed for party filter dropdown)
  const { data: speakerIndex, isLoading: speakersLoading, error: speakersError } = useSpeakerIndex();
  const { data: wordsIndex, isLoading: wordsLoading, error: wordsError } = useWordsIndex({
    enabled: state.tab === 'words',
  });
  const { data: wordRankings } = useWordRankings({
    enabled: state.tab === 'words',
  });

  const [selection, setSelection] = useState<{ key: string; speech: Speech } | null>(null);
  const [pagination, setPagination] = useState({ key: '', page: 0 });
  const criteria = useMemo(() => JSON.stringify([surface.editionId, state.q, state.party, state.minWords, state.maxWords, state.sort, state.tab]),
    [surface.editionId, state.q, state.party, state.minWords, state.maxWords, state.sort, state.tab]);
  const selectedSpeech = selection?.key === criteria ? selection.speech : null;
  const page = pagination.key === criteria ? pagination.page : 0;
  const parsedQuery = useMemo(() => parseSearchQuery(state.q), [state.q]);
  const hasQuery = hasSearchContent(parsedQuery);
  const showResults = Boolean(hasQuery || state.party || state.minWords > 0 || state.maxWords > 0 || state.tab === 'words');
  const speechSearch = useSpeechSearch(state, page, state.tab === 'speeches' && showResults);
  const { loadSpeech } = speechSearch;
  const filteredSpeeches = speechSearch.data?.items ?? EMPTY_SPEECHES;
  const loading = speakersLoading || (state.tab === 'words' && wordsLoading);
  const error = speakersError || speechSearch.error || (state.tab === 'words' && wordsError);

  const parties = useMemo(() => {
    if (!speakerIndex) return [];
    return [...new Set(speakerIndex.speakers.map(s => s.party))];
  }, [speakerIndex]);

  const filteredSpeakers = useMemo((): ScoredSpeaker[] => {
    if (!speakerIndex || state.tab !== 'speakers') return [];

    const filtered = searchSpeakers(speakerIndex.speakers, parsedQuery, {
      party: state.party,
    });

    return sortSpeakers(filtered, state.sort as SpeakerSortOption, hasQuery);
  }, [speakerIndex, parsedQuery, state.party, state.sort, state.tab, hasQuery]);

  const filteredWords = useMemo((): ScoredWord[] => {
    if (!wordsIndex || state.tab !== 'words') return [];

    const filtered = searchWords(wordsIndex.words, parsedQuery, {
      party: state.party,
    });

    return sortWords(filtered, state.sort as WordSortOption, hasQuery);
  }, [wordsIndex, parsedQuery, state.party, state.sort, state.tab, hasQuery]);

  const handleSearchWordInSpeeches = useCallback((word: string) => {
    updateState({ q: word, tab: 'speeches' });
  }, [updateState]);

  const loadMore = useCallback(() => {
    setPagination(previous => ({ key: criteria, page: (previous.key === criteria ? previous.page : 0) + 1 }));
    document.getElementById('search-results')?.scrollIntoView({ block: 'start' });
  }, [criteria]);
  const previousPage = useCallback(() => {
    setPagination(previous => ({ key: criteria, page: Math.max(0, (previous.key === criteria ? previous.page : 0) - 1) }));
    document.getElementById('search-results')?.scrollIntoView({ block: 'start' });
  }, [criteria]);
  const openSpeech = useCallback((speech: Speech) => {
    setSelection({ key: criteria, speech: { ...speech, text: 'Rede wird geladen…' } });
    void loadSpeech(speech.id).then(full => {
      setSelection(current => current?.key === criteria && current.speech.id === speech.id ? { key: criteria, speech: full } : current);
    }).catch(() => {
      setSelection(current => current?.key === criteria && current.speech.id === speech.id ? { key: criteria, speech: { ...current.speech, text: 'Rede konnte nicht geladen werden.' } } : current);
    });
  }, [loadSpeech, criteria]);
  const closeSpeech = useCallback(() => setSelection(null), []);

  const hasActiveFilters = state.party || state.q || state.minWords > 0 || state.maxWords > 0;

  if (loading) {
    return <SuchePageSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center pt-14">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400">Fehler beim Laden</p>
          <p className="text-white/40 text-sm mt-2">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={PAGE_META.search.title}
        description={PAGE_META.search.description}
        canonicalUrl={editionPath(surface, 'suche')}
      />
      <div className="min-h-screen page-bg pt-14">
        {!showResults && (
        <SearchHero state={state} updateState={updateState} />
      )}

      {showResults && (
        <>
          <SearchHeader
            state={state}
            updateState={updateState}
            parties={parties}
          />

          <SearchResults
            state={state}
            filteredSpeeches={filteredSpeeches}
            filteredSpeakers={filteredSpeakers}
            filteredWords={filteredWords}
            wordRankings={wordRankings}
            parsedQuery={parsedQuery}
            page={page}
            speechTotal={speechSearch.data?.total ?? 0}
            loading={speechSearch.isLoading}
            onPreviousPage={previousPage}
            hasActiveFilters={!!hasActiveFilters}
            hasQuery={hasQuery}
            onSpeechClick={openSpeech}
            onLoadMore={loadMore}
            onResetFilters={resetFilters}
            onSearchWordInSpeeches={handleSearchWordInSpeeches}
          />

          <AnimatePresence>
            {selectedSpeech && (
              <SpeechDetailModal
                speech={selectedSpeech}
                onClose={closeSpeech}
              />
            )}
          </AnimatePresence>

          <footer className="fixed bottom-0 left-0 right-0 z-30 p-4 pointer-events-none">
            <div className="flex justify-center gap-4 text-xs text-white/40">
              <a
                href="https://www.moritz-waechter.de/impressum"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/60 transition-colors pointer-events-auto"
              >
                Impressum
              </a>
              <span>|</span>
              <Link
                to="/datenschutz"
                className="hover:text-white/60 transition-colors pointer-events-auto"
              >
                Datenschutz
              </Link>
            </div>
          </footer>
        </>
      )}
      </div>
    </>
  );
}

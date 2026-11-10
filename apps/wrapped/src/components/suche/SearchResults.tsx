import { memo } from 'react';
import { SEARCH_PAGE_SIZE } from '@/lib/speech-search-protocol';
import type { WordRankingsAsset } from '@/generated/wrapped-contract-v1';
import { AnimatePresence } from 'motion/react';
import type { ScoredSpeech, ScoredSpeaker, ScoredWord, ParsedQuery, Speech, WordRankingsData } from '@/lib/search-utils';
import type { SearchState } from '@/hooks/useSearchState';
import { SpeechCard } from './SpeechCard';
import { SpeakerCard } from './SpeakerCard';
import { WordCard } from './WordCard';

interface SearchResultsProps {
  errorMessage?: string;
  state: SearchState;
  filteredSpeeches: ScoredSpeech[];
  filteredSpeakers: ScoredSpeaker[];
  filteredWords: ScoredWord[];
  wordRankings?: WordRankingsData | WordRankingsAsset;
  parsedQuery: ParsedQuery;
  page: number;
  speechTotal: number;
  loading: boolean;
  onPreviousPage: () => void;
  hasActiveFilters: boolean;
  hasQuery: boolean;
  onSpeechClick: (speech: Speech) => void;
  onLoadMore: () => void;
  onResetFilters: () => void;
  onSearchWordInSpeeches?: (word: string) => void;
}

export const SearchResults = memo(function SearchResults({
  errorMessage,
  state,
  filteredSpeeches,
  filteredSpeakers,
  filteredWords,
  wordRankings,
  parsedQuery,
  page,
  speechTotal,
  loading,
  onPreviousPage,
  hasActiveFilters,
  hasQuery,
  onSpeechClick,
  onLoadMore,
  onResetFilters,
  onSearchWordInSpeeches,
}: SearchResultsProps) {
  const resultCount = state.tab === 'speeches'
    ? speechTotal
    : state.tab === 'speakers'
    ? filteredSpeakers.length
    : filteredWords.length;

  const visibleResults = state.tab === 'speeches'
    ? filteredSpeeches
    : state.tab === 'speakers'
    ? filteredSpeakers.slice(page * SEARCH_PAGE_SIZE, (page + 1) * SEARCH_PAGE_SIZE)
    : filteredWords.slice(page * SEARCH_PAGE_SIZE, (page + 1) * SEARCH_PAGE_SIZE);

  const hasMore = (page + 1) * SEARCH_PAGE_SIZE < resultCount;

  const resultLabel = state.tab === 'speeches'
    ? 'Reden'
    : state.tab === 'speakers'
    ? 'Abgeordnete'
    : 'Wörter';

  return (
    <section id="search-results" role="tabpanel" aria-busy={loading} aria-labelledby={`search-tab-${state.tab}`} tabIndex={0} className="max-w-4xl mx-auto px-4 py-6 pb-20">
      {errorMessage && <p role="alert" className="text-on mb-4 [overflow-wrap:anywhere]">Fehler beim Laden: {errorMessage}</p>}
      {/* Screen reader announcement for search results */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading ? 'Lade Suchergebnisse…' : errorMessage ? 'Fehler beim Laden der Suchergebnisse.' : `${resultCount.toLocaleString('de-DE')} ${resultLabel} gefunden`}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-on-muted text-sm">
          <span className="text-on font-semibold">
            {resultCount.toLocaleString('de-DE')}
          </span>{' '}
          {resultLabel} gefunden
        </p>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-on-accent hover:text-on-accent text-sm"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {state.q && !hasQuery && (
        <div className="mb-4 p-3 bg-wr-card border border-track rounded-xl text-sm text-on-muted">
          <p className="font-medium text-on mb-1">Suchtipps:</p>
          <ul className="space-y-0.5 text-xs">
            <li><code className="bg-wr-card px-1 rounded">"exakte phrase"</code> für exakte Übereinstimmung</li>
            <li><code className="bg-wr-card px-1 rounded">wort1 AND wort2</code> beide Begriffe müssen vorkommen</li>
            <li><code className="bg-wr-card px-1 rounded">wort1 OR wort2</code> einer der Begriffe</li>
            <li><code className="bg-wr-card px-1 rounded">NOT wort</code> Begriff ausschließen</li>
            <li><code className="bg-wr-card px-1 rounded">speaker:name</code> nach Redner:in filtern</li>
            <li><code className="bg-wr-card px-1 rounded">party:SPD</code> nach Partei filtern</li>
            <li><code className="bg-wr-card px-1 rounded">words:&gt;500</code> Mindestwortzahl</li>
          </ul>
        </div>
      )}

      <div className={state.tab === 'speakers' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-3'}>
        {state.tab === 'speeches' &&
          (visibleResults as ScoredSpeech[]).map((speech) => (
            <SpeechCard
              key={speech.id}
              speech={speech}
              query={parsedQuery}
              onClick={onSpeechClick}
            />
          ))}
        <AnimatePresence initial={false}>
          {state.tab === 'speakers' &&
            (visibleResults as ScoredSpeaker[]).map((speaker, index) => (
              <SpeakerCard
                key={speaker.slug}
                speaker={speaker}
                query={parsedQuery}
                index={index}
              />
            ))}
          {state.tab === 'words' &&
            (visibleResults as ScoredWord[]).map((word, index) => (
              <WordCard
                key={word.word}
                word={word}
                ranking={wordRankings && 'words' in wordRankings ? wordRankings.words[word.word] : undefined}
                query={parsedQuery}
                index={index}
                onSearchInSpeeches={onSearchWordInSpeeches}
              />
            ))}
        </AnimatePresence>
      </div>

      {loading && <p role="status" className="py-6 text-on-muted">Suche läuft…</p>}
      {page > 0 && (
        <button onClick={onPreviousPage} disabled={loading} className="mt-6 px-6 py-3 bg-wr-card rounded-xl text-on">Vorherige Ergebnisse</button>
      )}
      {!loading && resultCount > 0 && <p className="text-center text-on-muted mt-4">Seite {page + 1} von {Math.ceil(resultCount / SEARCH_PAGE_SIZE)}</p>}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-wr-card hover:bg-bg-elevated text-on rounded-xl transition-colors"
          >
            Weitere Ergebnisse ({resultCount - (page + 1) * SEARCH_PAGE_SIZE} weitere)
          </button>
        </div>
      )}

      {!loading && resultCount === 0 && (
        <div className="text-center py-12">
          
          <p className="text-on-muted">Keine Ergebnisse gefunden</p>
          <p className="text-on-muted text-sm mt-1">
            Versuche andere Suchbegriffe oder Filter
          </p>
        </div>
      )}
    </section>
  );
});

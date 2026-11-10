import { SearchInput } from './SearchInput';
import { motion } from 'motion/react';
import { getPartyColor, getPartyBgColor } from '@/lib/party-colors';
import type { SpeechSortOption, SpeakerSortOption, WordSortOption } from '@/lib/search-utils';
import type { SearchState } from '@/hooks/useSearchState';
import { TabButton } from './TabButton';
import { SPEECH_SORT_OPTIONS, SPEAKER_SORT_OPTIONS, WORD_SORT_OPTIONS } from './data';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

interface SearchHeaderProps {
  state: SearchState;
  updateState: (updates: Partial<SearchState>) => void;
  parties: string[];
}

export function SearchHeader({ state, updateState, parties }: SearchHeaderProps) {
  const surface = editionSurface(useOptionalEdition());
  const sortOptions = state.tab === 'speeches'
    ? SPEECH_SORT_OPTIONS
    : state.tab === 'speakers'
    ? SPEAKER_SORT_OPTIONS
    : WORD_SORT_OPTIONS;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-14 z-40 page-bg-sticky border-b border-track"
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <a
            href={editionPath(surface)}
            className="text-on-muted hover:text-on transition-colors"
            aria-label="Zurück zur Startseite"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="ds-display ds-display--sm">Bundestag Suche</h1>
        </div>

        <div className="relative mb-4">
          <SearchInput
            type="text"
            placeholder='Suche... (z.B. "klima" AND energie NOT atomkraft)'
            value={state.q}
            onQueryChange={(q) => updateState({ q })}
            className="w-full bg-wr-card border border-track rounded-xl px-4 py-3 pl-11 pr-14 text-on placeholder:text-on-muted focus:outline-none focus:ring-2 focus:ring-wr-pink focus:border-wr-pink"
            aria-label="Suche nach Reden, Abgeordneten oder Wörtern"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {state.q && (
            <button
              onClick={() => updateState({ q: '' })}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-3 text-on-muted hover:text-on"
              aria-label="Suchfeld leeren"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-1 sm:gap-2" role="tablist" aria-label="Suchmodus">
            <TabButton
              id="search-tab-speeches"
              active={state.tab === 'speeches'}
              onClick={() => updateState({ tab: 'speeches' })}
              controls="search-results"
            >
              Reden
            </TabButton>
            <TabButton
              id="search-tab-speakers"
              active={state.tab === 'speakers'}
              onClick={() => updateState({ tab: 'speakers' })}
              controls="search-results"
            >
              Abgeordnete
            </TabButton>
            <TabButton
              id="search-tab-words"
              active={state.tab === 'words'}
              onClick={() => updateState({ tab: 'words' })}
              controls="search-results"
            >
              Wörter
            </TabButton>
          </div>

          <select
            value={state.sort}
            onChange={(e) => updateState({ sort: e.target.value as SpeechSortOption | SpeakerSortOption | WordSortOption })}
            className="min-w-0 max-w-full min-h-11 bg-wr-card border border-track rounded-lg px-3 py-1.5 text-base text-on focus:outline-none focus:ring-1 focus:ring-wr-pink"
            aria-label="Sortieren nach"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Parteifilter">
          <button
            onClick={() => updateState({ party: '' })}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              !state.party
                ? 'bg-wr-card text-on'
                : 'bg-wr-card text-on-muted hover:bg-bg-elevated'
            }`}
            aria-pressed={!state.party}
          >
            Alle Parteien
          </button>
          {parties.map((party) => (
            <button
              key={party}
              onClick={() => updateState({ party: party === state.party ? '' : party })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                state.party === party
                  ? 'text-on ring-2 ring-white/50'
                  : 'text-on hover:ring-1 hover:ring-white/30'
              }`}
              style={{
                backgroundColor: state.party === party
                  ? getPartyBgColor(party)
                  : `${getPartyColor(party)}40`,
              }}
              aria-pressed={state.party === party}
            >
              {party}
            </button>
          ))}
        </div>

        {state.tab === 'speeches' && (
          <div className="flex items-center gap-3 mt-3">
            <span className="text-on-muted text-sm" id="word-count-label">Wörter:</span>
            <input
              type="number"
              placeholder="Min"
              value={state.minWords || ''}
              onChange={(e) => updateState({ minWords: parseInt(e.target.value, 10) || 0 })}
              className="w-20 bg-wr-card border border-track rounded-lg px-2 py-1 text-base text-on placeholder:text-on-muted focus:outline-none focus:ring-1 focus:ring-wr-pink"
              aria-label="Minimale Wortzahl"
            />
            <span className="text-on-muted" aria-hidden="true">–</span>
            <input
              type="number"
              placeholder="Max"
              value={state.maxWords || ''}
              onChange={(e) => updateState({ maxWords: parseInt(e.target.value, 10) || 0 })}
              className="w-20 bg-wr-card border border-track rounded-lg px-2 py-1 text-base text-on placeholder:text-on-muted focus:outline-none focus:ring-1 focus:ring-wr-pink"
              aria-label="Maximale Wortzahl"
            />
          </div>
        )}
      </div>
    </motion.header>
  );
}

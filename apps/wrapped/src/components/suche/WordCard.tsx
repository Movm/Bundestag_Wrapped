import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { PARTY_BG_CLASSES, PARTY_BG_COLORS } from '@/lib/party-colors';
import { highlightTerms, type ScoredWord, type ParsedQuery, type WordRanking } from '@/lib/search-utils';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

interface WordCardProps {
  word: ScoredWord;
  ranking?: WordRanking;
  query: ParsedQuery;
  index: number;
  onSearchInSpeeches?: (word: string) => void;
}

export function WordCard({ word, ranking, query, index, onSearchInSpeeches }: WordCardProps) {
  const surface = editionSurface(useOptionalEdition());
  const [expanded, setExpanded] = useState(false);

  const highlightedWord = useMemo(
    () => highlightTerms(word.word, query, 100),
    [word.word, query]
  );

  // Calculate max per1000 for scaling bars
  const maxPer1000 = useMemo(() => {
    return Math.max(...Object.values(word.parties).map((p) => p.per1000));
  }, [word.parties]);

  // Get parties sorted by usage
  const sortedParties = useMemo(() => {
    return Object.entries(word.parties)
      .filter(([, stats]) => stats.count > 0)
      .sort(([partyA, a], [partyB, b]) => b.per1000 - a.per1000 || partyA.localeCompare(partyB, 'de'))
      .map(([party]) => party);
  }, [word.parties]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="bg-wr-card hover:bg-bg-elevated border border-track rounded-xl overflow-hidden transition-all"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
        aria-expanded={expanded}
        aria-controls={`wordcard-details-${word.word}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-on font-medium text-lg">
              {highlightedWord}
            </h3>
            <div className="text-on-muted text-sm mt-0.5">
              {word.total.toLocaleString('de-DE')}x verwendet
            </div>
          </div>
          <div className="flex-shrink-0 text-on-muted">
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              ▼
            </motion.span>
          </div>
        </div>

        {/* Party bars - always visible */}
        <div className="mt-3 space-y-1.5">
          {sortedParties.slice(0, expanded ? undefined : 3).map((party) => {
            const stats = word.parties[party];
            if (!stats) return null;

            const widthPercent = maxPer1000 > 0 ? (stats.per1000 / maxPer1000) * 100 : 0;

            return (
              <div key={party} className="flex items-center gap-2">
                <div className="w-20 text-xs text-on-muted truncate">{party}</div>
                <div className="flex-1 h-4 bg-wr-card rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(widthPercent, 2)}%`,
                      backgroundColor: PARTY_BG_COLORS[party] || '#6B7280',
                    }}
                  />
                </div>
                <div className="w-16 text-xs text-on-muted text-right">
                  {stats.per1000.toFixed(2)}‰
                </div>
              </div>
            );
          })}
          {!expanded && sortedParties.length > 3 && (
            <div className="text-xs text-on-muted text-center pt-1">
              +{sortedParties.length - 3} weitere Parteien
            </div>
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={`wordcard-details-${word.word}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-track">
              {/* Top speakers from ranking data */}
              {ranking?.top && ranking.top.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-on-muted text-xs uppercase tracking-wider mb-2">
                    Top Sprecher ({ranking.speakers} Abgeordnete gesamt)
                  </h4>
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {ranking.top.map((speaker, idx) => (
                      <div
                        key={`${speaker.speaker}-${idx}`}
                        className="flex items-center gap-2 text-sm hover:bg-bg-elevated rounded px-2 py-1.5 -mx-2 transition-colors"
                      >
                        <span className="text-on-muted w-6 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs text-on shrink-0 ${
                            PARTY_BG_CLASSES[speaker.party] || 'bg-gray-500'
                          }`}
                        >
                          {speaker.party}
                        </span>
                        <span className="text-on truncate">
                          {speaker.speaker}
                        </span>
                        <span className={`text-xs shrink-0 ${speaker.gender === 'female' ? 'text-on-accent' : 'text-blue-400'}`}>
                          {speaker.gender === 'female' ? '♀' : '♂'}
                        </span>
                        <span className="text-on-muted ml-auto shrink-0">
                          {speaker.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: Top speakers from word index (if no ranking data) */}
              {!ranking?.top && word.topSpeakers && word.topSpeakers.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-on-muted text-xs uppercase tracking-wider mb-2">
                    Top Sprecher
                  </h4>
                  <div className="space-y-1">
                    {word.topSpeakers.map((speaker, idx) => (
                      <Link
                        key={speaker.slug}
                        to={editionPath(surface, `abgeordnete/${speaker.slug}`)}
                        className="flex items-center gap-2 text-sm hover:bg-bg-elevated rounded px-2 py-1 -mx-2 transition-colors"
                      >
                        <span className="text-on-muted w-6 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="text-on hover:text-on-accent truncate">
                          {speaker.name}
                        </span>
                        <span className="text-on-muted ml-auto shrink-0">
                          {speaker.count}×
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender breakdown */}
              {ranking?.byGender && (
                <div className="mb-4">
                  <h4 className="text-on-muted text-xs uppercase tracking-wider mb-2">
                    Nach Geschlecht
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-wr-card rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-blue-400"
                        style={{
                          width: `${(ranking.byGender.male / ranking.total) * 100}%`,
                        }}
                        title={`Männlich: ${ranking.byGender.male.toLocaleString('de-DE')}`}
                      />
                      <div
                        className="h-full bg-wr-pink"
                        style={{
                          width: `${(ranking.byGender.female / ranking.total) * 100}%`,
                        }}
                        title={`Weiblich: ${ranking.byGender.female.toLocaleString('de-DE')}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-on-muted mt-1">
                    <span>♂ {Math.round((ranking.byGender.male / ranking.total) * 100)}%</span>
                    <span>♀ {Math.round((ranking.byGender.female / ranking.total) * 100)}%</span>
                  </div>
                </div>
              )}

              {/* Party breakdown table */}
              <div className="mb-4">
                <h4 className="text-on-muted text-xs uppercase tracking-wider mb-2">
                  Nutzung nach Partei
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {sortedParties.map((party) => {
                    const stats = word.parties[party];
                    if (!stats) return null;
                    return (
                      <div key={party} className="flex items-center justify-between">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs text-on ${
                            PARTY_BG_CLASSES[party] || 'bg-gray-500'
                          }`}
                        >
                          {party}
                        </span>
                        <span className="text-on-muted">
                          {stats.count.toLocaleString('de-DE')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {onSearchInSpeeches && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchInSpeeches(word.word);
                    }}
                    className="flex-1 text-sm bg-wr-card hover:bg-bg-elevated text-on-accent rounded-lg py-2 px-3 transition-colors"
                  >
                    In Reden suchen →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { memo, useDeferredValue, useId, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Enter, Slide } from '@/design-system/components/Slide';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';
import { useSpeakerIndex } from '@/hooks/useDataQueries';
import { getPartyTone } from '@/lib/party-colors';
import { type SpeakerSummary } from '@/data/speaker-wrapped';

const MATCH_STEPS = [
  ['Fraktionen', 'in deine Reihenfolge bringen'],
  ['Themen', 'deine drei wichtigsten wählen'],
  ['Wörter', 'die dir aus dem Herzen sprechen'],
  ['Spirit Animal', 'eins tippen'],
] as const;
const MAX_HITS = 4;

function Arrow() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Like the quiz openers (edition-quiz.ts), suggestions skip the AfD and MPs without a group; the search finds everyone.
const NOT_SUGGESTED = new Set(['AfD', 'fraktionslos']);

/** Three suggestions from three groups: whoever gave the most speeches in each. */
function suggestions(speakers: readonly SpeakerSummary[]): SpeakerSummary[] {
  const seen = new Set<string>();
  return [...speakers]
    .sort((a, b) => b.speeches - a.speeches)
    .filter(s => !NOT_SUGGESTED.has(s.party) && !seen.has(s.party) && seen.add(s.party))
    .slice(0, 3);
}

/** Names that start with the query first, then the rest; with no query, the suggestions. */
function findSpeakers(speakers: readonly SpeakerSummary[], query: string): SpeakerSummary[] {
  const q = query.trim().toLocaleLowerCase('de-DE');
  if (!q) return suggestions(speakers);
  const starts = (s: SpeakerSummary) => s.name.toLocaleLowerCase('de-DE').split(/\s+/).some(part => part.startsWith(q));
  return speakers
    .filter(s => s.name.toLocaleLowerCase('de-DE').includes(q))
    .sort((a, b) => Number(starts(b)) - Number(starts(a)) || a.name.localeCompare(b.name, 'de'))
    .slice(0, MAX_HITS);
}

function MpSearch({ quizUrl }: { quizUrl: (slug: string) => string }) {
  const { data } = useSpeakerIndex();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const inputId = useId();
  const hits = useMemo(() => findSpeakers(data?.speakers ?? [], deferred), [data, deferred]);
  const searching = deferred.trim().length > 0;

  return (
    <div className="ds-next__search">
      <label htmlFor={inputId} className="ds-next__label">Name eingeben</label>
      <div className="ds-next__field">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="z. B. Müller"
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
        />
      </div>
      <p className="ds-next__hint" aria-live="polite">
        {searching ? (hits.length ? `${hits.length} Treffer` : 'Niemand gefunden – anderer Name?') : 'Oder gleich loslegen:'}
      </p>
      {hits.length > 0 && (
        <ul className="ds-next__hits">
          {hits.map(speaker => (
            <li key={speaker.slug}>
              <Link to={quizUrl(speaker.slug)} className="ds-next__hit" style={{ '--party': getPartyTone(speaker.party, 'dark') } as CSSProperties}>
                <span className="ds-next__dot" aria-hidden="true" />
                <span className="ds-next__name">{speaker.name}</span>
                <span className="ds-next__party">{speaker.party}</span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Between "Das war …" and the thanks: where to go next — Perfect Match and the MP quiz. */
export const NextSlide = memo(function NextSlide() {
  const edition = useOptionalEdition();
  const surface = editionSurface(edition);
  const hasMatch = Boolean(edition?.manifest?.assets.match);
  const quizUrl = (slug: string) => editionPath(surface, `abgeordnete/${slug}/quiz`);

  return (
    <Slide shapes={false}>
      <Enter className="ds-next__head">
        <p className="ds-eyebrow">Noch nicht genug?</p>
        <h2 className="ds-display ds-display--lg">Jetzt wird’s <span className="ds-next__accent">persönlich.</span></h2>
      </Enter>
      <div className="ds-next__cards" data-single={hasMatch ? undefined : ''}>
        {hasMatch && (
          <Enter className="ds-next__slot">
            <Link to={editionPath(surface, 'perfect-match')} className="ds-next__card ds-next__card--match">
              <span className="ds-next__kicker">Perfect Match</span>
              <h3 className="ds-next__title">Wer im Bundestag tickt wie du?</h3>
              <ol className="ds-next__steps" aria-label="In vier Schritten">
                {MATCH_STEPS.map(([step, what]) => <li key={step}><strong>{step}</strong> {what}</li>)}
              </ol>
              <p className="ds-next__lead">Am Ende stehen die drei Abgeordneten, die am besten zu dir passen.</p>
              <span className="ds-next__cta">Match finden<Arrow /></span>
            </Link>
          </Enter>
        )}
        <Enter className="ds-next__slot">
          <div className="ds-next__card ds-next__card--mdb">
            <span className="ds-next__kicker">Abgeordnete-Wrapped</span>
            <h3 className="ds-next__title">Wie gut kennst du deine Abgeordneten?</h3>
            <p className="ds-next__lead">Signature Words erraten, danach wartet das ganze Profil.</p>
            <MpSearch quizUrl={quizUrl} />
            <Link to={editionPath(surface, 'abgeordnete')} className="ds-next__all">Alle Abgeordneten<Arrow /></Link>
          </div>
        </Enter>
      </div>
    </Slide>
  );
});

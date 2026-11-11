import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ENTER } from '@/design-system/motion';
import { getPartyTone } from '@/lib/party-colors';
import { useSpeakerPortraits } from '@/hooks/useDataQueries';
import type { MatchResult } from '@/lib/perfect-match';

/** "Dr. Saskia Ludwig" → "SL": first and last name, academic titles skipped. */
function initials(name: string): string {
  const parts = name.split(/\s+/).filter(part => part && !part.endsWith('.'));
  return [parts[0], parts.length > 1 ? parts.at(-1) : null].filter(Boolean).map(part => part![0]).join('').toLocaleUpperCase('de-DE');
}

const CARD_COLORS = [['var(--color-wr-pink)', 'var(--color-wr-ink)'], ['var(--color-wr-violet)', '#fff'], ['#fff', 'var(--color-wr-ink)']];

/** Step 5: the top three MPs, each linking to their profile. */
export function ResultStep({ matches, profileUrl, onRestart }: { matches: MatchResult[]; profileUrl: (slug: string) => string; onRestart: () => void }) {
  const [note, setNote] = useState('');
  const [failed, setFailed] = useState<string[]>([]);
  const portraits = useSpeakerPortraits(matches.map(match => match.slug));

  const share = async () => {
    const [first] = matches;
    const text = first ? `Mein Perfect Match im Bundestag: ${first.name} (${first.party}), ${first.pct} %.` : 'Mein Perfect Match im Bundestag';
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'Bundestag Wrapped', text, url }); } catch { /* dismissed */ }
      return;
    }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setNote('Ergebnis kopiert'); } catch { setNote('Kopieren nicht möglich'); }
  };

  return (
    <>
      <motion.h1 variants={ENTER.rise} className="pm-result__title">It’s a <span>Match.</span></motion.h1>
      <ol className="pm-matches" aria-label="Deine drei besten Matches">
        {matches.map((match, index) => {
          const [bg, ink] = CARD_COLORS[index] ?? CARD_COLORS[2];
          const photo = failed.includes(match.slug) ? null : portraits[match.slug];
          return (
            <motion.li key={match.slug} variants={ENTER.rise}>
              <Link
                to={profileUrl(match.slug)}
                className="pm-match"
                style={{ '--pm-card': bg, '--pm-card-ink': ink, '--pm-party': getPartyTone(match.party, 'dark') } as CSSProperties}
                aria-label={`Platz ${index + 1}: ${match.name}, ${match.party}, ${match.pct} Prozent Übereinstimmung. Zum Profil`}
              >
                <div className="pm-match__visual" data-photo={Boolean(photo)} aria-hidden="true">
                  {photo && <img className="pm-match__photo" src={photo.thumbnailUrl ?? photo.url} alt="" loading="lazy" onError={() => setFailed(list => [...list, match.slug])} />}
                  {!photo && <span className="pm-match__initials">{initials(match.name)}</span>}
                  <span className="pm-match__pct">{match.pct}<span>%</span></span>
                  {match.animal && <span className="pm-match__emoji">{match.animal.emoji}</span>}
                </div>
                {photo && <span className="pm-match__credit">Foto: {photo.credit}</span>}
                <div className="pm-match__body">
                  <span className="pm-match__party">{match.party}</span>
                  <span className="pm-match__name">{match.name}</span>
                  <ul className="pm-match__reasons">
                    {match.reasons.map(reason => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>
              </Link>
            </motion.li>
          );
        })}
      </ol>
      <div className="pm__actions">
        <button type="button" className="mp-btn mp-btn--pink mp-btn--lg" onClick={onRestart}>Nochmal matchen</button>
        <button type="button" className="mp-btn mp-btn--ghost mp-btn--lg" onClick={share}>Ergebnis teilen</button>
        <p className="pm__note" role="status">{note}</p>
      </div>
      <p className="pm__note">Prozent = Übereinstimmung mit deinen Antworten: Fraktion 35 %, Themen 30 %, Wörter 25 %, Spirit Animal 10 %.</p>
    </>
  );
}

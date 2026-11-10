import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { SEO } from '@/components/seo/SEO';
import { SITE_CONFIG } from '@/components/seo/constants';
import { useSpeakerData, useSpeechesDb } from '@/hooks/useDataQueries';
import { fetchWikimediaIntro, wikipediaTitleFromDescription } from '@/lib/wikimedia-intro';
import { buildMdbQuiz, firstName, formatRatio, genitive, quizWords } from '@/lib/mdb-quiz';
import {
  displaySpeakerName,
  signatureAdjectivesForDisplay,
  speechesForSpeaker,
  speechTypeLabel,
} from '@/lib/speaker-profile-utils';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import type {
  AbgeordnetenwatchProfile,
  AbgeordnetenwatchSidejob,
  SpeakerWrapped,
} from '@/data/speaker-wrapped';
import type { Speech } from '@/lib/search-utils';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';
import { ArrowIcon, GrowBar, PartyPill, RatioBars, Reveal, partyStyle } from './mdb-profile/shared';

const number = new Intl.NumberFormat('de-DE');
const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
/** Typical plenary speaking pace, used only for the "≈ minutes" estimate. */
const WORDS_PER_MINUTE = 130;
const RANK_SHOWN = 25;

const VOTE_LABELS: Record<string, string> = { yes: 'Ja', no: 'Nein', abstain: 'Enthalten', no_show: 'Nicht da' };
const MANDATE_WON_LABELS: Record<string, string> = { constituency: 'Direktmandat', list: 'Landesliste', moved_up: 'Nachgerückt' };
const TONE_LABELS: Record<string, string> = {
  solution_focus: 'Lösungsfokus',
  collaboration: 'Zusammenarbeit',
  future_orientation: 'Zukunft',
  authority: 'Autorität',
  inclusivity: 'Inklusivität',
  emotional_intensity: 'Emotion',
  aggression: 'Angriff',
  labeling: 'Etiketten',
  acknowledgment: 'Anerkennung',
};
const TOPIC_COLORS = ['var(--color-wr-pink)', 'var(--color-wr-violet)', '#fff', 'var(--color-wr-mint)', 'var(--color-wr-lilac)'];

/** "86 - Aachen I (Bundestag 2025 - 2029)" → "86 · Aachen I"; drops soft hyphens. */
function stripPeriod(value?: string | null): string | null {
  if (!value) return null;
  return value.replace(/­/g, '').replace(/\s*\(Bundestag[^)]*\)\s*$/, '').replace(/^(\d+) - /, '$1 · ').trim() || null;
}

function sidejobIncome(job: AbgeordnetenwatchSidejob): number | null {
  return typeof job.income === 'number' ? job.income : null;
}

function rankDetail(rank: number | null | undefined, fallback: string): string {
  return rank && rank <= RANK_SHOWN ? `Platz ${rank} im Bundestag` : fallback;
}

type ChapterId = 'signatur' | 'zahlen' | 'themen' | 'ton' | 'reden' | 'abstimmungen' | 'mandat';
const CHAPTER_LABELS: Record<ChapterId, string> = {
  signatur: 'Signatur', zahlen: 'Zahlen', themen: 'Themen', ton: 'Ton', reden: 'Reden', abstimmungen: 'Abstimmungen', mandat: 'Mandat',
};

function useActiveChapter(ids: ChapterId[]): [ChapterId | undefined, (id: ChapterId) => void] {
  const [active, setActive] = useState<ChapterId | undefined>(ids[0]);
  const key = ids.join(',');
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id as ChapterId); }),
      { rootMargin: '-40% 0px -55% 0px' },
    );
    key.split(',').forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [key]);
  // Keep the active pill visible in the horizontally scrolling nav.
  useEffect(() => {
    if (active) document.querySelector(`[data-chapter-link="${active}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);
  return [active, setActive];
}

/** True once the chapter nav sticks below the fixed header (4rem). */
function useStuck(): [(node: HTMLElement | null) => void, boolean] {
  const [stuck, setStuck] = useState(false);
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!node) return;
    const update = () => setStuck(node.getBoundingClientRect().top <= 64.5);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [node]);
  return [setNode, stuck];
}

/** Big tile number; --chars lets the CSS fit it to the tile. */
function TileValue({ value }: { value: number }) {
  const text = number.format(value);
  return <span className="mp-tile__value" style={{ '--chars': Math.max(3, text.length) } as React.CSSProperties}>{text}</span>;
}

function ChapterHead({ num, kicker, title, children, className }: { num: string; kicker: string; title: string; children?: React.ReactNode; className?: string }) {
  return (
    <Reveal className={`mp-head ${className ?? ''}`}>
      <span className="mp-kicker">{num} · {kicker}</span>
      <h2 className="mp-h2">{title}</h2>
      {children}
    </Reveal>
  );
}

function Portrait({ speaker, name }: { speaker: SpeakerWrapped; name: string }) {
  const image = speaker.profileImage ?? speaker.officialImage ?? null;
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).map(part => part[0]).filter((_, i, all) => i === 0 || i === all.length - 1).join('').toLocaleUpperCase('de-DE');
  return (
    <Reveal className="mp-portrait">
      <figure className="m-0">
        <div className="mp-portrait__back" aria-hidden="true" />
        <div className="mp-portrait__frame">
          <span className="mp-portrait__initials" aria-hidden="true">{initials}</span>
          {image && !failed && (
            <img src={image.thumbnailUrl ?? image.url} alt={image.alt ?? `Porträt von ${name}`} loading="eager" onError={() => setFailed(true)} />
          )}
        </div>
        <figcaption>
          {image ? (
            <a href={image.sourceUrl} target="_blank" rel="noreferrer">
              Foto: {image.sourceLabel === 'Wikimedia Commons' ? 'Wikimedia' : image.sourceLabel ?? 'Bundestag'} ↗
            </a>
          ) : 'Kein frei lizenziertes Foto verfügbar'}
        </figcaption>
      </figure>
    </Reveal>
  );
}

function SpeechCard({ speech, longest }: { speech: Speech; longest: number }) {
  const [open, setOpen] = useState(false);
  const label = speechTypeLabel(speech);
  return (
    <button type="button" className="mp-speech" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <span className="mp-speech__meta">
        <span className={`mp-speech__type ${label === 'Rede' ? '' : 'mp-speech__type--short'}`}>{label}</span>
        <span className="mp-speech__words">{number.format(speech.words)} Wörter</span>
      </span>
      <span className="mp-speech__text">„{(open ? speech.text : speech.preview || speech.text).trim()}“</span>
      <span className="mp-speech__foot">
        <span className="mp-speech__length" aria-hidden="true"><span style={{ width: `${Math.max(4, (speech.words / longest) * 100)}%` }} /></span>
        <span className="mp-speech__more">{open ? 'Weniger' : 'Weiterlesen'}</span>
      </span>
    </button>
  );
}

function MandateChapter({ num, speaker, profile, bioText, bioSource }: {
  num: string;
  speaker: SpeakerWrapped;
  profile: AbgeordnetenwatchProfile | null;
  bioText: string | null;
  bioSource: { url: string; label: string } | null;
}) {
  const biography = speaker.biography ?? null;
  const mandate = profile?.mandate ?? null;
  const politician = profile?.politician ?? null;
  const sidejobs = profile?.sidejobs ?? [];
  const withIncome = sidejobs.filter(job => sidejobIncome(job) !== null || typeof job.incomeLevel === 'number');
  const topJob = [...sidejobs].sort((a, b) => (sidejobIncome(b) ?? -1) - (sidejobIncome(a) ?? -1))[0];
  const questions = politician?.questions ?? null;
  const answered = politician?.questionsAnswered ?? null;
  const share = questions && answered !== null ? Math.round((answered / questions) * 100) : null;
  const born = biography?.birthDate
    ? `${biography.birthDate}${biography.birthPlace ? ` in ${biography.birthPlace}` : ''}`
    : politician?.yearOfBirth ? String(politician.yearOfBirth) : null;
  const facts: [string, string | null | undefined][] = [
    ['Wahlperiode', stripPeriod(mandate?.parliamentPeriod)?.replace('Bundestag ', '')],
    ['Mandat', mandate?.mandateWon ? MANDATE_WON_LABELS[mandate.mandateWon] ?? mandate.mandateWon : null],
    ['Wahlkreis', stripPeriod(mandate?.constituency) ?? biography?.constituency],
    ['Fraktion', stripPeriod(mandate?.fraction) ?? speaker.party],
    ['Beruf', biography?.profession ?? politician?.occupation],
    ['Geboren', born],
  ];
  const shownFacts = facts.filter((fact): fact is [string, string] => !!fact[1]);

  return (
    <section id="mandat" className="mp-chapter" aria-labelledby="mandat-title">
      <Reveal className="mp-head mp-head--row">
        <div className="mp-head">
          <span className="mp-kicker">{num} · Mandat &amp; Transparenz</span>
          <h2 id="mandat-title" className="mp-h2">Person &amp; Nebenjobs</h2>
        </div>
        {profile && <a className="mp-btn mp-btn--ghost" href={profile.sourceUrl} target="_blank" rel="noreferrer">Profil bei Abgeordnetenwatch ↗</a>}
      </Reveal>
      <div className="mp-cards">
        {questions ? (
          <Reveal className="mp-card mp-card--row">
            <div className="mp-donut" style={{ '--p': share ?? 0 } as React.CSSProperties} aria-hidden="true"><span>{share ?? '–'}{share !== null && '%'}</span></div>
            <div>
              <div className="mp-card__title">Bürgerfragen</div>
              <div className="mp-card__detail">{answered !== null ? `${number.format(answered)} von ${number.format(questions)} beantwortet` : `${number.format(questions)} Fragen`}</div>
            </div>
          </Reveal>
        ) : null}
        {profile && (
          <Reveal className="mp-card">
            <div className="mp-card__big">
              <span>{number.format(sidejobs.length)}</span>
              <span>Nebentätigkeiten{sidejobs.length > 0 && <><br /><span className="mp-mint">{number.format(withIncome.length)} mit Einkommen</span></>}</span>
            </div>
            {topJob && (
              <div className="mp-job">
                <div>
                  <div className="mp-job__title">{topJob.organization ?? topJob.title}</div>
                  <div className="mp-job__detail">{[topJob.organization ? topJob.title : null, topJob.intervalLabel].filter(Boolean).join(' · ')}</div>
                </div>
                {sidejobIncome(topJob) !== null && <span className="mp-job__income">{euro.format(sidejobIncome(topJob)!)}</span>}
              </div>
            )}
            {sidejobs.length > 1 && (
              <details className="mp-details">
                <summary>Alle {number.format(sidejobs.length)} ansehen</summary>
                <ul>
                  {sidejobs.map(job => (
                    <li key={job.id} className="mp-job">
                      <div>
                        <div className="mp-job__title">{job.title}</div>
                        <div className="mp-job__detail">{[job.organization, job.intervalLabel].filter(Boolean).join(' · ')}</div>
                      </div>
                      <span className="mp-job__income">{sidejobIncome(job) !== null ? euro.format(sidejobIncome(job)!) : typeof job.incomeLevel === 'number' ? `Stufe ${job.incomeLevel}` : '–'}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Reveal>
        )}
        {shownFacts.length > 0 && (
          <Reveal className="mp-card">
            <dl className="mp-facts">
              {shownFacts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          </Reveal>
        )}
      </div>
      {bioText && (
        <Reveal className="mp-bio">
          <span className="mp-kicker">Kurzbiografie</span>
          <p>{bioText}</p>
          {bioSource && <a className="mp-link" href={bioSource.url} target="_blank" rel="noreferrer">Quelle: {bioSource.label} ↗</a>}
        </Reveal>
      )}
      <p className="mp-source">
        Daten: {profile ? `${profile.sourceLabel} (${profile.license}), Stand ${profile.updatedAt}; ` : ''}Bundestag-Plenarprotokolle. Fehlender Betrag = kein Einkommen im API-Eintrag hinterlegt.
      </p>
    </section>
  );
}

export function MdbProfilePage() {
  const surface = editionSurface(useOptionalEdition());
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: speaker, isLoading, error } = useSpeakerData(slug);
  const { data: speechesData } = useSpeechesDb({ enabled: !!speaker });
  const [shareNote, setShareNote] = useState<string | null>(null);

  const speeches = useMemo(() => {
    if (!speaker || !speechesData?.speeches) return [];
    return speechesForSpeaker(speechesData.speeches, speaker)
      .map((speech, index) => ({ ...speech, id: speech.id ?? index }))
      .sort((a, b) => b.id - a.id);
  }, [speaker, speechesData]);

  const description = speaker?.profileDescription ?? null;
  const wikipediaTitle = wikipediaTitleFromDescription(description);
  const { data: wikipediaIntro } = useQuery({
    queryKey: ['wikimedia-intro', wikipediaTitle],
    queryFn: () => fetchWikimediaIntro(wikipediaTitle ?? ''),
    enabled: !!wikipediaTitle,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const words = useMemo(() => (speaker ? quizWords(speaker) : []), [speaker]);
  const quiz = useMemo(() => (speaker ? buildMdbQuiz(speaker) : null), [speaker]);
  const signature = words.find(word => word.bundestag !== null);
  const topTopics = speaker?.topics?.topTopics.slice(0, 5) ?? [];
  const toneRows = speaker?.toneProfile
    ? Object.entries(speaker.toneProfile.scores)
        .filter(([key]) => key in TONE_LABELS)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];
  const votes = speaker?.abgeordnetenwatch?.votes?.recent.slice(0, 6) ?? [];
  const voteCount = speaker?.abgeordnetenwatch?.votes?.total ?? speaker?.abgeordnetenwatch?.votes?.recent.length ?? null;

  const chapters: ChapterId[] = speaker
    ? ([
        signature && 'signatur',
        'zahlen',
        topTopics.length > 0 && 'themen',
        toneRows.length > 0 && 'ton',
        speeches.length > 0 && 'reden',
        votes.length > 0 && 'abstimmungen',
        (speaker.abgeordnetenwatch || speaker.biography || description) && 'mandat',
      ].filter(Boolean) as ChapterId[])
    : [];
  const [active, setActive] = useActiveChapter(chapters);
  const [navRef, navStuck] = useStuck();
  const num = (id: ChapterId) => String(chapters.indexOf(id) + 1).padStart(2, '0');

  if (isLoading) {
    return (
      <div className="mp-page grid place-items-center">
        <p role="status" className="mp-muted">Lade Profil …</p>
      </div>
    );
  }

  if (error || !speaker) {
    return (
      <div className="mp-page grid place-items-center px-6">
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="mp-h2">Profil nicht gefunden</p>
          {error?.message && <p className="mp-muted">{error.message}</p>}
          <Link to={editionPath(surface, 'abgeordnete')} className="mp-link">Zur Abgeordneten-Suche</Link>
        </div>
      </div>
    );
  }

  const displayName = displaySpeakerName(speaker);
  const first = firstName(speaker);
  const nameParts = displayName.split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts.at(-1)! : '';
  const firstLine = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : displayName;
  const longName = nameParts.some(part => part.length > 12);
  const profile = speaker.abgeordnetenwatch ?? null;
  const mandate = profile?.mandate ?? null;
  const topTopicName = topTopics[0] ? TOPIC_BY_ID[topTopics[0].topic]?.name ?? topTopics[0].topic : null;
  const lead = [
    topTopicName ? `${first} redet am meisten über ${topTopicName}` : null,
    signature?.bundestag ? `${topTopicName ? 'und sagt' : `${first} sagt`} „${signature.word}“ ${formatRatio(signature.bundestag)} so oft wie der Bundestag-Durchschnitt` : null,
  ].filter(Boolean).join(' – ');
  const searchUrl = `${editionPath(surface, 'suche')}?tab=speeches&q=${encodeURIComponent(`"${displayName}"`)}`;
  const quizUrl = editionPath(surface, `abgeordnete/${speaker.slug}/quiz`);
  const longest = Math.max(1, ...speeches.map(speech => speech.words));
  const adjectives = signatureAdjectivesForDisplay(speaker).slice(0, 4).map(word => word.word);
  const moreWords = words.filter(word => word !== signature && word.bundestag !== null).slice(0, 5).map(word => word.word);
  const bioText = wikipediaIntro?.text ?? description?.longText ?? description?.text ?? null;
  const bioSource = wikipediaIntro
    ? { url: wikipediaIntro.sourceUrl, label: 'Wikipedia (CC BY-SA)' }
    : description ? { url: description.sourceUrl, label: `${description.sourceLabel}${description.license ? `, ${description.license}` : ''}` } : null;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: displayName, url }); } catch { /* dismissed */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); setShareNote('Link kopiert'); } catch { setShareNote('Kopieren nicht möglich'); }
  };

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    jobTitle: 'Mitglied des Bundestages',
    affiliation: { '@type': 'Organization', name: speaker.party },
    memberOf: { '@type': 'Organization', name: 'Deutscher Bundestag', url: 'https://www.bundestag.de' },
    ...(speaker.profileImage ?? speaker.officialImage ? { image: (speaker.profileImage ?? speaker.officialImage)!.url } : {}),
    ...(description ? { description: description.text } : {}),
    url: `${SITE_CONFIG.siteUrl}${editionPath(surface, `abgeordnete/${speaker.slug}`)}`,
  };

  return (
    <>
      <SEO
        title={`${displayName} (${speaker.party})`}
        description={`${displayName}: Profil mit Signaturwort, Themen, Reden, Abstimmungen und Nebentätigkeiten aus Bundestag Wrapped.`}
        canonicalUrl={editionPath(surface, `abgeordnete/${speaker.slug}`)}
        ogType="profile"
        structuredData={personSchema}
      />

      <div className="mp-page" style={partyStyle(speaker.party)}>
        <div className="mp-top mp-wrap">
          <Link to={editionPath(surface, 'abgeordnete')} className="mp-back"><ArrowIcon direction="left" />Alle Abgeordneten</Link>
          <div className="mp-top__actions">
            <Link to={searchUrl} className="mp-btn mp-btn--ghost">Reden durchsuchen</Link>
            <button type="button" className="mp-btn mp-btn--pink" onClick={() => void share()}>Teilen</button>
            <span role="status" className="sr-only">{shareNote}</span>
          </div>
        </div>

        <section className="mp-hero" aria-labelledby="mp-name">
          <div className="mp-hero__orb" aria-hidden="true" />
          <div className="mp-hero__grid mp-wrap">
            <div className="mp-hero__text">
              <Reveal className="mp-hero__pills">
                <PartyPill party={speaker.party} />
                {stripPeriod(mandate?.constituency) && <span className="mp-pill">WK {stripPeriod(mandate?.constituency)}</span>}
                {mandate?.mandateWon && <span className="mp-pill">{MANDATE_WON_LABELS[mandate.mandateWon] ?? mandate.mandateWon}</span>}
              </Reveal>
              <h1 id="mp-name" className={`mp-name ${longName ? 'mp-name--long' : ''}`}>
                <span>{firstLine}</span>{lastName && <> <span className="mp-name__last">{lastName}</span></>}
              </h1>
              {lead && <Reveal><p className="mp-lead">{lead}.</p></Reveal>}
              {speaker.spiritAnimal && (
                <Reveal className="mp-animal">
                  <span className="mp-animal__face" aria-hidden="true">{speaker.spiritAnimal.emoji}</span>
                  <span className="mp-animal__text">
                    <span className="mp-animal__label mp-mono">Profiltyp</span>
                    <span className="mp-animal__name">{speaker.spiritAnimal.name} · {speaker.spiritAnimal.title}</span>
                  </span>
                </Reveal>
              )}
            </div>
            <Portrait speaker={speaker} name={displayName} />
          </div>
        </section>

        <nav ref={navRef} className="mp-nav" data-stuck={navStuck} aria-label="Kapitel">
          <ol className="mp-nav__list">
            {chapters.map((id, index) => (
              <li key={id}>
                <a href={`#${id}`} data-chapter-link={id} className="mp-nav__link" aria-current={active === id ? 'true' : undefined} onClick={() => setActive(id)}>
                  <span className="mp-nav__num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{CHAPTER_LABELS[id]}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mp-main">
          {signature?.bundestag && (
            <section id="signatur" className="mp-chapter mp-signature" aria-labelledby="signatur-title">
              <div className="mp-signature__top">
                <h2 id="signatur-title" className="mp-kicker m-0">{num('signatur')} · Signaturwort</h2>
                <span>im Vergleich zum Bundestag</span>
              </div>
              <Reveal><span className="mp-signature__word block" lang="de" style={{ '--chars': signature.word.length } as React.CSSProperties}>{signature.word}</span></Reveal>
              <div className="mp-signature__grid">
                <RatioBars word={signature} name={first} party={speaker.party} />
                <div className="mp-signature__aside">
                  <p>
                    {formatRatio(signature.bundestag)} häufiger als der Bundestag-Durchschnitt
                    {signature.party ? ` – und ${formatRatio(signature.party)} häufiger als in der eigenen Fraktion.` : '.'}
                  </p>
                  {quiz && (
                    <Link to={quizUrl} className="mp-btn mp-btn--ink mp-btn--lg">{genitive(first)} Wörter erraten<ArrowIcon /></Link>
                  )}
                </div>
              </div>
              {(moreWords.length > 0 || adjectives.length > 0) && (
                <div className="flex flex-col gap-3">
                  {moreWords.length > 0 && <div className="mp-signature__more"><span className="mp-signature__more-label">Auch typisch</span>{moreWords.map(word => <span key={word}>{word}</span>)}</div>}
                  {adjectives.length > 0 && <div className="mp-signature__more"><span className="mp-signature__more-label">Adjektive</span>{adjectives.map(word => <span key={word}>{word}</span>)}</div>}
                </div>
              )}
            </section>
          )}

          <section id="zahlen" className="mp-chapter" aria-labelledby="zahlen-title">
            <ChapterHead num={num('zahlen')} kicker="In Zahlen" title="Die Legislatur bisher" />
            <div className="mp-tiles">
              <Reveal className="mp-tile mp-tile--violet">
                <TileValue value={speaker.totalWords} />
                <div><div className="mp-tile__label">Wörter gesprochen</div><div className="mp-tile__detail">{rankDetail(speaker.rankings.wordsRank, `≈ ${number.format(Math.max(1, Math.round(speaker.totalWords / WORDS_PER_MINUTE)))} Minuten am Rednerpult`)}</div></div>
              </Reveal>
              <Reveal className="mp-tile mp-tile--white">
                <TileValue value={speaker.speeches} />
                <div><div className="mp-tile__label">{speaker.speeches === 1 ? 'Rede' : 'Reden'}</div><div className="mp-tile__detail">{speaker.wortbeitraege > 0 ? `dazu ${number.format(speaker.wortbeitraege)} ${speaker.wortbeitraege === 1 ? 'Wortbeitrag' : 'Wortbeiträge'}` : rankDetail(speaker.rankings.speechRank, 'im Plenum')}</div></div>
              </Reveal>
              <Reveal className="mp-tile mp-tile--mint">
                <TileValue value={speaker.maxWords} />
                <div><div className="mp-tile__label">Wörter, längste Rede</div><div className="mp-tile__detail">{rankDetail(speaker.rankings.longestSpeechRank, `im Schnitt ${number.format(Math.round(speaker.avgWords))} pro Rede`)}</div></div>
              </Reveal>
              {voteCount !== null ? (
                <Reveal className="mp-tile mp-tile--card">
                  <TileValue value={voteCount} />
                  <div><div className="mp-tile__label">Namentliche Abstimmungen</div><div className="mp-tile__detail mp-muted">via Abgeordnetenwatch</div></div>
                </Reveal>
              ) : (
                <Reveal className="mp-tile mp-tile--card">
                  <TileValue value={speaker.drama.interruptionsReceived} />
                  <div><div className="mp-tile__label">Zwischenrufe erhalten</div><div className="mp-tile__detail mp-muted">{rankDetail(speaker.drama.interruptedRank, 'während der eigenen Reden')}</div></div>
                </Reveal>
              )}
            </div>
          </section>

          {topTopics.length > 0 && (
            <section id="themen" className="mp-chapter mp-chapter--split" aria-labelledby="themen-title">
              <ChapterHead num={num('themen')} kicker="Top-Themen" title={`Worüber ${first} redet`} className="mp-head--sticky">
                <p className="mp-copy">Themenwert aus dem persönlichen Wortprofil. Darunter die Wörter, die das Thema tragen.</p>
              </ChapterHead>
              <ol className="mp-ranks" aria-label="Top-Themen">
                {topTopics.map((topic, index) => (
                  <Reveal as="li" key={topic.topic} className="mp-rank">
                    <span className="mp-rank__num" aria-hidden="true">{index + 1}</span>
                    <div className="mp-rank__body">
                      <div className="mp-rank__title">
                        <span className="mp-rank__name">{TOPIC_BY_ID[topic.topic]?.name ?? topic.topic}</span>
                        <span className="mp-rank__score">{topic.score.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <span className="mp-meter" aria-hidden="true"><GrowBar className="mp-meter__fill" width={(topic.score / (topTopics[0].score || 1)) * 100} style={{ background: TOPIC_COLORS[index] }} /></span>
                      {speaker.topics?.topicWords[topic.topic]?.length ? (
                        <ul className="mp-chips" aria-label="Wörter zum Thema">
                          {speaker.topics.topicWords[topic.topic].slice(0, 5).map(word => <li key={word.word}>{word.word} {word.count}×</li>)}
                        </ul>
                      ) : null}
                    </div>
                  </Reveal>
                ))}
              </ol>
            </section>
          )}

          {toneRows.length > 0 && (
            <section id="ton" className="mp-chapter mp-chapter--split" aria-labelledby="ton-title">
              <ChapterHead num={num('ton')} kicker="Tonalität" title={`So klingt ${first}`} className="mp-head--sticky">
                <p className="mp-copy">Die stärksten Werte im Tonalitätsmodell, jeweils von 0 bis 100.</p>
              </ChapterHead>
              <ol className="mp-ranks" aria-label="Tonalität">
                {toneRows.map(([key, value], index) => (
                  <Reveal as="li" key={key} className="mp-rank">
                    <span className="mp-rank__num" aria-hidden="true">{index + 1}</span>
                    <div className="mp-rank__body">
                      <div className="mp-rank__title">
                        <span className="mp-rank__name">{TONE_LABELS[key]}</span>
                        <span className="mp-rank__score">{Math.round(value)}</span>
                      </div>
                      <span className="mp-meter" aria-hidden="true"><GrowBar className="mp-meter__fill" width={value} style={{ background: TOPIC_COLORS[index] }} /></span>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </section>
          )}

          {speeches.length > 0 && (
            <section id="reden" className="mp-chapter" aria-labelledby="reden-title">
              <Reveal className="mp-head mp-head--row">
                <div className="mp-head">
                  <span className="mp-kicker">{num('reden')} · Reden</span>
                  <h2 id="reden-title" className="mp-h2">So fängt {first} an</h2>
                </div>
                <p className="mp-source max-w-[22rem]">Reihenfolge laut Export – Datum und Tagesordnungspunkt fehlen noch in den Rededaten.</p>
              </Reveal>
              <ul className="mp-speeches">
                {speeches.slice(0, 6).map(speech => <Reveal as="li" key={speech.id}><SpeechCard speech={speech} longest={longest} /></Reveal>)}
              </ul>
              {speeches.length > 6 && <Link to={searchUrl} className="mp-link self-start">Alle {number.format(speeches.length)} Beiträge in der Suche →</Link>}
            </section>
          )}

          {votes.length > 0 && (
            <section id="abstimmungen" className="mp-chapter mp-chapter--split" aria-labelledby="abstimmungen-title">
              <ChapterHead num={num('abstimmungen')} kicker="Abstimmungen" title="Ja. Nein. Ja.">
                <p className="mp-copy">Die neuesten namentlichen Abstimmungen aus dem Mandat.</p>
                {profile && <a className="mp-link" href={profile.sourceUrl} target="_blank" rel="noreferrer">{voteCount ? `Alle ${number.format(voteCount)}` : 'Alle'} auf Abgeordnetenwatch ↗</a>}
              </ChapterHead>
              <ul className="mp-votes">
                {votes.map(vote => {
                  const body = (
                    <>
                      <span className="mp-vote__title">{vote.pollLabel}</span>
                      <span className="mp-vote__value" data-vote={vote.vote}>{VOTE_LABELS[vote.vote] ?? vote.vote}</span>
                    </>
                  );
                  return (
                    <Reveal as="li" key={vote.id}>
                      {vote.url ? <a className="mp-vote" href={vote.url} target="_blank" rel="noreferrer">{body}</a> : <div className="mp-vote">{body}</div>}
                    </Reveal>
                  );
                })}
              </ul>
            </section>
          )}

          {chapters.includes('mandat') && (
            <MandateChapter num={num('mandat')} speaker={speaker} profile={profile} bioText={bioText} bioSource={bioSource} />
          )}

          {quiz && (
            <Reveal className="mp-cta">
              <div className="mp-cta__text">
                <span className="mp-mono text-sm">Quiz · {quiz.rounds.length} Runden</span>
                <h2 className="mp-cta__title">Kennst du {genitive(first)} Signature Words?</h2>
                <p>{genitive(first)} Wörter gegen den Bundestag – und gegen die eigene Fraktion.</p>
              </div>
              <Link to={quizUrl} className="mp-btn mp-btn--white mp-btn--lg">Quiz starten<ArrowIcon /></Link>
            </Reveal>
          )}
        </div>
      </div>
    </>
  );
}

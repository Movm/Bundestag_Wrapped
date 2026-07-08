import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  ExternalLink,
  IdCard,
  type LucideIcon,
  MapPin,
  MessageSquare,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { SEO } from '@/components/seo/SEO';
import { SITE_CONFIG } from '@/components/seo/constants';
import { PartyBadge } from '@/components/ui/PartyBadge';
import { useSpeakerData, useSpeechesDb } from '@/hooks/useDataQueries';
import { getPartyColor, getPartyTextColor } from '@/lib/party-colors';
import {
  buildMdbLiveSummary,
  fetchWikimediaIntro,
  wikipediaTitleFromDescription,
} from '@/lib/mdb-live-summary';
import {
  displaySpeakerName,
  signatureAdjectivesForDisplay,
  signatureWordsForDisplay,
  speechesForSpeaker,
  speechTypeLabel,
} from '@/lib/speaker-profile-utils';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import type { Speech } from '@/lib/search-utils';
import type {
  AbgeordnetenwatchProfile,
  AbgeordnetenwatchSidejob,
  AbgeordnetenwatchVote,
  OfficialImageMetadata,
  ProfileDescription,
  ProfileImageMetadata,
  SpeakerBiography,
  SpeakerWrapped,
  SpiritAnimal,
} from '@/data/speaker-wrapped';

function formatNumber(value: number): string {
  return value.toLocaleString('de-DE');
}

function formatRatio(value: number): string {
  return `${value.toFixed(1)}x`;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

const INCOME_LEVEL_LABELS: Record<number, string> = {
  0: '1 € bis 1.000 €',
  1: '1.000 € bis 3.500 €',
  2: '3.500 € bis 7.000 €',
  3: '7.000 € bis 15.000 €',
  4: '15.000 € bis 30.000 €',
  5: '30.000 € bis 50.000 €',
  6: '50.000 € bis 75.000 €',
  7: '75.000 € bis 100.000 €',
  8: '100.000 € bis 150.000 €',
  9: '150.000 € bis 250.000 €',
  10: 'ab 250.000 €',
};

const VOTE_LABELS: Record<string, string> = {
  yes: 'Ja',
  no: 'Nein',
  abstain: 'Enthalten',
  no_show: 'Nicht beteiligt',
};

const MANDATE_WON_LABELS: Record<string, string> = {
  constituency: 'Direktmandat',
  list: 'Landesliste',
  moved_up: 'Nachgerückt',
};

function formatIncome(sidejob: AbgeordnetenwatchSidejob): string {
  if (typeof sidejob.income === 'number') return formatEuro(sidejob.income);
  if (typeof sidejob.incomeLevel === 'number') {
    return `Stufe ${sidejob.incomeLevel}: ${INCOME_LEVEL_LABELS[sidejob.incomeLevel] ?? 'unbekannte Spanne'}`;
  }
  return 'kein Einkommen gemeldet';
}

function formatVote(value: string): string {
  return VOTE_LABELS[value] ?? value;
}

function formatMandateWon(value?: string | null): string | null {
  if (!value) return null;
  return MANDATE_WON_LABELS[value] ?? value;
}

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-white/45">{detail}</p>}
    </div>
  );
}

function SpeechRow({ speech }: { speech: Speech }) {
  return (
    <details className="group rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 open:bg-white/[0.055]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/75">
              {speechTypeLabel(speech)}
            </span>
            <span className="text-xs text-white/40">{formatNumber(speech.words)} Wörter</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-white/75">{speech.preview || speech.text}</p>
        </div>
        <span className="mt-1 text-sm text-pink-300 group-open:rotate-45">+</span>
      </summary>
      <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-white/70">
        {speech.text}
      </p>
    </details>
  );
}

type ToneCard = [label: string, value: number, Icon: LucideIcon];
type ProfileTab = 'overview' | 'bio' | 'transparency' | 'topics' | 'language' | 'tone' | 'speeches' | 'votes';
type ProfileHighlight = {
  label: string;
  value: string;
  detail: string;
  Icon: LucideIcon;
};

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Überblick' },
  { id: 'topics', label: 'Themen' },
  { id: 'speeches', label: 'Reden' },
  { id: 'votes', label: 'Abstimmungen' },
  { id: 'transparency', label: 'Transparenz' },
];

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-white text-bg-primary'
          : 'border border-white/10 bg-white/[0.035] text-white/60 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function InsightCard({ highlight }: { highlight: ProfileHighlight }) {
  const { Icon } = highlight;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{highlight.label}</p>
        <Icon size={18} className="text-pink-300/70" />
      </div>
      <p className="mt-3 text-xl font-black text-white">{highlight.value}</p>
      <p className="mt-2 text-sm leading-6 text-white/58">{highlight.detail}</p>
    </div>
  );
}

function buildToneHighlight(speaker: SpeakerWrapped): ProfileHighlight | null {
  if (!speaker.toneProfile) return null;

  const toneCandidates: ProfileHighlight[] = [
    {
      label: 'Tonalität',
      value: `${Math.round(speaker.toneProfile.scores.solution_focus)}% Lösungsfokus`,
      detail: 'Die Sprache wirkt im Modell stark auf Lösung, Zukunft und Handlungsfähigkeit ausgerichtet.',
      Icon: BarChart3,
    },
    {
      label: 'Tonalität',
      value: `${Math.round(speaker.toneProfile.scores.collaboration)}% Zusammenarbeit`,
      detail: 'Kooperative Begriffe und Wir-Formulierungen sind im Tonprofil deutlich vertreten.',
      Icon: Trophy,
    },
    {
      label: 'Tonalität',
      value: `${Math.round(speaker.toneProfile.scores.future_orientation)}% Zukunft`,
      detail: 'Das Sprachprofil zeigt einen starken Fokus auf kommende Aufgaben und politische Richtung.',
      Icon: Sparkles,
    },
  ];

  return toneCandidates.sort((a, b) => Number.parseInt(b.value, 10) - Number.parseInt(a.value, 10))[0];
}

function buildProfileHighlights({
  speaker,
  topTopicName,
  topTopicWords,
  signatureWords,
  signatureAdjectives,
  spiritAnimal,
  abgeordnetenwatch,
}: {
  speaker: SpeakerWrapped;
  topTopicName?: string;
  topTopicWords: string[];
  signatureWords: ReturnType<typeof signatureWordsForDisplay>;
  signatureAdjectives: ReturnType<typeof signatureAdjectivesForDisplay>;
  spiritAnimal: SpiritAnimal | null;
  abgeordnetenwatch?: AbgeordnetenwatchProfile | null;
}): ProfileHighlight[] {
  const highlights: ProfileHighlight[] = [];

  if (abgeordnetenwatch?.sidejobs?.length) {
    const incomeJobs = abgeordnetenwatch.sidejobs.filter(
      (sidejob) => typeof sidejob.income === 'number' || typeof sidejob.incomeLevel === 'number'
    ).length;
    highlights.push({
      label: 'Transparenz',
      value: `${abgeordnetenwatch.sidejobs.length} Nebentätigkeiten`,
      detail: incomeJobs > 0
        ? `${incomeJobs} davon mit veröffentlichter Einkommensangabe bei Abgeordnetenwatch.`
        : 'Bei diesen Einträgen ist aktuell kein Einkommen hinterlegt.',
      Icon: BriefcaseBusiness,
    });
  }

  if (abgeordnetenwatch?.votes?.total) {
    highlights.push({
      label: 'Abstimmungen',
      value: `${formatNumber(abgeordnetenwatch.votes.total)} namentliche Votes`,
      detail: 'Abgeordnetenwatch verknüpft das aktuelle Mandat mit einzelnen namentlichen Abstimmungen.',
      Icon: IdCard,
    });
  }

  if (spiritAnimal) {
    highlights.push({
      label: 'Profilbild',
      value: spiritAnimal.name,
      detail: spiritAnimal.reason,
      Icon: Sparkles,
    });
  }

  if (speaker.rankings.wordsRank <= 10) {
    highlights.push({
      label: 'Wortgewicht',
      value: `#${speaker.rankings.wordsRank} nach Wörtern`,
      detail: `${formatNumber(speaker.totalWords)} ausgewertete Wörter machen dieses Profil im Datensatz besonders sichtbar.`,
      Icon: Trophy,
    });
  }

  if (speaker.drama.interruptedRank && speaker.drama.interruptedRank <= 10 && speaker.drama.interruptionsReceived > 0) {
    highlights.push({
      label: 'Plenardrama',
      value: `#${speaker.drama.interruptedRank} bei Zwischenrufen`,
      detail: `${formatNumber(speaker.drama.interruptionsReceived)} registrierte Zwischenrufe gegen diese Redebeiträge.`,
      Icon: MessageSquare,
    });
  }

  if (speaker.rankings.longestSpeechRank <= 10) {
    highlights.push({
      label: 'Längste Rede',
      value: `#${speaker.rankings.longestSpeechRank} im Bundestag`,
      detail: `Die längste erfasste Rede umfasst ${formatNumber(speaker.maxWords)} Wörter.`,
      Icon: BarChart3,
    });
  }

  if (topTopicName) {
    highlights.push({
      label: 'Top-Thema',
      value: topTopicName,
      detail: topTopicWords.length
        ? `Prägende Wörter: ${topTopicWords.join(', ')}.`
        : 'Das stärkste Thema im persönlichen Themenprofil.',
      Icon: BookOpen,
    });
  }

  const signatureWord = signatureWords[0];
  if (signatureWord) {
    highlights.push({
      label: 'Signaturwort',
      value: signatureWord.word,
      detail: `${formatRatio(signatureWord.ratio ?? 0)} häufiger als der Bundestag-Durchschnitt.`,
      Icon: Sparkles,
    });
  }

  const signatureAdjective = signatureAdjectives[0];
  if (signatureAdjective) {
    highlights.push({
      label: 'Signatur-Adjektiv',
      value: signatureAdjective.word,
      detail: `${formatRatio(signatureAdjective.ratio ?? 0)} häufiger als der Bundestag-Durchschnitt.`,
      Icon: BookOpen,
    });
  }

  const toneHighlight = buildToneHighlight(speaker);
  if (toneHighlight) {
    highlights.push(toneHighlight);
  }

  return highlights.slice(0, 6);
}

function buildOverviewLead({
  speaker,
  topTopicName,
  signatureWord,
}: {
  speaker: SpeakerWrapped;
  topTopicName?: string;
  signatureWord?: string;
}) {
  const observations: string[] = [];

  if (speaker.rankings.wordsRank <= 10) {
    observations.push('sehr hohe Redepräsenz');
  }
  if (speaker.drama.interruptedRank && speaker.drama.interruptedRank <= 10) {
    observations.push('auffallend viele Zwischenrufe');
  }
  if (speaker.rankings.longestSpeechRank <= 10) {
    observations.push('besonders ausführliche Beiträge');
  }

  const rankSentence = observations.length
    ? `Das Profil fällt durch ${observations.join(', ')} auf.`
    : `Das Profil bündelt die parlamentarischen Spuren aus ${formatNumber(speaker.wortbeitraege)} Wortbeiträgen.`;
  const topicSentence = topTopicName
    ? `Inhaltlich liegt der Schwerpunkt bei ${topTopicName}.`
    : 'Das Themenprofil ist noch nicht stark genug ausdifferenziert.';
  const wordSentence = signatureWord
    ? `Sprachlich setzt "${signatureWord}" einen wiedererkennbaren Akzent.`
    : 'Für die Sprache liegen noch keine belastbaren Signaturwörter vor.';

  return `${rankSentence} ${topicSentence} ${wordSentence}`;
}

function OverviewDigest({
  lead,
  highlights,
}: {
  lead: string;
  highlights: ProfileHighlight[];
}) {
  return (
    <div>
      <div className="max-w-3xl">
        <p className="text-sm leading-7 text-white/68">{lead}</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {highlights.map((highlight) => (
          <InsightCard key={`${highlight.label}-${highlight.value}`} highlight={highlight} />
        ))}
      </div>
    </div>
  );
}

function SpiritAnimalSpotlight({
  animal,
  partyColor,
}: {
  animal: SpiritAnimal;
  partyColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 justify-self-end text-center">
      <div
        className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full border-[3px] bg-white/[0.04] text-7xl shadow-2xl shadow-black/30"
        style={{ borderColor: `${partyColor}99` }}
        aria-hidden="true"
      >
        {animal.emoji}
      </div>
      <div>
        <p className="text-lg font-black leading-tight text-white">{animal.name}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/80">{animal.title}</p>
      </div>
    </div>
  );
}

function BiographyFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-white/45">
        <Icon size={16} />
        <p className="text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-white/80">{value}</p>
    </div>
  );
}

function BiographySummary({ biography }: { biography: SpeakerBiography }) {
  const hasFacts = biography.birthDate || biography.birthPlace || biography.constituency || biography.profession;
  if (!hasFacts && !biography.roles?.length) return null;

  return (
    <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Biografie</p>
          <h3 className="mt-1 text-lg font-black text-white">Direktdaten zur Person</h3>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BiographyFact icon={CalendarDays} label="Geboren" value={biography.birthDate} />
        <BiographyFact icon={MapPin} label="Ort" value={biography.birthPlace} />
        <BiographyFact icon={IdCard} label="Wahlkreis" value={biography.constituency} />
        <BiographyFact icon={BriefcaseBusiness} label="Beruf" value={biography.profession} />
      </div>
      {biography.roles?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {biography.roles.map((role) => (
            <span key={role} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
              {role}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProfilePortrait({ image, name }: { image: ProfileImageMetadata | OfficialImageMetadata; name: string }) {
  const sourceLabel = image.sourceLabel === 'Wikimedia Commons' ? 'Wikimedia' : 'Bundestag';

  return (
    <figure className="w-[150px] shrink-0 md:w-[210px]">
      <div className="h-[187px] overflow-hidden rounded-2xl border-[3px] border-pink-600/55 bg-white/[0.04] shadow-2xl shadow-pink-950/30 md:h-[262px]">
      <img
        src={image.thumbnailUrl ?? image.url}
        alt={image.alt ?? `${name}, offizielles Bundestag-Foto`}
        className="h-full w-full object-cover"
        loading="eager"
      />
      </div>
      <figcaption className="sr-only">
        <a
          href={image.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Foto: {sourceLabel} <ExternalLink size={11} />
        </a>
      </figcaption>
      <a
        href={image.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-pink-200"
      >
        Foto: {sourceLabel} <ExternalLink size={11} />
      </a>
    </figure>
  );
}

function ProfileDescriptionBlock({ description }: { description: ProfileDescription }) {
  const displayText = description.longText ?? description.text;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Kurzbeschreibung</p>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/70">{displayText}</p>
      <a
        href={description.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-pink-300 hover:text-pink-200"
      >
        Quelle: {description.sourceLabel}
        {description.license ? `, ${description.license}` : ''}
        <ExternalLink size={13} />
      </a>
    </div>
  );
}

function OfficialImageCard({ image }: { image: OfficialImageMetadata }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-white/10 bg-bg-card/80 shadow-2xl">
      <img
        src={image.thumbnailUrl ?? image.url}
        alt={image.alt ?? image.caption ?? 'Offizielles Bundestag-Foto'}
        className="aspect-[4/3] w-full object-cover"
        loading="lazy"
      />
      <figcaption className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/45">
          <Camera size={15} />
          Offizielles Foto
        </div>
        <p className="text-sm font-semibold text-white/80">{image.credit}</p>
        {image.takenAt ? <p className="text-xs text-white/45">Aufgenommen: {image.takenAt}</p> : null}
        <a
          href={image.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-pink-300 hover:text-pink-200"
        >
          {image.sourceLabel} <ExternalLink size={13} />
        </a>
      </figcaption>
    </figure>
  );
}

function BiographyDetail({
  biography,
  description,
  profileImage,
  image,
}: {
  biography?: SpeakerBiography | null;
  description?: ProfileDescription | null;
  profileImage?: ProfileImageMetadata | null;
  image?: OfficialImageMetadata | null;
}) {
  if (!biography && !description && !profileImage && !image) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Biografie</p>
        <h2 className="mt-2 text-2xl font-black text-white">Noch keine Zusatzdaten</h2>
        <p className="mt-4 text-white/55">
          Für dieses Profil sind noch keine biografischen Ergänzungen oder offiziellen Bilddaten importiert.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Biografie</p>
      <h2 className="mt-2 text-2xl font-black text-white">Person, Mandat & Quellen</h2>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {description ? <ProfileDescriptionBlock description={description} /> : null}

          {biography ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <BiographyFact icon={CalendarDays} label="Geboren" value={biography.birthDate} />
                <BiographyFact icon={MapPin} label="Geburtsort" value={biography.birthPlace} />
                <BiographyFact icon={MapPin} label="Wohnort" value={biography.residence} />
                <BiographyFact icon={BriefcaseBusiness} label="Beruf" value={biography.profession} />
                <BiographyFact icon={IdCard} label="Wahlkreis" value={biography.constituency} />
              </div>

              {biography.roles?.length ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <h3 className="font-bold text-white">Funktionen</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {biography.roles.map((role) => (
                      <span key={role} className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {biography.education?.length ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <h3 className="font-bold text-white">Ausbildung</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{biography.education.join(', ')}</p>
                </div>
              ) : null}

              {biography.sourceUrl ? (
                <a
                  href={biography.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-pink-300 hover:text-pink-200"
                >
                  Quelle: {biography.sourceLabel ?? 'Bundestag'} <ExternalLink size={15} />
                </a>
              ) : null}
            </>
          ) : (
            <p className="text-white/55">Für dieses Profil sind noch keine biografischen Ergänzungen importiert.</p>
          )}
        </div>

        {profileImage || image ? (
          <div className="space-y-3">
            {profileImage ? <OfficialImageCard image={profileImage} /> : null}
            {image ? <OfficialImageCard image={image} /> : null}
            {profileImage?.usageNotice ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-white/55">
                {profileImage.usageNotice}
              </div>
            ) : null}
            {image?.usageNotice ? (
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100/80">
                {image.usageNotice}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TransparencySummary({ profile }: { profile: AbgeordnetenwatchProfile }) {
  const sidejobCount = profile.sidejobs?.length ?? 0;
  const incomeCount = profile.sidejobs?.filter(
    (sidejob) => typeof sidejob.income === 'number' || typeof sidejob.incomeLevel === 'number'
  ).length ?? 0;

  return (
    <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Transparenz</p>
          <h3 className="mt-1 text-lg font-black text-white">Abgeordnetenwatch-Daten</h3>
        </div>
        <a
          href={profile.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/50 hover:text-pink-200"
        >
          {profile.sourceLabel} <ExternalLink size={13} />
        </a>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Nebentätigkeiten" value={formatNumber(sidejobCount)} />
        <StatTile label="mit Einkommen" value={formatNumber(incomeCount)} detail="gemeldete Beträge/Stufen" />
        <StatTile label="Abstimmungen" value={formatNumber(profile.votes?.total ?? profile.votes?.recent.length ?? 0)} />
        <StatTile label="Bürgerfragen" value={formatNumber(profile.politician.questions ?? 0)} />
      </div>
    </div>
  );
}

function SidejobRow({ sidejob }: { sidejob: AbgeordnetenwatchSidejob }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{sidejob.title}</p>
          {sidejob.organization ? <p className="mt-1 text-sm text-white/55">{sidejob.organization}</p> : null}
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
          {formatIncome(sidejob)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {sidejob.categoryLabel ? (
          <span className="rounded-full bg-pink-400/15 px-2.5 py-1 text-xs text-pink-100/80">
            {sidejob.categoryLabel}
          </span>
        ) : null}
        {sidejob.intervalLabel ? (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">
            {sidejob.intervalLabel}
          </span>
        ) : null}
        {[sidejob.city, sidejob.country].filter(Boolean).join(', ') ? (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">
            {[sidejob.city, sidejob.country].filter(Boolean).join(', ')}
          </span>
        ) : null}
        {sidejob.topics?.slice(0, 3).map((topic) => (
          <span key={topic} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">
            {topic}
          </span>
        ))}
      </div>
      {sidejob.dataChangeDate ? (
        <p className="mt-3 text-xs text-white/38">Letzte Datenänderung: {sidejob.dataChangeDate}</p>
      ) : null}
    </div>
  );
}

function VoteRow({ vote }: { vote: AbgeordnetenwatchVote }) {
  return (
    <a
      href={vote.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-white/10 bg-white/[0.035] p-4 hover:bg-white/[0.055]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold text-white">{vote.pollLabel}</p>
          {vote.fraction ? <p className="mt-1 text-xs text-white/42">{vote.fraction}</p> : null}
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
          {formatVote(vote.vote)}
        </span>
      </div>
    </a>
  );
}

function TransparencyDetail({ profile }: { profile?: AbgeordnetenwatchProfile | null }) {
  if (!profile) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Transparenz</p>
        <h2 className="mt-2 text-2xl font-black text-white">Noch nicht verknüpft</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
          Für dieses Profil sind noch keine Abgeordnetenwatch-Daten importiert. Verfügbar wären Stammdaten,
          aktuelle Mandate, namentliche Abstimmungen und gemeldete Nebentätigkeiten.
        </p>
      </div>
    );
  }

  const mandate = profile.mandate;
  const sidejobs = profile.sidejobs ?? [];
  const votes = profile.votes?.recent ?? [];
  const answered = profile.politician.questionsAnswered;
  const questions = profile.politician.questions;
  const answerDetail = typeof answered === 'number' && typeof questions === 'number'
    ? `${formatNumber(answered)} von ${formatNumber(questions)} beantwortet`
    : typeof questions === 'number'
      ? `${formatNumber(questions)} Fragen, Antwortzahl nicht ausgewiesen`
      : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Transparenz</p>
          <h2 className="mt-2 text-2xl font-black text-white">Mandat, Nebentätigkeiten & Votes</h2>
        </div>
        <a
          href={profile.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
        >
          Profil bei Abgeordnetenwatch <ExternalLink size={15} />
        </a>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Nebentätigkeiten" value={formatNumber(sidejobs.length)} />
        <StatTile label="Abstimmungen" value={formatNumber(profile.votes?.total ?? votes.length)} />
        <StatTile label="Bürgerfragen" value={formatNumber(questions ?? 0)} detail={answerDetail} />
        <StatTile label="Lizenz" value={profile.license} detail="Abgeordnetenwatch API" />
      </div>

      {mandate ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <h3 className="font-bold text-white">Aktuelles Mandat</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <BiographyFact icon={IdCard} label="Wahlperiode" value={mandate.parliamentPeriod ?? mandate.label} />
            <BiographyFact icon={BriefcaseBusiness} label="Fraktion" value={mandate.fraction} />
            <BiographyFact icon={MapPin} label="Wahlkreis" value={mandate.constituency} />
            <BiographyFact icon={Trophy} label="Mandat" value={formatMandateWon(mandate.mandateWon)} />
          </div>
          {typeof mandate.constituencyResult === 'number' ? (
            <p className="mt-3 text-sm text-white/55">
              Wahlkreisergebnis: {mandate.constituencyResult.toLocaleString('de-DE')}%.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div>
          <h3 className="font-bold text-white">Nebentätigkeiten</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Abgeordnetenwatch bereitet Veröffentlichungen der Bundestagsverwaltung auf. Ein fehlender Betrag
            bedeutet hier: In diesem API-Eintrag ist kein Einkommen hinterlegt.
          </p>
          <div className="mt-4 space-y-3">
            {sidejobs.length ? sidejobs.map((sidejob) => (
              <SidejobRow key={sidejob.id} sidejob={sidejob} />
            )) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-white/55">
                Keine Nebentätigkeiten im aktuellen Import.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white">Neueste namentliche Abstimmungen</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Die Liste kommt aus dem aktuellen Abgeordnetenwatch-Mandat und ist nach API-Reihenfolge importiert.
          </p>
          <div className="mt-4 space-y-3">
            {votes.length ? votes.map((vote) => (
              <VoteRow key={vote.id} vote={vote} />
            )) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-white/55">
                Keine Abstimmungen im aktuellen Import.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-white/38">
        Quelle: {profile.sourceLabel}, {profile.license}; aktualisiert am {profile.updatedAt}.
      </p>
    </div>
  );
}

export function MdbProfilePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const { data: speaker, isLoading, error } = useSpeakerData(slug);
  const { data: speechesData } = useSpeechesDb({ enabled: !!speaker });

  const partyColor = speaker ? getPartyColor(speaker.party) : '#db2777';
  const partyTextColor = speaker ? getPartyTextColor(speaker.party) : '#db2777';

  const speakerSpeeches = useMemo(() => {
    if (!speaker || !speechesData?.speeches) return [];
    return speechesForSpeaker(speechesData.speeches, speaker)
      .map((speech, index) => ({ ...speech, id: speech.id ?? index }))
      .sort((a, b) => b.id - a.id);
  }, [speaker, speechesData]);

  const recentSpeeches = speakerSpeeches.slice(0, 8);
  const displayName = speaker ? displaySpeakerName(speaker) : '';
  const signatureWords = speaker ? signatureWordsForDisplay(speaker).slice(0, 6) : [];
  const signatureAdjectives = speaker ? signatureAdjectivesForDisplay(speaker).slice(0, 5) : [];
  const topTopics = speaker?.topics?.topTopics.slice(0, 5) ?? [];
  const topTopic = topTopics[0];
  const topTopicName = topTopic ? TOPIC_BY_ID[topTopic.topic]?.name ?? topTopic.topic : undefined;
  const topTopicWords = speaker && topTopic
    ? speaker.topics?.topicWords[topTopic.topic]?.slice(0, 3).map((word) => word.word) ?? []
    : [];
  const spiritAnimal = speaker?.spiritAnimal ?? null;
  const officialImage = speaker?.officialImage ?? null;
  const profileImage = speaker?.profileImage ?? speaker?.officialImage ?? null;
  const profileDescription = speaker?.profileDescription ?? null;
  const biography = speaker?.biography ?? null;
  const abgeordnetenwatch = speaker?.abgeordnetenwatch ?? null;
  const wikipediaTitle = wikipediaTitleFromDescription(profileDescription);
  const {
    data: wikipediaIntro,
    isLoading: isWikimediaSummaryLoading,
  } = useQuery({
    queryKey: ['wikimedia-intro', wikipediaTitle],
    queryFn: () => fetchWikimediaIntro(wikipediaTitle ?? ''),
    enabled: !!wikipediaTitle,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const searchUrl = speaker
    ? `/suche?tab=speeches&q=${encodeURIComponent(`"${displayName}"`)}`
    : '/suche?tab=speeches';
  const profileHighlights = speaker
    ? buildProfileHighlights({
        speaker,
        topTopicName,
        topTopicWords,
        signatureWords,
        signatureAdjectives,
        spiritAnimal,
        abgeordnetenwatch,
      })
    : [];
  const overviewLead = speaker
    ? buildOverviewLead({
        speaker,
        topTopicName,
        signatureWord: signatureWords[0]?.word,
      })
    : '';
  const liveSummary = speaker
    ? buildMdbLiveSummary({
        speaker,
        displayName,
        topTopicName,
        signatureWord: signatureWords[0],
        spiritAnimal,
        abgeordnetenwatch,
        wikipediaIntro,
        fallbackDescription: profileDescription,
      })
    : '';
  const liveSummarySourceUrl = wikipediaIntro?.sourceUrl ?? profileDescription?.sourceUrl ?? null;
  const liveSummarySourceLabel = wikipediaIntro
    ? 'Wikimedia live'
    : profileDescription
      ? `${profileDescription.sourceLabel}${profileDescription.license ? `, ${profileDescription.license}` : ''}`
      : 'Wrapped-Daten';
  const liveSummarySourceNote = isWikimediaSummaryLoading
    ? 'Live-Kurzprofil: Wikimedia lädt, Fallback aus Profil- und Wrapped-Daten'
    : `Live-Kurzprofil: ${liveSummarySourceLabel}, Wrapped-Daten`;

  if (isLoading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center pt-14">
        <p className="text-white/60">Lade Profil...</p>
      </div>
    );
  }

  if (error || !speaker) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center pt-14">
        <div className="text-center">
          <p className="text-red-400">Abgeordnetenprofil nicht gefunden</p>
          <p className="mt-2 text-sm text-white/40">{error?.message}</p>
          <Link to="/abgeordnete" className="mt-6 inline-flex text-pink-300 hover:text-pink-200">
            Zur Suche
          </Link>
        </div>
      </div>
    );
  }

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    jobTitle: 'Mitglied des Bundestages',
    affiliation: {
      '@type': 'Organization',
      name: speaker.party,
    },
    memberOf: {
      '@type': 'Organization',
      name: 'Deutscher Bundestag',
      url: 'https://www.bundestag.de',
    },
    ...(profileImage ? { image: profileImage.url } : {}),
    ...(profileDescription ? { description: profileDescription.text } : {}),
    url: `${SITE_CONFIG.siteUrl}/abgeordnete/${speaker.slug}`,
  };

  return (
    <>
      <SEO
        title={`${displayName} (${speaker.party})`}
        description={`${displayName}: Profil mit Reden, Themen, Sprache und Tonalität aus Bundestag Wrapped.`}
        canonicalUrl={`/abgeordnete/${speaker.slug}`}
        ogType="profile"
        structuredData={personSchema}
      />

      <div className="min-h-screen page-bg pt-14">
        <main className="px-4 py-8">
          <section className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-lg border border-white/10 bg-[#0a0a12] shadow-2xl shadow-black/40">
            <div
              className="border-b-[3px] border-pink-600"
              style={{
                background: `radial-gradient(1000px 420px at 82% -10%, ${partyColor}42, transparent 62%), #0a0a12`,
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-11">
                <Link to="/abgeordnete" className="text-sm text-white/55 hover:text-white">
                  ← Alle Abgeordneten
                </Link>
                <div className="flex gap-2">
                  <Link
                    to={searchUrl}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    Reden durchsuchen
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigator.share?.({ title: displayName, url: window.location.href })}
                    className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500"
                  >
                    Teilen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[150px_1fr] gap-5 px-5 pb-10 pt-3 md:grid-cols-[210px_1fr] md:px-11 lg:grid-cols-[210px_1fr_150px] lg:gap-10 lg:items-start">
                <div>{profileImage ? <ProfilePortrait image={profileImage} name={displayName} /> : null}</div>
                <div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PartyBadge party={speaker.party} variant="filled" />
                      {biography?.constituency ? (
                        <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/60">
                          {biography.constituency}
                        </span>
                      ) : null}
                    </div>
                    <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.02] text-white md:text-[68px]">
                      {displayName}
                    </h1>
                    <div className="mt-3 text-sm text-white/60 md:text-[15px]">
                      {[
                        biography?.constituency ? `Wahlkreis ${biography.constituency}` : null,
                        biography?.profession,
                        biography?.birthDate && biography?.birthPlace
                          ? `geb. ${biography.birthDate} in ${biography.birthPlace}`
                          : biography?.birthDate ? `geb. ${biography.birthDate}` : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <p className="mt-5 max-w-[600px] text-sm leading-7 text-white/85 md:text-[17px] md:leading-[1.7]">{liveSummary}</p>
                  {liveSummarySourceUrl ? (
                    <a
                      href={liveSummarySourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/42 hover:text-pink-200"
                    >
                      {liveSummarySourceNote}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-white/38">{liveSummarySourceNote}</p>
                  )}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hidden justify-self-start lg:block lg:justify-self-end"
                >
                  {spiritAnimal ? (
                    <SpiritAnimalSpotlight animal={spiritAnimal} partyColor={partyColor} />
                  ) : (
                    <div className="h-[120px] w-[120px] rounded-full border-[3px] border-pink-600/55 bg-white/[0.04]" />
                  )}
                </motion.div>
              </div>
            </div>

            <div className="grid border-b border-white/10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-white/10 px-5 py-6 md:px-11 lg:border-r">
                <div className="text-4xl font-black text-white">{formatNumber(speaker.totalWords)}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-white/50">
                  Wörter gesprochen
                  {speaker.rankings.wordsRank <= 10 ? (
                    <span className="font-bold text-pink-500"> · #{speaker.rankings.wordsRank}</span>
                  ) : null}
                </div>
              </div>
              <div className="border-white/10 px-5 py-6 md:px-8 lg:border-r">
                <div className="text-4xl font-black text-white">{formatNumber(speaker.wortbeitraege)}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-white/50">
                  Wortbeiträge
                  {speaker.drama.interruptedRank && speaker.drama.interruptedRank <= 10 ? (
                    <span className="font-bold text-pink-500"> · Drama #{speaker.drama.interruptedRank}</span>
                  ) : null}
                </div>
              </div>
              <div className="border-white/10 px-5 py-6 md:px-8 lg:border-r">
                <div className="text-4xl font-black text-white">
                  {formatNumber(abgeordnetenwatch?.votes?.total ?? abgeordnetenwatch?.votes?.recent.length ?? 0)}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-white/50">Namentliche Votes</div>
              </div>
              <div className="px-5 py-6 md:px-8">
                <div className="text-4xl font-black text-white">{formatNumber(speaker.maxWords)}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-white/50">
                  Wörter, längste Rede
                  {speaker.rankings.longestSpeechRank <= 10 ? (
                    <span className="font-bold text-pink-500"> · #{speaker.rankings.longestSpeechRank}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="sticky top-14 z-20 flex gap-2 overflow-x-auto border-b border-white/10 bg-[#0a0a12] px-5 py-[18px] md:px-11">
              {PROFILE_TABS.map((tab) => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  label={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>

            <div className="px-5 py-9 md:px-11 md:pb-12">
              <div>
                {activeTab === 'overview' && (
                  <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Ranglisten</p>
                      <h2 className="mt-2 text-2xl font-black text-white">Wo dieses Profil herausragt</h2>
                      <div className="mt-5">
                        <OverviewDigest lead={overviewLead} highlights={profileHighlights} />
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Kurzprofil</p>
                        <p className="mt-3 text-sm leading-7 text-white/68">{overviewLead}</p>
                      </div>
                      {biography ? <BiographySummary biography={biography} /> : null}
                      {abgeordnetenwatch ? <TransparencySummary profile={abgeordnetenwatch} /> : null}
                    </div>
                  </div>
                )}

                {activeTab === 'bio' && (
                  <BiographyDetail
                    biography={biography}
                    description={profileDescription}
                    profileImage={speaker.profileImage ?? null}
                    image={officialImage}
                  />
                )}

                {activeTab === 'transparency' && (
                  <TransparencyDetail profile={abgeordnetenwatch} />
                )}

                {activeTab === 'topics' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Themen</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Politische Schwerpunkte</h2>
                    {topTopics.length > 0 ? (
                      <div className="mt-6 space-y-4">
                        {topTopics.map((topic) => {
                          const meta = TOPIC_BY_ID[topic.topic];
                          const max = topTopics[0]?.score || 1;
                          return (
                            <div key={topic.topic} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="font-semibold text-white">{meta?.name ?? topic.topic}</p>
                                  <p className="text-sm text-white/45">
                                    Rang {topic.rank} im persönlichen Themenprofil
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-white/70">{topic.score.toFixed(2)}</p>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.max(6, (topic.score / max) * 100)}%`,
                                    backgroundColor: meta?.color ?? partyTextColor,
                                  }}
                                />
                              </div>
                              {speaker.topics?.topicWords[topic.topic]?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {speaker.topics.topicWords[topic.topic].map((word) => (
                                    <span
                                      key={word.word}
                                      className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/65"
                                    >
                                      {word.word} {word.count}x
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-6 text-white/55">Für dieses Profil liegen noch keine Themenwerte vor.</p>
                    )}
                  </div>
                )}

                {activeTab === 'language' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Sprache</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Wörter, die hängen bleiben</h2>
                    <div className="mt-6 grid gap-5 lg:grid-cols-3">
                      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                        <div className="flex items-center gap-2 text-white">
                          <MessageSquare size={18} />
                          <h3 className="font-bold">Häufigste Wörter</h3>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {speaker.words.topWords.slice(0, 10).map((word) => (
                            <span
                              key={word.word}
                              className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/75"
                            >
                              {word.word} <span className="text-white/40">{word.count}x</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                        <div className="flex items-center gap-2 text-white">
                          <Sparkles size={18} />
                          <h3 className="font-bold">Signature Words</h3>
                        </div>
                        <div className="mt-4 space-y-2">
                          {signatureWords.map((word) => (
                            <div key={word.word} className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-white/75">{word.word}</span>
                              <span className="font-semibold text-pink-300">{formatRatio(word.ratio ?? 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                        <div className="flex items-center gap-2 text-white">
                          <BookOpen size={18} />
                          <h3 className="font-bold">Adjektive</h3>
                        </div>
                        <div className="mt-4 space-y-2">
                          {signatureAdjectives.length > 0 ? signatureAdjectives.map((word) => (
                            <div key={word.word} className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-white/75">{word.word}</span>
                              <span className="font-semibold text-pink-300">{formatRatio(word.ratio ?? 0)}</span>
                            </div>
                          )) : (
                            <p className="text-sm text-white/45">Noch keine belastbaren Adjektiv-Signaturen.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tone' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Tonalität</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Kommunikationsstil</h2>
                    {speaker.toneProfile ? (
                      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {([
                          ['Lösungsfokus', speaker.toneProfile.scores.solution_focus, BarChart3],
                          ['Zusammenarbeit', speaker.toneProfile.scores.collaboration, Trophy],
                          ['Autorität', speaker.toneProfile.scores.authority, ExternalLink],
                          ['Inklusivität', speaker.toneProfile.scores.inclusivity, MessageSquare],
                        ] satisfies ToneCard[]).map(([label, value, Icon]) => (
                          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white/75">{label}</p>
                              <Icon size={18} className="text-white/35" />
                            </div>
                            <p className="mt-3 text-3xl font-black text-white">{Math.round(value)}</p>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${value}%`, backgroundColor: partyTextColor }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-6 text-white/55">Für dieses Profil liegt noch kein Tonalitätsprofil vor.</p>
                    )}
                  </div>
                )}

                {activeTab === 'speeches' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">Reden</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Reden & Beiträge</h2>
                    <div className="mt-6 mb-5 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/80">
                      Die vorhandenen statischen Rededaten enthalten aktuell keine verlässlichen Datumsfelder.
                      Diese Liste nutzt deshalb die Exportreihenfolge. Für echte neueste Reden sollte der Export
                      um Datum, Protokoll-ID und Tagesordnungspunkt erweitert werden.
                    </div>

                    {recentSpeeches.length > 0 ? (
                      <div className="space-y-3">
                        {recentSpeeches.map((speech) => (
                          <SpeechRow key={speech.id} speech={speech} />
                        ))}
                        <Link
                          to={searchUrl}
                          className="inline-flex items-center gap-2 pt-3 text-sm font-semibold text-pink-300 hover:text-pink-200"
                        >
                          Alle Treffer in der Suche öffnen <ExternalLink size={16} />
                        </Link>
                      </div>
                    ) : (
                      <p className="text-white/55">Keine Reden in der statischen Suchdatenbank gefunden.</p>
                    )}
                  </div>
                )}

                {activeTab === 'votes' && (
                  <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
                            Namentliche Abstimmungen
                          </p>
                          <h2 className="mt-2 text-2xl font-black text-white">Abstimmungsverhalten</h2>
                        </div>
                        <span className="text-sm text-white/50">
                          {formatNumber(abgeordnetenwatch?.votes?.total ?? abgeordnetenwatch?.votes?.recent.length ?? 0)} Votes
                        </span>
                      </div>
                      <div className="mt-6 space-y-3">
                        {abgeordnetenwatch?.votes?.recent.length ? (
                          abgeordnetenwatch.votes.recent.map((vote) => (
                            <VoteRow key={vote.id} vote={vote} />
                          ))
                        ) : (
                          <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-white/55">
                            Keine namentlichen Abstimmungen im aktuellen Import.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Quelle</p>
                        <p className="mt-3 text-sm leading-7 text-white/68">
                          Die Abstimmungsdaten kommen aus dem verknüpften Abgeordnetenwatch-Mandat und werden
                          hier als neueste verfügbare API-Auszüge gezeigt.
                        </p>
                        {abgeordnetenwatch?.sourceUrl ? (
                          <a
                            href={abgeordnetenwatch.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-pink-300 hover:text-pink-200"
                          >
                            Abgeordnetenwatch öffnen <ExternalLink size={13} />
                          </a>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Kennzahlen</p>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <StatTile
                            label="Votes"
                            value={formatNumber(abgeordnetenwatch?.votes?.total ?? abgeordnetenwatch?.votes?.recent.length ?? 0)}
                          />
                          <StatTile label="Fraktion" value={abgeordnetenwatch?.mandate?.fraction ?? speaker.party} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

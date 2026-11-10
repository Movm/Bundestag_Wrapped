import { motion } from 'motion/react';
import type { RankMovement, SignatureWordMovement, YearOverYearAnalysis } from '@/generated/wrapped-contract-v1';
import { getPartyTextColor, getPartyTone } from '@/lib/party-colors';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import type { TopicRiserContext } from '@/domain/topic-riser-context';
import { SlideContainer, SlideHeader, ScrollHint, itemVariants } from '../shared';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Lead, Mark, Note } from '@/design-system/components/Type';
import { Block, ChipCloud, DivergingBars, RankCard } from '@/design-system/components/Data';

type RankingKind = 'topics' | 'words';

const number = new Intl.NumberFormat('de-DE');

function signed(value: number): string {
  if (value > 0) return `+${number.format(value)}`;
  if (value === 0) return '±0';
  return number.format(value);
}

const RANK_TONES = ['white', 'violet', 'pink', 'card'] as const;

function movementName(kind: RankingKind, label: string): string {
  return kind === 'topics' ? topicName(label) : label;
}

/** "Diese Themen sind aufgestiegen": stair-stepped rank cards, biggest riser first. */
export function RankingMovementSlide({ analysis, kind }: { analysis: YearOverYearAnalysis; kind: RankingKind }) {
  const items = analysis[kind]
    .filter(item => item.previousRank !== null && item.rankChange > 0)
    .slice(0, 4);
  const isTopics = kind === 'topics';
  const year = editionSurface(useOptionalEdition()).year;
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Gezeigt werden Einträge, die in beiden Jahren vorkommen und Rangplätze gewonnen haben.</Note>}
    >
      <div className="flex flex-col items-start gap-4">
        <Enter className="flex flex-wrap items-center gap-3">
          <Eyebrow>{analysis.baseline.editionId}{year ? ` → ${year}` : ''}</Eyebrow>
          <span className="ds-eyebrow">Rangveränderung</span>
        </Enter>
        <Display size="xl" face="wide">
          Diese {isTopics ? 'Themen' : 'Wörter'} sind <Mark>aufgestiegen.</Mark>
        </Display>
      </div>
      <ol className="flex flex-col items-start gap-3" aria-label={isTopics ? 'Aufgestiegene Themen' : 'Aufgestiegene Wörter'}>
        {items.map((item, index) => (
          <li key={item.label}>
            <RankCard
              rank={item.currentRank ?? index + 1}
              label={movementName(kind, item.label)}
              detail={`Platz ${item.previousRank} → ${item.currentRank}`}
              change={item.rankChange}
              tone={RANK_TONES[index % RANK_TONES.length]}
              step={index}
            />
          </li>
        ))}
      </ol>
    </Slide>
  );
}

function signatureMovementLabel(item: SignatureWordMovement): string {
  if (item.previousRank === null) return 'NEU';
  if (item.currentRank === null) return 'RAUS';
  return `${item.previousRank} → ${item.currentRank}`;
}

export function SignatureWordMovementSlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const parties = analysis.signatureWords.filter(item => item.risers.length > 0 || item.fallers.length > 0);
  return (
    <SlideContainer innerClassName="mx-auto max-w-3xl" className="py-6 sm:py-8">
      <SlideHeader
        emoji="↕️"
        title="Signature Words im Wandel"
        subtitle={`Auf- und Absteiger gegenüber ${analysis.baseline.editionId}`}
        className="mb-3 sm:mb-5"
        slideId="reveal-signature-movements"
      />
      <motion.div variants={itemVariants} className="grid gap-2 sm:gap-2.5">
        {parties.map(party => (
          <motion.div
            key={party.party}
            variants={itemVariants}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="border-b border-white/10 px-3 py-1.5 text-xs font-black sm:text-sm" style={{ color: getPartyTextColor(party.party) }}>
              {party.party}
            </div>
            <div className="grid grid-cols-2">
              <div className="px-2.5 py-1.5 sm:py-2">
                <div className="mb-0.5 text-[10px] font-black uppercase tracking-wider text-green-300">↑ Aufsteiger</div>
                <div className="space-y-0.5">
                  {party.risers.slice(0, 2).map(item => (
                    <div key={item.word} className="flex min-w-0 items-center justify-between gap-1 text-[11px] sm:text-sm">
                      <span className="truncate font-bold text-white">{item.word}</span>
                      <span className="shrink-0 text-[9px] font-black text-green-300 sm:text-[10px]">{signatureMovementLabel(item)}</span>
                    </div>
                  ))}
                  {party.risers.length === 0 && <span className="text-xs text-white/30">–</span>}
                </div>
              </div>
              <div className="border-l border-white/10 px-2.5 py-1.5 sm:py-2">
                <div className="mb-0.5 text-[10px] font-black uppercase tracking-wider text-rose-300">↓ Absteiger</div>
                <div className="space-y-0.5">
                  {party.fallers.slice(0, 2).map(item => (
                    <div key={item.word} className="flex min-w-0 items-center justify-between gap-1 text-[11px] sm:text-sm">
                      <span className="truncate font-bold text-white">{item.word}</span>
                      <span className="shrink-0 text-[9px] font-black text-rose-300 sm:text-[10px]">{signatureMovementLabel(item)}</span>
                    </div>
                  ))}
                  {party.fallers.length === 0 && <span className="text-xs text-white/30">–</span>}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-3 text-center text-[11px] text-white/40 sm:mt-4 sm:text-xs">
        „Neu“ und „raus“ beziehen sich auf die fünf stärksten Signature Words jeder Fraktion.
      </p>
      <ScrollHint delay={1.3} />
    </SlideContainer>
  );
}

export function YouthLanguageResultSlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const youth = analysis.youthLanguage;
  const words = youth.words.filter(item => item.count > 0);
  const currentWinner = youth.words.find(item => item.word === 'ragebait');
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Kontextgeprüft · Veränderung gegenüber {analysis.baseline.editionId}</Note>}
    >
      <div className="flex flex-col items-start gap-3">
        <Display size="xl" face="wide">Die häufigsten <Mark>Jugendwörter.</Mark></Display>
        <Lead>
          {currentWinner && words[0]
            ? `Ragebait: ${number.format(currentWinner.count)} Treffer · Bundestag-Spitze: ${words[0].word}`
            : `Kontextgeprüfte Treffer · Vergleich mit ${analysis.baseline.editionId}`}
        </Lead>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Häufigste Jugendwörter">
        {words.slice(0, 5).map((item, index) => (
          <li key={item.word}>
            <RankCard
              rank={index + 1}
              label={item.word}
              detail={`${number.format(item.count)}× · ${signed(item.change)} zum Vorjahr`}
              tone={RANK_TONES[index % RANK_TONES.length]}
              step={index}
            />
          </li>
        ))}
      </ol>
    </Slide>
  );
}

export function YouthLanguagePartySlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const youth = analysis.youthLanguage;
  const parties = youth.byParty.filter(item => item.party !== 'fraktionslos').slice(0, 5);
  const additionalWords = youth.words.filter(item => item.count > 0).slice(5, 8);
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Mehrdeutige Wörter zählen nur, wenn ihre Verwendung zur Jugendwort-Bedeutung passt.</Note>}
    >
      <div className="flex flex-col items-start gap-3">
        <Display size="xl" face="wide">Wer nutzt <Mark>Jugendwörter?</Mark></Display>
        <Lead>Treffer nach Fraktion.</Lead>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Jugendwort-Treffer nach Fraktion">
        {parties.map((item, index) => (
          <li key={item.party}>
            <RankCard
              rank={index + 1}
              label={item.party}
              detail={<span style={{ color: getPartyTone(item.party, 'light') }}>{number.format(item.count)}× Treffer</span>}
              tone="white"
              step={index}
            />
          </li>
        ))}
      </ol>
      {additionalWords.length > 0 && (
        <Enter className="flex flex-col items-start gap-3">
          <p className="m-0 text-base font-semibold">Weitere Treffer:</p>
          <ChipCloud words={additionalWords.map(item => `${item.word} ${number.format(item.count)}×`)} label="Weitere Jugendwörter" />
        </Enter>
      )}
    </Slide>
  );
}

export function YouthLanguageSpeakerSlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const speakers = analysis.youthLanguage.bySpeaker.slice(0, 5);
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Kontextgeprüfte Treffer – Zitate bleiben als tatsächliche Verwendung sichtbar.</Note>}
    >
      <div className="flex flex-col items-start gap-3">
        <Display size="xl" face="wide">Top-<Mark>Abgeordnete.</Mark></Display>
        <Lead>Die meisten Treffer in ihren Redebeiträgen.</Lead>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Abgeordnete mit den meisten Jugendwort-Treffern">
        {speakers.map((item, index) => (
          <li key={`${item.name}-${item.party}`}>
            <RankCard
              rank={index + 1}
              label={item.name}
              detail={<><span style={{ color: getPartyTone(item.party, 'light') }}>{item.party}</span> · {number.format(item.count)}× Treffer</>}
              tone="white"
              step={index}
            />
          </li>
        ))}
      </ol>
    </Slide>
  );
}

function topicName(id: string): string {
  return TOPIC_BY_ID[id]?.name ?? id;
}

function RankSwap({ item, tone }: { item: RankMovement; tone: 'up' | 'down' }) {
  const up = tone === 'up';
  return (
    <Block tone={up ? 'pink' : 'card'} className={up ? 'ds-swap' : 'ds-swap ds-swap--down'}>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="ds-eyebrow text-on-accent"><span aria-hidden="true">{up ? '▲' : '▼'} </span>{up ? 'Aufgestiegen' : 'Abgestiegen'}</span>
        <span className="ds-swap__name">{topicName(item.label)}</span>
      </div>
      <span className="ds-swap__ranks">
        <span aria-hidden="true">{item.previousRank} → {item.currentRank}</span>
        <span className="sr-only">von Platz {item.previousRank} auf Platz {item.currentRank}</span>
      </span>
    </Block>
  );
}

/** "Warum Wirtschaft?": rank swap, party emphasis around the average, new signature words. */
export function TopicRiserContextSlide({ context, baselineYear }: { context: TopicRiserContext; baselineYear: string }) {
  const { riser, faller, parties, leader } = context;
  const name = topicName(riser.label);
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Themenanteil am Redeinhalt im Vergleich zum Bundestagsschnitt · gleicher Kalenderzeitraum wie im Vorjahr</Note>}
    >
      <div className="flex flex-col items-start gap-3">
        <Display size="xl">Warum <Mark>{name}?</Mark></Display>
        <Lead>Was hinter dem Aufstieg gegenüber {baselineYear} steckt.</Lead>
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
        <RankSwap item={riser} tone="up" />
        {faller && <RankSwap item={faller} tone="down" />}
      </div>
      {parties.length > 0 && (
        <DivergingBars
          title={`Wer spricht am meisten über ${name}?`}
          caption={`Anteil des Themas ${name} je Fraktion im Vergleich zum Bundestagsschnitt`}
          rows={parties.map(item => ({ label: item.party, party: item.party, ratio: item.vsAverage }))}
        />
      )}
      {leader && (
        <Enter className="flex flex-col items-start gap-3">
          <p className="m-0 text-base font-semibold">Neu in den Top-Signature-Words der <strong>{leader.party}</strong>:</p>
          <ChipCloud words={leader.newSignatureWords} label={`Neue Signature-Words der ${leader.party}`} />
        </Enter>
      )}
    </Slide>
  );
}

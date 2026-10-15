import { motion } from 'motion/react';
import type { RankMovement, SignatureWordMovement, YearOverYearAnalysis } from '@/generated/wrapped-contract-v1';
import { getPartyTextColor } from '@/lib/party-colors';
import { SlideContainer, SlideHeader, ScrollHint, itemVariants } from '../shared';

type RankingKind = 'topics' | 'words';

const number = new Intl.NumberFormat('de-DE');

function signed(value: number): string {
  if (value > 0) return `+${number.format(value)}`;
  if (value === 0) return '±0';
  return number.format(value);
}

function MovementRow({ item, index }: { item: RankMovement; index: number }) {
  const isNew = item.previousRank === null;
  const movementLabel = signed(item.rankChange);
  return (
    <motion.li
      variants={itemVariants}
      className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left"
    >
      <span className="text-center text-lg font-black text-white/35">{index + 1}</span>
      <div className="min-w-0">
        <div className="truncate text-lg font-bold text-white md:text-xl">{item.label}</div>
        <div className="text-sm text-white/50">
          {isNew ? `Neu auf Platz ${item.currentRank}` : `Platz ${item.previousRank} → ${item.currentRank}`}
        </div>
      </div>
      <span className={`rounded-full px-3 py-1 text-sm font-black ${isNew ? 'bg-blue-400/15 text-blue-300' : 'bg-green-400/15 text-green-300'}`}>
        {isNew ? 'NEU' : movementLabel}
      </span>
    </motion.li>
  );
}

export function RankingMovementSlide({ analysis, kind }: { analysis: YearOverYearAnalysis; kind: RankingKind }) {
  const items = analysis[kind]
    .filter(item => item.previousRank !== null && item.rankChange > 0)
    .slice(0, 6);
  const isTopics = kind === 'topics';
  return (
    <SlideContainer innerClassName="mx-auto max-w-3xl">
      <SlideHeader
        emoji={isTopics ? '📈' : '🔤'}
        title={isTopics ? 'Diese Themen sind aufgestiegen' : 'Diese Wörter sind aufgestiegen'}
        subtitle={`Rangveränderung gegenüber ${analysis.baseline.editionId}`}
        slideId={isTopics ? 'reveal-topic-risers' : 'reveal-word-risers'}
      />
      <motion.ol variants={itemVariants} className="space-y-2">
        {items.map((item, index) => <MovementRow key={item.label} item={item} index={index} />)}
      </motion.ol>
      <p className="mt-6 text-center text-xs text-white/40">
        Gezeigt werden Einträge, die in beiden Jahren vorkommen und Rangplätze gewonnen haben.
      </p>
      <ScrollHint delay={1.4} />
    </SlideContainer>
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
    <SlideContainer innerClassName="mx-auto max-w-2xl" className="py-8">
      <SlideHeader
        emoji="🗣️"
        title="Die häufigsten Jugendwörter"
        subtitle={currentWinner && words[0]
          ? `Ragebait: ${number.format(currentWinner.count)} Treffer · Bundestag-Spitze: ${words[0].word}`
          : `Kontextgeprüfte Treffer · Vergleich mit ${analysis.baseline.editionId}`}
        className="mb-5"
        slideId="reveal-youth-language"
      />
      <motion.ol variants={itemVariants} className="grid gap-2.5">
        {words.slice(0, 5).map((item, index) => (
          <motion.li key={item.word} variants={itemVariants} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
            <span className="w-7 text-center text-lg font-black text-white/35">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-lg font-bold text-white">{item.word}</span>
            <div className="text-right">
              <div className="font-black text-pink-300">{number.format(item.count)}×</div>
              <div className="text-xs text-white/40">{signed(item.change)}</div>
            </div>
          </motion.li>
        ))}
      </motion.ol>
      <p className="mt-4 text-center text-xs text-white/40">Kontextgeprüft · Veränderung gegenüber {analysis.baseline.editionId}</p>
      <ScrollHint delay={1.3} />
    </SlideContainer>
  );
}

export function YouthLanguagePartySlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const youth = analysis.youthLanguage;
  const parties = youth.byParty.filter(item => item.party !== 'fraktionslos').slice(0, 5);
  const additionalWords = youth.words.filter(item => item.count > 0).slice(5, 8);
  return (
    <SlideContainer innerClassName="mx-auto max-w-2xl" className="py-8">
      <SlideHeader
        emoji="🏛️"
        title="Wer nutzt Jugendwörter?"
        subtitle="Treffer nach Fraktion"
        className="mb-5"
        slideId="reveal-youth-parties"
      />
      <motion.ol variants={itemVariants} className="grid grid-cols-2 gap-2.5">
        {parties.map((item, index) => (
          <motion.li
            key={item.party}
            variants={itemVariants}
            className={`rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center ${index === parties.length - 1 && parties.length % 2 === 1 ? 'col-span-2' : ''}`}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-white/45">{index + 1}. {item.party}</div>
            <div className="mt-1 text-xl font-black text-pink-300">{number.format(item.count)}×</div>
          </motion.li>
        ))}
      </motion.ol>
      {additionalWords.length > 0 && (
        <motion.div variants={itemVariants} className="mt-5 text-center">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/40">Weitere Treffer</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {additionalWords.map(item => (
              <span key={item.word} className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/75">
                {item.word} <strong className="text-white">{number.format(item.count)}×</strong>
              </span>
            ))}
          </div>
        </motion.div>
      )}
      <p className="mt-4 text-center text-xs text-white/40">Mehrdeutige Wörter zählen nur, wenn ihre Verwendung zur Jugendwort-Bedeutung passt.</p>
      <ScrollHint delay={1.3} />
    </SlideContainer>
  );
}

export function YouthLanguageSpeakerSlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const speakers = analysis.youthLanguage.bySpeaker.slice(0, 5);
  return (
    <SlideContainer innerClassName="mx-auto max-w-2xl" className="py-8">
      <SlideHeader
        emoji="🎙️"
        title="Top-Abgeordnete"
        subtitle="Die meisten Treffer in ihren Redebeiträgen"
        className="mb-5"
        slideId="reveal-youth-speakers"
      />
      <motion.ol variants={itemVariants} className="grid gap-2.5">
        {speakers.map((item, index) => (
          <motion.li key={`${item.name}-${item.party}`} variants={itemVariants} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
            <span className="w-7 text-center text-lg font-black text-white/35">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold text-white md:text-lg">{item.name}</div>
              <div className="truncate text-xs font-semibold uppercase tracking-wider text-white/40">{item.party}</div>
            </div>
            <div className="text-lg font-black text-pink-300">{number.format(item.count)}×</div>
          </motion.li>
        ))}
      </motion.ol>
      <p className="mt-4 text-center text-xs text-white/40">Kontextgeprüfte Treffer – Zitate bleiben als tatsächliche Verwendung sichtbar.</p>
      <ScrollHint delay={1.3} />
    </SlideContainer>
  );
}

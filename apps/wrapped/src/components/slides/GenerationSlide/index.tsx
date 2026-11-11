import { motion } from 'motion/react';
import type { GenerationComparison } from '@/generated/wrapped-contract-v1';
import { Slide } from '@/design-system/components/Slide';
import { ChipCloud } from '@/design-system/components/Data';
import { PartyBlock, PartyGrid } from '@/design-system/components/PartyBlock';
import { Display, Eyebrow, FitWord, Mark, Note } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';

const number = new Intl.NumberFormat('de-DE');
const COLUMNS = 30;

function displayWord(word: string): string {
  return word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1);
}

/** One dot per MP at the lectern; the Gen Z dots are pink and spread evenly. Decoration only. */
function Dots({ total, highlighted }: { total: number; highlighted: number }) {
  const rows = Math.ceil(total / COLUMNS);
  const step = total / highlighted;
  const pink = new Set(Array.from({ length: highlighted }, (_, index) => Math.floor(step * index + step / 2)));
  return (
    <motion.svg variants={ENTER.slide} viewBox={`0 0 ${COLUMNS * 10} ${rows * 10}`} className="ds-genz-dots" aria-hidden="true" focusable="false">
      {Array.from({ length: total }, (_, index) => (
        <circle
          key={index}
          cx={(index % COLUMNS) * 10 + 5}
          cy={Math.floor(index / COLUMNS) * 10 + 5}
          r={pink.has(index) ? 4.2 : 2.6}
          fill={pink.has(index) ? '#ff4fa0' : '#b98cff'}
          opacity={pink.has(index) ? 1 : 0.35}
        />
      ))}
    </motion.svg>
  );
}

/** Opener: how few MPs at the lectern are Gen Z. */
export function GenerationIntroSlide({ generations }: { generations: GenerationComparison }) {
  return (
    <Slide
      shapes="orbit"
      footer={<Note className="ds-note--plate">Erfasst sind Abgeordnete mit Fraktionszugehörigkeit und bekanntem Geburtsjahr. Regierungsmitglieder sind in diesem Vergleich nicht enthalten.</Note>}
    >
      <Display size="lg">Die nächste Generation steht schon am <Mark>Rednerpult.</Mark></Display>
      <motion.p variants={ENTER.rise} className="ds-statement">
        {number.format(generations.speakerCount)} von {number.format(generations.totalSpeakers)} erfassten Abgeordneten mit Redebeiträgen wurden ab {generations.bornFrom} geboren. Sie zählen in unserer Auswertung zur Gen Z.
      </motion.p>
      <Dots total={generations.totalSpeakers} highlighted={generations.speakerCount} />
      <Note>Ein Punkt, eine Person. Rosa zeigt die Gen Z.</Note>
    </Slide>
  );
}

/** What Gen Z MPs say more often than older MPs of the same parties, and where they sit. */
export function GenerationInfoSlide({ generations, saidNoYouthWord = false }: { generations: GenerationComparison; saidNoYouthWord?: boolean }) {
  const words = generations.words.slice(0, 6).map(item => displayWord(item.word));
  const fewer = generations.fewerWords.slice(0, 3).map(item => displayWord(item.word));
  return (
    <Slide
      shapes={false}
      footer={<Note className="ds-note--plate">Gen Z: geboren ab {generations.bornFrom}. Der Wortvergleich berücksichtigt die unterschiedliche Zusammensetzung der Fraktionen. Geburtsjahre: Bundestag und Abgeordnetenwatch.</Note>}
    >
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>So sprechen die Jüngeren</Eyebrow>
      </motion.div>
      {words.length > 0 && (
        <div className="flex flex-col items-start gap-3">
          <Display size="md">Andere Generation. <Mark>Andere Wörter.</Mark></Display>
          <motion.p variants={ENTER.rise} className="m-0 text-base font-semibold">
            {saidNoYouthWord
              ? 'Jugendwörter? Keins. Dafür diese hier, häufiger als bei älteren Kolleg:innen:'
              : 'Diese Wörter verwenden jüngere Abgeordnete häufiger als ihre älteren Kolleg:innen:'}
          </motion.p>
          <ChipCloud words={words} label="Wörter, die Gen-Z-Abgeordnete öfter sagen" />
          {fewer.length > 0 && <motion.p variants={ENTER.rise} className="m-0 text-base font-semibold">Seltener fallen: {fewer.join(', ')}</motion.p>}
        </div>
      )}
      <motion.p variants={ENTER.rise} className="m-0 text-base font-semibold">Die {number.format(generations.speakerCount)} verteilen sich so:</motion.p>
      <PartyGrid label="Gen-Z-Abgeordnete nach Fraktion">
        {generations.parties.map(item => (
          <PartyBlock key={item.party} party={item.party}>
            <FitWord word={number.format(item.count)} />
          </PartyBlock>
        ))}
      </PartyGrid>
    </Slide>
  );
}

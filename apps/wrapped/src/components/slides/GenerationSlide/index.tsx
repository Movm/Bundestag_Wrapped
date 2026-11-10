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
    <Slide shapes="orbit">
      <Display size="xl"><Mark>Gen Z</Mark> im Bundestag.</Display>
      <motion.p variants={ENTER.rise} className="ds-statement">
        {number.format(generations.speakerCount)} von {number.format(generations.totalSpeakers)} Abgeordneten am Rednerpult sind {generations.bornFrom} oder später geboren.
      </motion.p>
      <Dots total={generations.totalSpeakers} highlighted={generations.speakerCount} />
    </Slide>
  );
}

/** What Gen Z MPs say more often than older MPs of the same parties, and where they sit. */
export function GenerationInfoSlide({ generations }: { generations: GenerationComparison }) {
  const words = generations.words.slice(0, 6).map(item => displayWord(item.word));
  const fewer = generations.fewerWords.slice(0, 3).map(item => displayWord(item.word));
  return (
    <Slide
      shapes={false}
      footer={<Note className="ds-note--plate">Gen Z: geboren ab {generations.bornFrom}, laut Stammdaten des Bundestags. Verglichen mit älteren Abgeordneten derselben Fraktionen.</Note>}
    >
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>So spricht die Gen Z</Eyebrow>
      </motion.div>
      {words.length > 0 && (
        <div className="flex flex-col items-start gap-3">
          <Display size="md">Sagt öfter</Display>
          <ChipCloud words={words} label="Wörter, die Gen-Z-Abgeordnete öfter sagen" />
          {fewer.length > 0 && <motion.p variants={ENTER.rise} className="m-0 text-base font-semibold">Seltener: {fewer.join(', ')}</motion.p>}
        </div>
      )}
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

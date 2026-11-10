import { motion } from 'motion/react';
import type { Mention } from '@/generated/wrapped-contract-v1';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Note } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';

const number = new Intl.NumberFormat('de-DE');

/** Flat humpback whale in the system's colours; decoration only. */
function Whale() {
  return (
    <motion.svg variants={ENTER.slide} viewBox="0 0 240 130" className="ds-mention-whale" aria-hidden="true" focusable="false">
      <path d="M118 22c-4-8-2-16 4-20M126 22c2-9 8-14 15-15M110 24c-7-5-15-5-21-1" fill="none" stroke="#b98cff" strokeWidth="5" strokeLinecap="round" />
      <path d="M14 74C30 36 128 26 182 56c12 7 24 7 36-4l12-12c3 16-3 30-14 37l16 17c-16 0-28-6-36-13-46 26-148 30-182-7Z" fill="#ff4fa0" />
      <path d="M40 88c30 10 80 12 120 2M48 96c28 8 70 9 104 1" fill="none" stroke="#0e0a14" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <path d="M92 86c8 22 28 32 42 30-10-8-20-20-26-32Z" fill="#7b3ff2" />
      <circle cx="46" cy="64" r="4" fill="#0e0a14" />
    </motion.svg>
  );
}

/** Section opener for the moment of the year (e.g. "Timmy der Wal"). */
export function MentionIntroSlide({ mention }: { mention: Mention }) {
  return (
    <Slide shapes="orbit">
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>Nächstes Kapitel</Eyebrow>
      </motion.div>
      <Display size={mention.label.length > 16 ? 'xl' : 'hero'}>{mention.label}</Display>
      <motion.p variants={ENTER.rise} className="ds-statement">
        {number.format(mention.count)}× im Bundestag. Wer sprach über ihn?
      </motion.p>
      <Whale />
    </Slide>
  );
}

/** What happened, as dated stages ("3. März: …"), with the source of the facts. */
export function MentionInfoSlide({ mention }: { mention: Mention }) {
  const stages = (mention.background ?? []).map(line => {
    const split = line.indexOf(': ');
    return split > 0 && split < 20 ? { date: line.slice(0, split), text: line.slice(split + 2) } : { date: '', text: line };
  });
  return (
    <Slide shapes={false} footer={mention.source && <Note className="ds-note--plate">Quelle: {mention.source}</Note>}>
      <Display size="xl">Was geschah?</Display>
      <ol className="ds-timeline" aria-label={`Was mit ${mention.label} geschah`}>
        {stages.map(stage => (
          <motion.li key={stage.text} variants={ENTER.rise} className="ds-timeline__item">
            {stage.date && <span className="ds-eyebrow ds-eyebrow--contrast">{stage.date}</span>}
            <p className="ds-timeline__text">{stage.text}</p>
          </motion.li>
        ))}
      </ol>
    </Slide>
  );
}

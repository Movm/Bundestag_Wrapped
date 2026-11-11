import { motion } from 'motion/react';
import type { Mention } from '@/generated/wrapped-contract-v1';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Note } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';
import { times } from '@/lib/german-count';

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

/** Opener: the edition's headline ("Er hat sich das nicht ausgesucht."), a subtitle and the whale. */
export function MentionIntroSlide({ mention }: { mention: Mention }) {
  return (
    <Slide shapes="orbit">
      <Display size="xl">{mention.headline ?? mention.label}</Display>
      <motion.p variants={ENTER.rise} className="ds-statement">
        {mention.subtitle ? `${mention.subtitle} ` : ''}Sein Name fiel dort {times(mention.count)}.
      </motion.p>
      <Whale />
    </Slide>
  );
}

/**
 * What happened, with the source of the facts. With several background lines
 * the first one is the heading ("Die Rettungsversuche blieben erfolglos."),
 * the rest is the story.
 */
export function MentionInfoSlide({ mention }: { mention: Mention }) {
  const background = mention.background ?? [];
  const [heading, ...story] = background.length > 1 ? background : [null, ...background];
  const sources = mention.source ? `${mention.source.includes(';') ? 'Quellen' : 'Quelle'}: ${mention.source}` : null;
  return (
    <Slide shapes={false} footer={sources && <Note className="ds-note--plate">{sources}</Note>}>
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>Die Geschichte dahinter</Eyebrow>
      </motion.div>
      {heading && <Display size="lg">{heading}</Display>}
      {story.map(line => (
        <motion.p key={line} variants={ENTER.rise} className="ds-statement">{line}</motion.p>
      ))}
    </Slide>
  );
}

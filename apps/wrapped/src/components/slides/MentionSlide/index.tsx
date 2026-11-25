import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import type { Mention } from '@/generated/wrapped-contract-v1';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Note } from '@/design-system/components/Type';
import { RankCard } from '@/design-system/components/Data';
import { ENTER } from '@/design-system/motion';
import { getPartyTone } from '@/lib/party-colors';
import { times } from '@/lib/german-count';

/** Flat humpback whale in the system's colours; decoration only. */
export function Whale() {
  return (
    <motion.svg variants={ENTER.slide} viewBox="0 0 240 130" className="ds-mention-art" aria-hidden="true" focusable="false">
      <path d="M118 22c-4-8-2-16 4-20M126 22c2-9 8-14 15-15M110 24c-7-5-15-5-21-1" fill="none" stroke="#b98cff" strokeWidth="5" strokeLinecap="round" />
      <path d="M14 74C30 36 128 26 182 56c12 7 24 7 36-4l12-12c3 16-3 30-14 37l16 17c-16 0-28-6-36-13-46 26-148 30-182-7Z" fill="#ff4fa0" />
      <path d="M40 88c30 10 80 12 120 2M48 96c28 8 70 9 104 1" fill="none" stroke="#0e0a14" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <path d="M92 86c8 22 28 32 42 30-10-8-20-20-26-32Z" fill="#7b3ff2" />
      <circle cx="46" cy="64" r="4" fill="#0e0a14" />
    </motion.svg>
  );
}

const STAR = 'M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z';

/** Striped sunset, two palms and four of five wanted stars, in the system's colours; decoration only. */
export function PalmSunset() {
  return (
    <motion.svg variants={ENTER.slide} viewBox="0 0 300 190" className="ds-mention-art" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="ds-mention-sun"><circle cx="190" cy="118" r="62" /></clipPath>
      </defs>
      {[96, 124, 152, 180].map(x => <path key={x} d={STAR} transform={`translate(${x} 0)`} fill="#ffffff" />)}
      <path d={STAR} transform="translate(208 0)" fill="none" stroke="#ffffff" strokeWidth="2" />
      <g clipPath="url(#ds-mention-sun)">
        <rect x="120" y="50" width="140" height="140" fill="#ff4fa0" />
        <rect x="120" y="120" width="140" height="7" fill="#3a1670" />
        <rect x="120" y="136" width="140" height="9" fill="#3a1670" />
        <rect x="120" y="153" width="140" height="12" fill="#3a1670" />
        <rect x="120" y="172" width="140" height="18" fill="#3a1670" />
      </g>
      <rect x="0" y="180" width="300" height="10" fill="#0e0a14" />
      <path d="M92 182c4-40 8-74 22-112" fill="none" stroke="#0e0a14" strokeWidth="9" strokeLinecap="round" />
      <g fill="#b98cff">
        <path d="M114 70c-18-18-44-20-64-8 22-2 42 4 64 8Z" />
        <path d="M114 70c-6-24-26-38-50-38 18 8 34 22 50 38Z" />
        <path d="M114 70c8-24 30-36 54-32-20 6-38 18-54 32Z" />
        <path d="M114 70c20-10 46-6 62 10-22-6-42-8-62-10Z" />
        <path d="M114 70c14 14 18 36 10 56-2-20-6-38-10-56Z" />
      </g>
      <path d="M44 182c2-24 6-44 14-64" fill="none" stroke="#0e0a14" strokeWidth="6" strokeLinecap="round" />
      <g fill="#7b3ff2">
        <path d="M58 118c-12-12-30-12-42-4 14 0 28 2 42 4Z" />
        <path d="M58 118c6-16 22-22 38-18-14 4-26 10-38 18Z" />
        <path d="M58 118c-2-16-14-26-30-28 12 8 22 16 30 28Z" />
      </g>
    </motion.svg>
  );
}

interface MentionIntroSlideProps {
  mention: Mention;
  /** Illustration below the text; the whale unless a story brings its own. */
  art?: ReactNode;
  /** Sentence with the count after the subtitle. */
  countSentence?: (count: number) => string;
}

/** Opener: the edition's headline ("Ein Wal schafft es ins Plenum."), a subtitle with the count and an illustration. */
export function MentionIntroSlide({ mention, art = <Whale />, countSentence = count => `Sein Name fiel dort ${times(count)}.` }: MentionIntroSlideProps) {
  return (
    <Slide shapes="orbit">
      <Display size="xl">{mention.headline ?? mention.label}</Display>
      <motion.p variants={ENTER.rise} className="ds-statement">
        {mention.subtitle ? `${mention.subtitle} ` : ''}{countSentence(mention.count)}
      </motion.p>
      {art}
    </Slide>
  );
}

/**
 * Who said it: every MP who mentioned it, most mentions first, each with the
 * first sentence they said it in. At most four, so the slide stays one screen.
 */
export function MentionRevealSlide({ mention, eyebrow, heading }: { mention: Mention; eyebrow: string; heading: ReactNode }) {
  return (
    <Slide shapes="corner">
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>{eyebrow}</Eyebrow>
      </motion.div>
      <Display size="xl" face="wide">{heading}</Display>
      <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label={`Wer ${mention.label} im Plenum erwähnte`}>
        {mention.speakers.slice(0, 4).map((speaker, index) => (
          <li key={`${speaker.name}-${speaker.party}`} className="ds-mention-speaker">
            <RankCard
              rank={index + 1}
              label={speaker.name}
              detail={<><span style={{ color: getPartyTone(speaker.party, 'light') }}>{speaker.party}</span> · {speaker.count}× „{mention.label}“</>}
              tone="white"
              step={index}
            />
            <motion.p variants={ENTER.rise} className="ds-mention-quote">„{speaker.quote}“</motion.p>
          </li>
        ))}
      </ol>
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

import { memo } from 'react';
import { motion } from 'motion/react';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';

interface SlideInfoProps {
  /** Kept for the data shape; the design system uses no emoji headers. */
  emoji?: string;
  title: string;
  body: string;
  /** Label above the title; `null` shows none. */
  eyebrow?: string | null;
  highlight?: string;
  slideId?: string;
}

function withHighlight(body: string, highlight?: string) {
  const at = highlight ? body.indexOf(highlight) : -1;
  if (!highlight || at < 0) return body;
  return <>{body.slice(0, at)}<Mark block>{highlight}</Mark>{body.slice(at + highlight.length)}</>;
}

/** Info slide (pink surface): stamped label, huge title, one or two big sentences. */
export const SlideInfo = memo(function SlideInfo({ title, body, eyebrow = 'Kurz erklärt', highlight }: SlideInfoProps) {
  return (
    <Slide shapes="ring">
      {eyebrow !== null && (
        <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
          <Eyebrow>{eyebrow}</Eyebrow>
        </motion.div>
      )}
      <Display size={title.length > 18 ? 'lg' : 'hero'}>{title}</Display>
      <motion.p variants={ENTER.rise} className={body.length > 160 ? 'ds-statement ds-statement--long' : 'ds-statement'}>{withHighlight(body, highlight)}</motion.p>
    </Slide>
  );
});

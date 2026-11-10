import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow } from '@/design-system/components/Type';
import { motion } from 'motion/react';
import { ENTER } from '@/design-system/motion';

interface SlideIntroProps {
  /** Kept for the data shape; the design system uses no emoji headers. */
  emoji?: string;
  title?: string;
  subtitle?: string;
  /** Kept for callers; decoration now comes from the surface shapes. */
  showAccents?: boolean;
  slideId?: string;
}

/** Section opener (deep surface): label, huge title, one teaser line. */
export function SlideIntro({ title, subtitle }: SlideIntroProps) {
  const heading = title ?? subtitle ?? '';
  const teaser = title ? subtitle : undefined;
  return (
    <Slide shapes="orbit">
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>Nächstes Kapitel</Eyebrow>
      </motion.div>
      <Display size={heading.length > 22 ? 'xl' : 'hero'}>{heading}</Display>
      {teaser && <motion.p variants={ENTER.rise} className="ds-statement">{teaser}</motion.p>}
    </Slide>
  );
}

import { motion } from 'motion/react';
import { Slide } from '@/design-system/components/Slide';
import { Display, Mark } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';

/** Opens the youth-word chapter, before the question who said it. */
export function YouthIntroSlide() {
  return (
    <Slide shapes="orbit">
      <motion.p variants={ENTER.rise} className="ds-statement">
        Jedes Jahr liest Susanne Dauber die Kandidaten zum Jugendwort des Jahres vor.
      </motion.p>
      <Display size="xl">Aber wer hat es im <Mark>Bundestag</Mark> verwendet?</Display>
    </Slide>
  );
}

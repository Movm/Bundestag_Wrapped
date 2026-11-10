import { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { useSlideEffectsActive } from '@/components/main-wrapped/SlideEffectsContext';
import { playSound } from '@/lib/sounds';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import { previewCoverageLabel } from '@/edition/labels';
import { Slide } from '@/design-system/components/Slide';
import { Eyebrow, Lead } from '@/design-system/components/Type';
import { ActionButton } from '@/design-system/components/ActionButton';
import { ENTER } from '@/design-system/motion';

interface IntroSlideProps {
  onStart?: () => void;
}

/** Cover: eagle, huge two-line wordmark with a tilted year pill, start button. */
export const IntroSlide = memo(function IntroSlide({ onStart }: IntroSlideProps) {
  const edition = useOptionalEdition();
  const surface = editionSurface(edition);
  const previewLabel = previewCoverageLabel(edition?.manifest);
  const active = useSlideEffectsActive();

  const handleStart = useCallback(() => {
    if (!active) return;
    playSound('start');
    onStart?.();
  }, [onStart, active]);

  return (
    <Slide shapes="cover">
      {previewLabel && <motion.div variants={ENTER.rise}><Eyebrow>{previewLabel}</Eyebrow></motion.div>}
      <motion.img src="/logo.png" alt="" className="ds-cover__logo" variants={ENTER.stamp} />
      <h1 className="ds-display ds-display--hero ds-cover__title">
        <motion.span className="block text-wr-pink" variants={ENTER.rise}>Bundestag</motion.span>
        <motion.span className="ds-cover__line" variants={ENTER.rise}>
          <span>Wrapped</span>
          {surface.year && <span className="ds-cover__year">{surface.year}</span>}
        </motion.span>
      </h1>
      <motion.div className="ds-cover__start" variants={ENTER.rise}>
        <ActionButton size="lg" icon="right" onClick={handleStart}>Starten</ActionButton>
        <Lead className="max-w-[22rem]">Dein Jahr im Parlament – Themen, Reden, Aufsteiger.</Lead>
      </motion.div>
    </Slide>
  );
});

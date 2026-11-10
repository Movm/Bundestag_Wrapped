import { motion } from 'motion/react';
import { ENTER, IN_VIEW, STAGGER } from '../motion';
import type { SlideRole } from '../surfaces';

/**
 * Flat geometric decoration. Purely visual (aria-hidden), painted once, never
 * animated after the entrance. Shapes sit at the edges so text stays on the
 * plain surface colour; their colours come from the surface (`shape-a/b`).
 */
export const SHAPE_PRESETS = ['cover', 'orbit', 'band', 'ring', 'corner', 'none'] as const;
export type ShapePreset = (typeof SHAPE_PRESETS)[number];

export const ROLE_SHAPES: Record<SlideRole, ShapePreset> = {
  cover: 'cover',
  section: 'orbit',
  quiz: 'band',
  info: 'ring',
  reveal: 'corner',
  share: 'ring',
  finale: 'cover',
};

export function Shapes({ preset }: { preset: ShapePreset }) {
  if (preset === 'none') return null;
  return (
    <motion.div aria-hidden="true" className={`ds-shapes ds-shapes--${preset}`} variants={STAGGER} initial="hidden" whileInView="visible" viewport={IN_VIEW}>
      <motion.span className="ds-shape ds-shape--a" variants={ENTER.pop} />
      <motion.span className="ds-shape ds-shape--b" variants={preset === 'band' || preset === 'cover' ? ENTER.grow : ENTER.pop} />
      {preset === 'cover' && <motion.span className="ds-shape ds-shape--c" variants={ENTER.pop} />}
    </motion.div>
  );
}

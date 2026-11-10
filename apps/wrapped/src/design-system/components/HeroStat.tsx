import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import { ENTER } from '../motion';
import { BigNumber } from './Type';
import '../css/hero-stat.css';

/** A single huge number plus its label. The number is large text, so the display accent is allowed. */
export function HeroStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <motion.div className="ds-hero-stat" variants={ENTER.stamp}>
      <BigNumber className="ds-hero-stat__value">{value}</BigNumber>
      <p className="ds-hero-stat__label">{label}</p>
    </motion.div>
  );
}

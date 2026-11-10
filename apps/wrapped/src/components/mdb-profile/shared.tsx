import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { factionFactor, formatRatio, type MdbQuizWord } from '@/lib/mdb-quiz';
import './mdb-profile.css';

export function PartyPill({ party, className }: { party: string; className?: string }) {
  return <span className={`mp-pill mp-pill--party ${className ?? ''}`}>{party}</span>;
}

/** A bar that grows from the left once it scrolls into view. */
export function GrowBar({ width, className, style }: { width: number; className: string; style?: CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={className}
      style={{ ...style, width: `${Math.max(3, Math.min(100, width))}%` }}
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1, ease: [0.2, 0.9, 0.2, 1] }}
    />
  );
}

/** MP vs. own faction vs. Bundestag for one word; the Bundestag average is 1×. */
export function RatioBars({ word, name, party }: { word: MdbQuizWord; name: string; party: string }) {
  if (!word.bundestag) return null;
  const faction = factionFactor(word);
  const rows: [string, number][] = [[name, word.bundestag], ...(faction ? [[`Fraktion ${party}`, faction] as [string, number]] : []), ['Bundestag', 1]];
  return (
    <ul className="mp-bars" aria-label={`Wie oft „${word.word}“ fällt, Bundestag-Durchschnitt = 1×`}>
      {rows.map(([label, value]) => (
        <li key={label} className="mp-bar">
          <span className="mp-bar__label">{label}</span>
          <span className="mp-bar__track" aria-hidden="true"><GrowBar className="mp-bar__fill" width={(value / word.bundestag!) * 100} /></span>
          <span className="mp-bar__value">{formatRatio(value)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Rises into place when scrolled into view; complete at rest for reduced motion. */
export function Reveal({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
    >
      {children}
    </Tag>
  );
}

export function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'left' }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === 'right' ? 'M5 12h14M13 6l6 6-6 6' : 'M19 12H5M11 6l-6 6 6 6'} />
    </svg>
  );
}

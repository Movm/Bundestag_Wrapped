import { motion } from 'motion/react';
import { type CSSProperties, type ReactNode } from 'react';
import { getPartyTone } from '@/lib/party-colors';
import { ENTER } from '../motion';
import '../css/party-block.css';

/** Flat block in the party's colour with the party name on top; children bring the content. */
export function PartyBlock({ party, children }: { party: string; children: ReactNode }) {
  return (
    <motion.li className="ds-party-block" variants={ENTER.rise} style={{ '--party-bg': getPartyTone(party, 'light') } as CSSProperties}>
      <h3 className="ds-party-block__name">{party}</h3>
      {children}
    </motion.li>
  );
}

/** List wrapper for PartyBlocks; an auto-fit grid. */
export function PartyGrid({ children, label }: { children: ReactNode; label: string }) {
  return <motion.ul className="ds-party-grid" aria-label={label}>{children}</motion.ul>;
}

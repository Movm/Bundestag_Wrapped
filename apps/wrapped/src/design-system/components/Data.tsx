import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getPartyTone } from '@/lib/party-colors';
import { ENTER } from '../motion';

/* ─── Blocks ──────────────────────────────────────────────────────────── */

export type BlockTone = 'white' | 'violet' | 'pink' | 'card' | 'ink';

/**
 * Flat coloured block — the system's only "card". Each tone sets its own
 * surface roles, so content inside stays readable (`data-surface` on a block
 * re-scopes the role utilities). White blocks behave like light ground.
 */
const TONE_SURFACE: Record<BlockTone, string> = { white: 'light', violet: 'violet', pink: 'pink', card: 'card', ink: 'ink' };

export function Block({ tone = 'white', children, className, enter = 'slide' }: { tone?: BlockTone; children: ReactNode; className?: string; enter?: keyof typeof ENTER | false }) {
  return (
    <motion.div data-surface={TONE_SURFACE[tone]} variants={enter ? ENTER[enter] : undefined} className={cn('ds-block', className)}>
      {children}
    </motion.div>
  );
}

/* ─── Rank movement ───────────────────────────────────────────────────── */

/** ▲ / ▼ / = with a spoken equivalent; the glyph alone is never announced. */
export function Delta({ change, className }: { change: number; className?: string }) {
  const glyph = change === 0 ? '=' : (
    <svg width="0.7em" height="0.7em" viewBox="0 0 10 10" className={change < 0 ? 'rotate-180' : undefined}><path d="M5 1 9.5 9h-9z" fill="currentColor" /></svg>
  );
  const spoken = change === 0 ? 'unverändert' : `${Math.abs(change)} ${Math.abs(change) === 1 ? 'Platz' : 'Plätze'} ${change > 0 ? 'aufgestiegen' : 'abgestiegen'}`;
  return (
    <span className={cn('ds-delta ds-contrast', className)}>
      <span aria-hidden="true" className="inline-flex items-center gap-[0.3em]">{glyph}{change === 0 ? '' : Math.abs(change)}</span>
      <span className="sr-only">{spoken}</span>
    </span>
  );
}

interface RankCardProps {
  rank: number;
  label: string;
  detail?: ReactNode;
  change?: number;
  tone?: BlockTone;
  /** 0 = biggest (leader), higher = smaller and indented — the stair-step of the design. */
  step?: number;
}

/** One entry of a ranking: big rank number, label, detail line, movement badge. */
export function RankCard({ rank, label, detail, change, tone = 'white', step = 0 }: RankCardProps) {
  return (
    <Block tone={tone} className={cn('ds-rank', `ds-rank--step-${Math.min(step, 3)}`)}>
      <span className="ds-rank__number" aria-hidden="true">{rank}</span>
      <div className="ds-rank__text">
        <span className="ds-rank__label"><span className="sr-only">Platz {rank}: </span>{label}</span>
        {detail && <span className="ds-rank__detail">{detail}</span>}
      </div>
      {change !== undefined && <Delta change={change} />}
    </Block>
  );
}

/* ─── Diverging bars ──────────────────────────────────────────────────── */

export interface DivergingRow {
  /** Party key (for colour) or plain label. */
  label: string;
  /** Ratio to the average: 1.17 → +17 %. */
  ratio: number;
  party?: string;
}

const percent = (ratio: number) => {
  const value = Math.round((ratio - 1) * 100);
  return `${value > 0 ? '+' : value < 0 ? '−' : '±'}${Math.abs(value)} %`;
};

/**
 * Above/below average around a centre line, on a white block. Bars grow with
 * transform only. The table semantics make every value readable without the bars.
 */
export function DivergingBars({ title, rows, caption }: { title: string; rows: DivergingRow[]; caption?: string }) {
  const max = Math.max(0.01, ...rows.map(row => Math.abs(row.ratio - 1)));
  return (
    <Block tone="white" enter="rise" className="ds-bars">
      <div className="ds-bars__head">
        <h3 className="ds-bars__title">{title}</h3>
        <span className="ds-bars__legend" aria-hidden="true">← unter · Schnitt · über →</span>
      </div>
      <table className="ds-bars__table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="sr-only"><tr><th scope="col">Fraktion</th><th scope="col">Abweichung vom Schnitt</th></tr></thead>
        <tbody>
          {rows.map(row => {
            const delta = row.ratio - 1;
            const width = `${(Math.abs(delta) / max) * 50}%`;
            const color = row.party ? getPartyTone(row.party, 'light') : 'var(--color-wr-ink)';
            return (
              <tr key={row.label}>
                <th scope="row" style={{ color }}>{row.label}</th>
                <td className="ds-bars__track" aria-hidden="true">
                  <motion.span
                    className={cn('ds-bars__bar', delta >= 0 ? 'ds-bars__bar--up' : 'ds-bars__bar--down')}
                    style={{ width, background: color }}
                    variants={ENTER.grow}
                  />
                </td>
                <td className="ds-bars__value">{percent(row.ratio)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Block>
  );
}

/* ─── Word chips ──────────────────────────────────────────────────────── */

const CHIP_TONES = ['pink', 'violet', 'white', 'outline'] as const;

/** Loose, slightly rotated word stickers; tones rotate so neighbours differ. */
export function ChipCloud({ words, label }: { words: string[]; label?: string }) {
  return (
    <motion.ul className="ds-chips" aria-label={label} variants={ENTER.rise}>
      {words.map((word, index) => (
        <li key={word} className={`ds-chip ds-chip--${CHIP_TONES[index % CHIP_TONES.length]}`} style={{ '--chip-tilt': `${[-2, 1.5, -1, 2][index % 4]}deg` } as React.CSSProperties}>
          {word}
        </li>
      ))}
    </motion.ul>
  );
}

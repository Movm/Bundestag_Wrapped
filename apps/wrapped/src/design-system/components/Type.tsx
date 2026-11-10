import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ENTER, type EnterKind } from '../motion';

export type DisplaySize = 'hero' | 'xl' | 'lg' | 'md' | 'sm';

interface DisplayProps {
  children: ReactNode;
  size?: DisplaySize;
  /** Heading level; slides use h2 under the page h1, the cover uses h1. */
  level?: 1 | 2 | 3;
  /** `heading` = Noto Sans heavy, `wide` = Archivo expanded. */
  face?: 'heading' | 'wide';
  enter?: EnterKind | false;
  className?: string;
  id?: string;
}

/** Huge uppercase headline. Sizes scale with rem and viewport, never vw alone. */
export function Display({ children, size = 'xl', level = 2, face = 'heading', enter = 'rise', className, id }: DisplayProps) {
  const Tag = motion[`h${level}`];
  return (
    <Tag id={id} variants={enter ? ENTER[enter] : undefined} className={cn('ds-display', `ds-display--${size}`, face === 'wide' && 'ds-display--wide', className)}>
      {children}
    </Tag>
  );
}

/** Highlighted word inside a Display — uses the surface's display accent (large text only). */
export function Mark({ children, block = false }: { children: ReactNode; block?: boolean }) {
  return <span className={block ? 'ds-mark-block' : 'text-display-accent'}>{children}</span>;
}

/** Small uppercase label in a pill. `tone="contrast"` inverts it against the surface. */
export function Eyebrow({ children, tone = 'contrast', className }: { children: ReactNode; tone?: 'contrast' | 'plain'; className?: string }) {
  return <span className={cn('ds-eyebrow', tone === 'contrast' && 'ds-eyebrow--contrast', className)}>{children}</span>;
}

/** Body copy at a readable measure. */
export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.p variants={ENTER.rise} className={cn('ds-lead', className)}>{children}</motion.p>;
}

/** Source line / footnote. */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('ds-note', className)}>{children}</p>;
}

/** Wide, tabular number for stats and ranks. */
export function BigNumber({ children, className, muted = false }: { children: ReactNode; className?: string; muted?: boolean }) {
  return <span className={cn('ds-number', muted && 'opacity-60', className)}>{children}</span>;
}

/**
 * One big word that shrinks to fit its column instead of breaking into
 * syllables. Needs a size container (`ds-fit-scope`, set on PartyBlock / Block).
 */
export function FitWord({ word, max = '3.25rem', className }: { word: string; max?: string; className?: string }) {
  const chars = Math.max(4, [...word].length);
  return (
    <span lang="de" className={cn('ds-fit-word', className)} style={{ '--chars': chars, '--fit-max': max } as React.CSSProperties}>
      {word}
    </span>
  );
}

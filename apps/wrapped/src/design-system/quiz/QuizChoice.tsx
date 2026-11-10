import { motion, useReducedMotion } from 'motion/react';
import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ENTER } from '../motion';
import { Glyph } from '../components/Glyph';
import type { QuizOption } from './engine';

interface QuizChoiceProps {
  option: QuizOption;
  answered: boolean;
  className?: string;
  style?: CSSProperties;
  /** Visual content; defaults to the option text. */
  children?: ReactNode;
  /** Show "richtig/falsch" as a visible tag (true) or only for screen readers (false). */
  showTag?: boolean;
  enter?: keyof typeof ENTER | false;
}

/**
 * The one answer control every layout uses. Native button; after answering it
 * keeps focus and becomes aria-disabled. Status lives in `data-status` (for
 * styling) AND in words (for everyone else), never in colour alone.
 */
export function QuizChoice({ option, answered, className, style, children, showTag = true, enter = 'rise' }: QuizChoiceProps) {
  const reduce = useReducedMotion();
  const feedback = reduce
    ? undefined
    : option.status === 'wrong' ? { x: [0, -6, 6, -3, 3, 0], transition: { duration: 0.3 } }
    : option.status === 'correct' ? { scale: [1, 1.05, 1], transition: { duration: 0.35 } }
    : undefined;
  return (
    <motion.button
      type="button"
      data-status={option.status}
      aria-disabled={answered || undefined}
      className={cn('ds-choice', answered && 'cursor-default', className)}
      style={style}
      variants={enter ? ENTER[enter] : undefined}
      animate={feedback}
      onClick={() => { if (!answered) option.select(); }}
    >
      <span className="ds-choice__letter" aria-hidden="true">{option.letter}</span>
      <span className="ds-choice__label">{children ?? option.text}</span>
      {option.statusWord && (
        <span className={showTag ? 'ds-choice__tag' : 'sr-only'}>
          {showTag ? <Glyph name={option.status === 'correct' ? 'check' : 'cross'} /> : ', '}{showTag ? ' ' : ''}{option.statusWord}
        </span>
      )}
    </motion.button>
  );
}

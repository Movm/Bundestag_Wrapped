import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import './quiz-effects.css';

export type QuizAnswerStatus = 'idle' | 'correct' | 'wrong' | 'other';

interface QuizAnswerButtonProps extends Omit<HTMLMotionProps<'button'>, 'type'> {
  status: QuizAnswerStatus;
  /** Answered: stays a focusable, native button, but ignores activation. */
  inactive: boolean;
}

/**
 * Native answer button with motion. It uses aria-disabled rather than `disabled`
 * so focus stays on the chosen option after answering.
 */
export function QuizAnswerButton({ status, inactive, children, className = '', onClick, ...props }: QuizAnswerButtonProps) {
  const reduceMotion = useReducedMotion();
  const animate = reduceMotion
    ? undefined
    : status === 'wrong' ? { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.3 } }
    : status === 'correct' ? { scale: [1, 1.06, 1], transition: { duration: 0.3 } }
    : { x: 0, scale: 1 };
  return (
    <motion.button
      {...props}
      type="button"
      aria-disabled={inactive || undefined}
      data-status={status}
      className={`quiz-answer-button ${className}`}
      onClick={(event) => { if (!inactive) onClick?.(event); }}
      animate={animate}
      whileHover={reduceMotion || inactive ? undefined : { scale: 1.03 }}
      whileTap={reduceMotion || inactive ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', duration: 0.25, bounce: 0.2 }}
    >
      {children}
    </motion.button>
  );
}

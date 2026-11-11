import { motion, useReducedMotion } from 'motion/react';
import { use, useEffect, useId, useMemo, useState } from 'react';
import { StoryContext } from '@/components/main-wrapped/StoryContext';
import { Confetti } from '../components/Confetti';
import { ENTER } from '../motion';
import { useQuizEngine, type AnyQuizConfig } from './engine';
import { pickQuizLayout, type QuizLayoutId } from './layouts';
import { QUIZ_LAYOUT_REGISTRY } from './registry';

const CONFETTI_MS = 1600;
const CONFETTI_COLORS = ['#46d17a', '#ffffff', '#ff4fa0', '#0e0a14', '#b98cff'];

export interface QuizProps {
  quiz: AnyQuizConfig;
  /** Stored result: true = right, false = wrong, null = not answered yet. */
  storedAnswer?: boolean | null;
  onAnswer: (isCorrect: boolean) => void;
  /** Stable id (slide id) — seeds the layout rotation. */
  seed?: string;
  /** Force a layout (falls back to rotation if it does not fit the options). */
  layout?: QuizLayoutId;
  /** Sentence with "{answer}" for the gap layout. */
  gapSentence?: string;
  /** Small label above the question, e.g. section name. */
  badge?: string;
  /** Mix the options per question (stable by seed); questions are built answer-first. */
  shuffle?: boolean;
}

/** Pause on the marked answer before the story moves on: a hit reads faster than a miss. */
const ADVANCE_MS = { right: 1500, wrong: 2600 };

/**
 * A quiz in the design system: one engine, any registered layout. Once
 * answered, the options stay and show the result (the right one turns green,
 * a right pick gets confetti), the result is announced in a polite status
 * region, and the story moves on to the next slide by itself. Answers
 * restored from storage only show the marking; reading mode never auto-advances.
 */
export function Quiz({ quiz, storedAnswer, onAnswer, seed, layout, gapSentence, badge, shuffle = false }: QuizProps) {
  const reduce = useReducedMotion();
  const { next, readingMode } = use(StoryContext);
  const [confetti, setConfetti] = useState(false);
  const engine = useQuizEngine(quiz, { storedAnswer, onAnswer, onCorrect: () => { if (!reduce) setConfetti(true); }, shuffleSeed: shuffle ? `${seed ?? ''}:${quiz.question}` : undefined });
  const questionId = useId();
  const spec = useMemo(
    () => pickQuizLayout(QUIZ_LAYOUT_REGISTRY, engine.quiz.options, { preferred: layout, seed: seed ?? engine.quiz.question, gapSentence }),
    [engine.quiz.options, engine.quiz.question, layout, seed, gapSentence],
  );
  const Layout = spec.component;

  useEffect(() => {
    if (!confetti) return;
    const timer = setTimeout(() => setConfetti(false), CONFETTI_MS);
    return () => clearTimeout(timer);
  }, [confetti]);

  // Only a pick made here moves on, not an answer restored from storage.
  const picked = engine.selected !== null;
  const right = engine.isCorrect;
  useEffect(() => {
    if (!picked || readingMode || !next || !seed) return;
    const timer = setTimeout(() => next(seed), right ? ADVANCE_MS.right : ADVANCE_MS.wrong);
    return () => clearTimeout(timer);
  }, [picked, right, readingMode, next, seed]);

  return (
    <div className="ds-quiz-frame" data-quiz-layout={spec.id}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {confetti && <Confetti count={90} duration={1.4} spread={240} size={14} colors={CONFETTI_COLORS} />}
      </div>
      {badge && <motion.span variants={ENTER.rise} className="ds-eyebrow ds-eyebrow--contrast self-start">{badge}</motion.span>}
      <Layout engine={engine} questionId={questionId} gapSentence={gapSentence} />
      <p data-testid="quiz-result" data-correct={engine.answered ? engine.isCorrect : undefined} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {engine.answered ? `${engine.spoken}${picked && !readingMode ? ' Weiter geht es mit der nächsten Folie.' : ''}` : ''}
      </p>
    </div>
  );
}

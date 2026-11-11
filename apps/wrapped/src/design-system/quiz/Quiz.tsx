import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useMemo, useState } from 'react';
import { Confetti } from '../components/Confetti';
import { ENTER } from '../motion';
import { useQuizEngine, type AnyQuizConfig } from './engine';
import { pickQuizLayout, type QuizLayoutId } from './layouts';
import { QUIZ_LAYOUT_REGISTRY } from './registry';

const CONFETTI_MS = 1000;
const CONFETTI_COLORS = ['#ff4fa0', '#7b3ff2', '#ffffff', '#0e0a14'];

export interface QuizProps {
  quiz: AnyQuizConfig;
  isAnswered?: boolean;
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

/**
 * A quiz in the design system: one engine, any registered layout, the same
 * result. The answer is announced at once in a polite status region and stays
 * on the slide as a card, so the reader can scroll straight on; focus stays
 * on the chosen answer.
 */
export function Quiz({ quiz, isAnswered, onAnswer, seed, layout, gapSentence, badge, shuffle = false }: QuizProps) {
  const reduce = useReducedMotion();
  const [confetti, setConfetti] = useState(false);
  const engine = useQuizEngine(quiz, { isAnswered, onAnswer, onCorrect: () => { if (!reduce) setConfetti(true); }, shuffleSeed: shuffle ? `${seed ?? ''}:${quiz.question}` : undefined });
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

  return (
    <div className="ds-quiz-frame" data-quiz-layout={spec.id}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti && <Confetti count={20} duration={0.8} colors={CONFETTI_COLORS} />}
      </div>
      {badge && <motion.span variants={ENTER.rise} className="ds-eyebrow ds-eyebrow--contrast self-start">{badge}</motion.span>}
      <Layout engine={engine} questionId={questionId} gapSentence={gapSentence} />
      <div role="status" aria-live="polite" aria-atomic="true" className="ds-quiz__status">
        {engine.answered && (
          <motion.div
            data-testid="quiz-result"
            data-correct={engine.selected === null ? undefined : engine.isCorrect}
            className="ds-result"
            initial={engine.selected === null ? false : reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.92, rotate: -3 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <p className="ds-result__verdict">
              <span aria-hidden="true">{engine.selected === null ? engine.verdict : engine.isCorrect ? 'Genau richtig!' : 'Diesmal nicht.'}</span>
              <span className="sr-only">{engine.spoken}</span>
            </p>
            {engine.selected !== null && !engine.isCorrect && (
              <p aria-hidden="true" className="ds-result__answer"><span className="ds-eyebrow ds-eyebrow--contrast">Richtig ist:</span> <strong>{engine.quiz.correctAnswer}</strong></p>
            )}
            {engine.quiz.explanation.map((line, index) => <p key={index} className="ds-result__text">{line}</p>)}
          </motion.div>
        )}
      </div>
      {engine.answered && <p className="sr-only">Weiter geht es mit der nächsten Folie.</p>}
    </div>
  );
}

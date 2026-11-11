import { motion, useReducedMotion } from 'motion/react';
import { useContext, useEffect, useId, useMemo, useState } from 'react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { useSlideEffectsActive } from '@/components/main-wrapped/SlideEffectsContext';
import { StoryContext } from '@/components/main-wrapped/StoryContext';
import { ActionButton } from '../components/ActionButton';
import { Confetti } from '../components/Confetti';
import { ENTER } from '../motion';
import { useQuizEngine, type AnyQuizConfig } from './engine';
import { pickQuizLayout, type QuizLayoutId } from './layouts';
import { QUIZ_LAYOUT_REGISTRY } from './registry';

const CONFETTI_MS = 1000;
/** Time to see the marked answers before the result card opens. */
const RESULT_DELAY_MS = 650;
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
 * on the slide as a card; shortly after, the result also opens as a modal
 * dialog (AccessibleDialog) with "Weiter". Closing it returns focus to the
 * chosen answer.
 */
export function Quiz({ quiz, isAnswered, onAnswer, seed, layout, gapSentence, badge, shuffle = false }: QuizProps) {
  const reduce = useReducedMotion();
  const slideActive = useSlideEffectsActive();
  const story = useContext(StoryContext);
  const [confetti, setConfetti] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const engine = useQuizEngine(quiz, { isAnswered, onAnswer, onCorrect: () => { if (!reduce) setConfetti(true); }, shuffleSeed: shuffle ? `${seed ?? ''}:${quiz.question}` : undefined });
  const questionId = useId();
  const verdictId = useId();
  const spec = useMemo(
    () => pickQuizLayout(QUIZ_LAYOUT_REGISTRY, engine.quiz.options, { preferred: layout, seed: seed ?? engine.quiz.question, gapSentence }),
    [engine.quiz.options, engine.quiz.question, layout, seed, gapSentence],
  );
  const Layout = spec.component;

  // Open the result dialog after a fresh answer, only while this slide is the
  // active one (never for answers restored from storage, never after leaving).
  const freshAnswer = engine.selected !== null;
  useEffect(() => {
    if (!freshAnswer || !slideActive) return;
    const timer = setTimeout(() => setResultOpen(true), RESULT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [freshAnswer, slideActive]);
  // Leaving the slide closes the dialog (state adjusted during render, no effect).
  if (!slideActive && resultOpen) setResultOpen(false);

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
              <span aria-hidden="true">{engine.verdict}</span>
              <span className="sr-only">{engine.spoken}</span>
            </p>
            {engine.quiz.explanation.map((line, index) => <p key={index} className="ds-result__text">{line}</p>)}
          </motion.div>
        )}
      </div>
      {engine.answered && <p className="sr-only">Scroll weiter oder wähle „Weiter“.</p>}
      <AccessibleDialog open={resultOpen} onClose={() => setResultOpen(false)} labelledBy={verdictId}>
        <div className="ds-result-dialog">
          <div className="ds-result-dialog__card" data-surface={engine.isCorrect ? 'pink' : 'ink'}>
            <span aria-hidden="true" className="ds-result-dialog__shape" />
            <h2 id={verdictId} className="ds-result-dialog__verdict">{engine.isCorrect ? 'Richtig!' : 'Knapp daneben.'}</h2>
            <p className="ds-result-dialog__answer"><span className="ds-eyebrow ds-eyebrow--contrast">Richtige Antwort</span> <strong>{engine.quiz.correctAnswer}</strong></p>
            {engine.quiz.explanation.map((line, index) => <p key={index} className="ds-result__text">{line}</p>)}
            <div className="ds-result-dialog__actions">
              <ActionButton icon="down" onClick={() => { const from = story.activeId; setResultOpen(false); requestAnimationFrame(() => story.next?.(from)); }}>Weiter</ActionButton>
              <ActionButton icon="none" variant="outline" onClick={() => setResultOpen(false)}>Zum Quiz</ActionButton>
            </div>
          </div>
        </div>
      </AccessibleDialog>
    </div>
  );
}

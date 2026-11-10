import { motion } from 'motion/react';
import { ENTER } from '../../motion';
import { QuizChoice } from '../QuizChoice';
import { QuizQuestion } from '../QuizQuestion';
import type { QuizLayoutProps } from '../layouts';
import './solid.css';
import './gap.css';

export const GAP_MARK = '{answer}';

/** "Lücke füllen": a sentence with a slot ("?" until answered), answer pills below. */
export function GapLayout({ engine, questionId, gapSentence }: QuizLayoutProps) {
  const [before, ...rest] = (gapSentence ?? GAP_MARK).split(GAP_MARK);
  const after = rest.join(GAP_MARK);
  const slotState = !engine.answered ? 'empty' : engine.selected !== null && !engine.isCorrect ? 'wrong' : 'filled';
  return (
    <div className="ds-quiz ds-quiz--gap">
      <QuizQuestion id={questionId} text={engine.quiz.question} />
      <motion.p variants={ENTER.rise} className="ds-display ds-display--wide ds-display--lg ds-quiz-gap__sentence">
        {before.trim() && <span>{before.trim()} </span>}
        <span className="ds-quiz-gap__slot" data-state={slotState}>
          {engine.answered ? engine.quiz.correctAnswer : (
            <>
              <span aria-hidden="true">?</span>
              <span className="sr-only">Lücke</span>
            </>
          )}
        </span>
        {after.trim() && <span>{after.trim()}</span>}
      </motion.p>
      <div role="group" aria-labelledby={questionId} className="ds-quiz-gap__pills">
        {engine.options.map(option => (
          <QuizChoice key={option.text} option={option} answered={engine.answered} className="ds-solid ds-choice--pill" />
        ))}
      </div>
    </div>
  );
}

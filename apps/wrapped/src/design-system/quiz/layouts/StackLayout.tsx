import { motion } from 'motion/react';
import { ENTER } from '../../motion';
import { QuizChoice } from '../QuizChoice';
import { QuizQuestion } from '../QuizQuestion';
import type { QuizLayoutProps } from '../layouts';

/** "Typo-Stapel": answers as a stack of huge words across an ink band. */
export function StackLayout({ engine, questionId }: QuizLayoutProps) {
  return (
    <div className="ds-quiz ds-quiz--stack">
      <QuizQuestion id={questionId} text={engine.quiz.question} tone="display-accent" />
      <div className="ds-quiz-stack">
        <motion.span className="ds-quiz-stack__band" aria-hidden="true" variants={ENTER.grow} />
        <div role="group" aria-labelledby={questionId} className="ds-quiz-stack__list">
          {engine.options.map(option => (
            <QuizChoice key={option.text} option={option} answered={engine.answered} enter="slide" className="ds-choice--word" />
          ))}
        </div>
      </div>
    </div>
  );
}

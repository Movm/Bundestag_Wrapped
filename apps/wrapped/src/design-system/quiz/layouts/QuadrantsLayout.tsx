import { QuizChoice } from '../QuizChoice';
import { QuizQuestion } from '../QuizQuestion';
import type { QuizLayoutProps } from '../layouts';
import './solid.css';
import './quadrants.css';

const TONES = ['pink', 'card', 'white', 'ink'] as const;

/** "Vier Flächen": exactly four answers as big colour fields in a 2×2 grid. */
export function QuadrantsLayout({ engine, questionId }: QuizLayoutProps) {
  return (
    <div className="ds-quiz ds-quiz--quadrants">
      <QuizQuestion id={questionId} text={engine.quiz.question} />
      <div className="ds-quiz-quadrants">
        <div role="group" aria-labelledby={questionId} className="contents">
          {engine.options.map((option, index) => (
            <QuizChoice key={option.text} option={option} answered={engine.answered} className={`ds-solid ds-choice--field ds-tone--${TONES[index % TONES.length]}`} />
          ))}
        </div>
        <span aria-hidden="true" className="ds-quiz-quadrants__hint">{engine.answered ? engine.verdict : 'Quiz'}</span>
      </div>
    </div>
  );
}

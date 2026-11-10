import type { CSSProperties } from 'react';
import { QuizChoice } from '../QuizChoice';
import { QuizQuestion } from '../QuizQuestion';
import type { QuizLayoutProps } from '../layouts';
import './solid.css';
import './stickers.css';

const TONES = ['pink', 'card', 'white', 'card', 'pink', 'white'] as const;
const TILTS = [-8, 6, 5, -6, 7, -4];

/** "Sticker-Wand": tilted sticker buttons in a wrapping wall. */
export function StickersLayout({ engine, questionId }: QuizLayoutProps) {
  return (
    <div className="ds-quiz ds-quiz--stickers">
      <QuizQuestion id={questionId} text={engine.quiz.question} />
      <div role="group" aria-labelledby={questionId} className="ds-quiz-stickers">
        {engine.options.map((option, index) => (
          <QuizChoice
            key={option.text}
            option={option}
            answered={engine.answered}
            className={`ds-solid ds-choice--sticker ds-tone--${TONES[index % TONES.length]}`}
            style={{ '--sticker-rot': `${TILTS[index % TILTS.length]}deg` } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

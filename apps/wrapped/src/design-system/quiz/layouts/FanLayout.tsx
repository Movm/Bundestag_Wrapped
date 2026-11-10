import { QuizChoice } from '../QuizChoice';
import { QuizQuestion } from '../QuizQuestion';
import type { QuizLayoutProps } from '../layouts';
import type { CSSProperties } from 'react';
import './solid.css';
import './fan.css';

const TONES = ['pink', 'card', 'white', 'ink'] as const;
/** Rotation / drop per card, so the cards open like a hand. */
const FAN: Record<number, { rot: number; drop: number }[]> = {
  3: [{ rot: -8, drop: 0.75 }, { rot: 0, drop: 0 }, { rot: 8, drop: 0.75 }],
  4: [{ rot: -12, drop: 1.25 }, { rot: -4, drop: 0 }, { rot: 4, drop: 0 }, { rot: 12, drop: 1.25 }],
};

/** "Karten-Fächer": 3–4 answer cards fanned like a hand; the picked card lifts. */
export function FanLayout({ engine, questionId }: QuizLayoutProps) {
  const poses = FAN[engine.options.length] ?? FAN[4];
  return (
    <div className="ds-quiz ds-quiz--fan">
      <QuizQuestion id={questionId} text={engine.quiz.question} />
      <div role="group" aria-labelledby={questionId} className="ds-quiz-fan">
        {engine.options.map((option, index) => {
          const pose = poses[index] ?? poses[0];
          return (
            <QuizChoice
              key={option.text}
              option={option}
              answered={engine.answered}
              className={`ds-solid ds-choice--card ds-tone--${TONES[index % TONES.length]}`}
              style={{ '--fan-rot': `${pose.rot}deg`, '--fan-drop': `${pose.drop}rem` } as CSSProperties}
            />
          );
        })}
      </div>
    </div>
  );
}

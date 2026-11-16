import { type CSSProperties } from 'react';
import { QuizChoice } from '../QuizChoice';
import { QuizQuestion } from '../QuizQuestion';
import type { QuizLayoutProps } from '../layouts';
import './duel.css';

const SIDES = ['a', 'b'] as const;

/**
 * "Duell": two answers that fill the whole slide, left and right (top and
 * bottom on phones). Before the answer each half is one half; hover and focus
 * pull the chosen half forward. Once answered, both halves grow to the real
 * split from `shares`, so the answer turns into the result chart. The percent
 * is part of the button text and the verdict sits in the plate below, so the
 * result never depends on the bar widths.
 */
export function DuelLayout({ engine, questionId, shares }: QuizLayoutProps) {
  const hintId = `${questionId}-hint`;
  const shown = engine.answered && shares;
  return (
    <div className="ds-quiz ds-quiz--duel" data-answered={engine.answered || undefined}>
      <div className="ds-duel__prompt">
        <QuizQuestion id={questionId} text={engine.quiz.question} className="ds-display--wide" />
        <p id={hintId} className="ds-duel__hint">{engine.answered ? engine.verdict : 'Tippe auf eine Seite.'}</p>
      </div>
      <div role="group" aria-labelledby={questionId} aria-describedby={hintId} className="ds-duel">
        {engine.options.map((option, index) => {
          const share = shares?.[option.text];
          return (
            <QuizChoice
              key={option.text}
              option={option}
              answered={engine.answered}
              enter={false}
              className={`ds-choice--duel ds-choice--duel-${SIDES[index % SIDES.length]}`}
              style={{ '--grow': shown && share !== undefined ? Math.max(share, 12) : 1 } as CSSProperties}
            >
              {shown && share !== undefined && <span className="ds-duel__value">{share} %</span>}
              <span className="ds-duel__name">{option.text}</span>
            </QuizChoice>
          );
        })}
        <span className="ds-duel__vs" aria-hidden="true">vs</span>
      </div>
      {engine.answered && <p className="ds-duel__result">{engine.quiz.explanation.join(' ')}</p>}
    </div>
  );
}

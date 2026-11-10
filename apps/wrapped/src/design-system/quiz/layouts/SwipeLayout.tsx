import { useState } from 'react';
import { QuizQuestion } from '../QuizQuestion';
import type { QuizLayoutProps } from '../layouts';
import './swipe.css';

/**
 * "Ja/Nein-Stapel": one card at a time. "Ja" answers with the shown option
 * (through the engine), "Nein" turns to the next card and wraps around.
 */
export function SwipeLayout({ engine, questionId }: QuizLayoutProps) {
  const [index, setIndex] = useState(0);
  const { options, answered } = engine;
  const picked = options.find(option => option.text === engine.selected) ?? options.find(option => option.status === 'correct');
  const shown = answered && picked ? picked : options[index % options.length];
  const position = options.indexOf(shown) + 1;

  return (
    <div className="ds-quiz ds-quiz--swipe">
      <QuizQuestion id={questionId} text={engine.quiz.question} />
      <div role="group" aria-labelledby={questionId} className="ds-quiz-swipe">
        <div className="ds-quiz-swipe__controls">
          <p className="ds-quiz-swipe__prompt">Ist das die richtige Antwort?</p>
          <div className="ds-quiz-swipe__buttons">
            <button
              type="button"
              className="ds-swipe-btn ds-swipe-btn--no"
              aria-disabled={answered || undefined}
              onClick={() => { if (!answered) setIndex((index + 1) % options.length); }}
            >
              <span aria-hidden="true">✕ </span>Nein<span className="sr-only">, nächste Karte</span>
            </button>
            <button
              type="button"
              className="ds-swipe-btn ds-swipe-btn--yes"
              data-status={shown.status}
              aria-disabled={answered || undefined}
              onClick={() => { if (!answered) shown.select(); }}
            >
              <span aria-hidden="true">✓ </span>Ja<span className="sr-only">, {shown.text}</span>
              {shown.statusWord && <span className="ds-choice__tag">{shown.status === 'correct' ? '✓ ' : '✕ '}{shown.statusWord}</span>}
            </button>
          </div>
        </div>
        <div className="ds-swipe-stack">
          <span aria-hidden="true" className="ds-swipe-stack__back ds-swipe-stack__back--ink" />
          <span aria-hidden="true" className="ds-swipe-stack__back ds-swipe-stack__back--pink" />
          <div className="ds-swipe-card" data-status={shown.status} aria-live="polite" aria-atomic="true">
            <span className="ds-swipe-card__meta">Karte {position} von {options.length}</span>
            <span className="ds-swipe-card__label">{shown.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

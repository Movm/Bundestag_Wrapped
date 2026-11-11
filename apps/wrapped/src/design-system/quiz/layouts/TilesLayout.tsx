import { QuizChoice } from '../QuizChoice';
import { QuizQuestion } from '../QuizQuestion';
import type { QuizLayoutProps } from '../layouts';

const TILE_TONES = ['pink', 'ink', 'white', 'card'] as const;

/** Big rounded answer tiles in a 2-column grid (1 column on narrow screens). Fits any answer length. */
export function TilesLayout({ engine, questionId }: QuizLayoutProps) {
  return (
    <div className="ds-quiz ds-quiz--tiles">
      <QuizQuestion id={questionId} text={engine.quiz.question} />
      {/* Long answers (two names and a party) get a smaller type step on phones. */}
      <div role="group" aria-labelledby={questionId} className="ds-quiz-tiles" data-long={engine.options.some(option => option.text.length > 28) || undefined}>
        {engine.options.map((option, index) => (
          <QuizChoice key={option.text} option={option} answered={engine.answered} className={`ds-choice--tile ds-tone--${TILE_TONES[index % TILE_TONES.length]}`} />
        ))}
      </div>
    </div>
  );
}

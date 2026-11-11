import { Slide } from '@/design-system/components/Slide';
import { Quiz } from '@/design-system/quiz/Quiz';
import type { AnyQuizConfig } from '@/design-system/quiz/engine';
import type { QuizLayoutId } from '@/design-system/quiz/layouts';

export type { QuizConfig, QuizConfigAlt, QuizOptionWithCorrect } from '@/design-system/quiz/engine';

interface SlideQuizProps {
  quiz: AnyQuizConfig;
  isAnswered?: boolean;
  onAnswer: (isCorrect: boolean) => void;
  /** Kept for existing callers; navigation runs through the story shell. */
  onComplete?: () => void;
  title?: string;
  /** Kept for existing callers; the design system uses no emoji headers. */
  emoji?: string;
  badge?: string;
  partyColor?: string;
  slideId?: string;
  layout?: QuizLayoutId;
  gapSentence?: string;
  /** Story quizzes mix their options; off only where a test needs a fixed order. */
  shuffle?: boolean;
}

/** A quiz slide: the design-system Quiz on the quiz surface. */
export function SlideQuiz({ quiz, isAnswered, onAnswer, title, badge, slideId, layout, gapSentence, shuffle = true }: SlideQuizProps) {
  return (
    <Slide shapes="band">
      <Quiz quiz={quiz} isAnswered={isAnswered} onAnswer={onAnswer} seed={slideId} layout={layout} gapSentence={gapSentence} badge={badge ?? title} shuffle={shuffle} />
    </Slide>
  );
}

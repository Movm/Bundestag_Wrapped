import { memo, useMemo } from 'react';
import { INTRO_SLIDES } from '@/data/intro-slides';
import { QUIZZES } from '@/data/quizzes';
import {
  SlideIntro,
  SlideQuiz,
  shuffle,
  type SlidePhase,
  type QuizConfig,
} from '../shared';
import { ResultView } from './ResultView';

interface SwiftieSlideProps {
  phase: SlidePhase;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

// Get swiftie quiz data from shared QUIZZES
const SWIFTIE_QUIZ = QUIZZES['quiz-swiftie'];
const SWIFTIE = SWIFTIE_QUIZ.swiftie!;
const DECOYS = SWIFTIE_QUIZ.decoys!;

export const SwiftieSlide = memo(function SwiftieSlide({
  phase,
  onQuizAnswer,
  onComplete,
}: SwiftieSlideProps) {
  const quiz = useMemo<QuizConfig>(() => {
    const correctOption = `${SWIFTIE.name} (${SWIFTIE.party})`;
    const decoyOptions = DECOYS.map((d) => `${d.name} (${d.party})`);

    return {
      question: SWIFTIE_QUIZ.question,
      options: shuffle([correctOption, ...decoyOptions]),
      correctAnswer: correctOption,
      explanation: SWIFTIE_QUIZ.explanation,
    };
  }, []);

  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-swiftie'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-swiftie"
      />
    );
  }

  if (phase === 'quiz') {
    return (
      <SlideQuiz
        quiz={quiz}
        onAnswer={onQuizAnswer ?? (() => {})}
        onComplete={onComplete ?? (() => {})}
      />
    );
  }

  return <ResultView swiftie={SWIFTIE} />;
});

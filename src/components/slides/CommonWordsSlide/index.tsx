import { memo } from 'react';
import { INTRO_SLIDES } from '@/data/intro-slides';
import {
  SlideIntro,
  SlideQuiz,
  useQuizConfig,
  type SlidePhase,
} from '../shared';
import { ResultView } from './ResultView';

interface CommonWordsSlideProps {
  topics: string[];
  phase?: SlidePhase;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

export const CommonWordsSlide = memo(function CommonWordsSlide({
  topics,
  phase = 'result',
  onQuizAnswer,
  onComplete,
}: CommonWordsSlideProps) {
  const quiz = useQuizConfig({
    items: topics,
    getOption: (topic) => topic,
    question: 'Was war das meistgenutzte Wort?',
    getExplanation: (topic) =>
      `"${topic}" wurde von allen Fraktionen am häufigsten verwendet!`,
  });

  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-common-words'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-common-words"
      />
    );
  }

  if (phase === 'quiz' && quiz) {
    return (
      <SlideQuiz
        quiz={quiz}
        onAnswer={onQuizAnswer ?? (() => {})}
        onComplete={onComplete ?? (() => {})}
      />
    );
  }

  return <ResultView topics={topics} />;
});

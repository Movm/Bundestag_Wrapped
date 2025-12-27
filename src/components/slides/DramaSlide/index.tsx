import { memo } from 'react';
import type { DramaStats } from '@/data/wrapped';
import { formatNumber } from '@/lib/utils';
import { INTRO_SLIDES } from '@/data/intro-slides';
import {
  SlideIntro,
  SlideQuiz,
  useQuizConfig,
  type SlidePhase,
} from '../shared';
import { ResultView } from './ResultView';

interface DramaSlideProps {
  drama: DramaStats;
  phase?: SlidePhase;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

export const DramaSlide = memo(function DramaSlide({
  drama,
  phase = 'result',
  onQuizAnswer,
  onComplete,
}: DramaSlideProps) {
  const quiz = useQuizConfig({
    items: drama.topZwischenrufer,
    getOption: (z) => z.name,
    question: 'Wer hat am meisten dazwischengerufen?',
    getExplanation: (z) =>
      `${z.name} (${z.party}) ist mit ${formatNumber(z.count)} Zwischenrufen der Spitzenreiter!`,
  });

  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-drama'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-drama"
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

  return <ResultView drama={drama} />;
});

import { memo, useMemo } from 'react';
import type { GenderAnalysis } from '@/data/wrapped';
import { INTRO_SLIDES } from '@/data/intro-slides';
import {
  SlideIntro,
  SlideQuiz,
  useQuizConfig,
  type SlidePhase,
} from '../shared';
import { ResultView } from './ResultView';

interface GenderSlideProps {
  genderAnalysis: GenderAnalysis;
  phase: SlidePhase;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

export const GenderSlide = memo(function GenderSlide({
  genderAnalysis,
  phase,
  onQuizAnswer,
  onComplete,
}: GenderSlideProps) {
  const sortedParties = useMemo(
    () =>
      [...genderAnalysis.byParty]
        .filter((p) => p.party !== 'fraktionslos')
        .sort((a, b) => b.femaleRatio - a.femaleRatio),
    [genderAnalysis.byParty]
  );

  const quiz = useQuizConfig({
    items: sortedParties,
    getOption: (p) => p.party,
    question: 'Welche Fraktion hat den höchsten Frauenanteil bei Reden?',
    getExplanation: (p) =>
      `${p.party} hat mit ${p.femaleRatio.toFixed(0)}% den höchsten Frauenanteil!`,
  });

  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-gender'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-gender"
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

  return <ResultView genderAnalysis={genderAnalysis} />;
});

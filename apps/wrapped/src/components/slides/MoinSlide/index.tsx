import { memo, useMemo } from 'react';
import { INTRO_SLIDES } from '@/data/intro-slides';
import {
  SlideIntro,
  SlideQuiz,
  type SlidePhase,
} from '../shared';
import { ResultView } from './ResultView';
import { buildMoinQuiz, type MoinSpeaker } from './moin-quiz';

interface MoinSlideProps {
  moinSpeakers: MoinSpeaker[];
  phase: SlidePhase;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

export const MoinSlide = memo(function MoinSlide({
  moinSpeakers,
  phase,
  onQuizAnswer,
  onComplete,
}: MoinSlideProps) {
  const quiz = useMemo(() => buildMoinQuiz(moinSpeakers), [moinSpeakers]);

  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-moin'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-moin"
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

  return <ResultView speakers={moinSpeakers} />;
});

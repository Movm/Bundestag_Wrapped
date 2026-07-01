import { memo } from 'react';
import type { ToneAnalysis } from '@/data/wrapped';
import { INTRO_SLIDES } from '@/data/intro-slides';
import { SlideIntro, type SlidePhase } from '../shared';
import { ResultView } from './ResultView';

interface DiscriminatorySlideProps {
  toneAnalysis?: ToneAnalysis | null;
  phase?: SlidePhase;
}

export const DiscriminatorySlide = memo(function DiscriminatorySlide({
  toneAnalysis,
  phase = 'result',
}: DiscriminatorySlideProps) {
  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-discriminatory'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-discriminatory"
      />
    );
  }

  return <ResultView toneAnalysis={toneAnalysis} />;
});

import { memo } from 'react';
import type { ToneAnalysis } from '@/data/wrapped';
import { INTRO_SLIDES } from '@/data/intro-slides';
import { SlideIntro, type SlidePhase } from '../shared';
import { ResultView } from './ResultView';

interface ToneAnalysisSlideProps {
  toneAnalysis: ToneAnalysis;
  phase?: SlidePhase;
}

export const ToneAnalysisSlide = memo(function ToneAnalysisSlide({
  toneAnalysis,
  phase = 'result',
}: ToneAnalysisSlideProps) {
  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-tone'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-tone"
      />
    );
  }

  return <ResultView toneAnalysis={toneAnalysis} />;
});

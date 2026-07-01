import { memo } from 'react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import type { SpeakerSlideType } from './constants';
import { SpeakerIntroSlide } from './SpeakerIntroSlide';
import { SpeakerAnimalSlide } from './SpeakerAnimalSlide';
import { SpeakerQuizSlide } from './SpeakerQuizSlide';
import { SpeakerWordsSlide } from './SpeakerWordsSlide';
import { SpeakerTopicsSlide } from './SpeakerTopicsSlide';
import { SpeakerShareSlide } from './SpeakerShareSlide';

interface SpeakerSlideRendererProps {
  slide: SpeakerSlideType;
  speaker: SpeakerWrapped;
  onStart?: () => void;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onQuizComplete?: () => void;
  onRestart?: () => void;
}

/**
 * Renders the appropriate slide component based on slide type.
 * Follows the same pattern as main wrapped SlideRenderer.
 * Memoized to prevent unnecessary re-renders.
 */
export const SpeakerSlideRenderer = memo(function SpeakerSlideRenderer({
  slide,
  speaker,
  onStart,
  onQuizAnswer,
  onQuizComplete,
  onRestart,
}: SpeakerSlideRendererProps) {
  switch (slide) {
    case 'speaker-intro':
      return <SpeakerIntroSlide speaker={speaker} onStart={onStart} />;

    case 'speaker-animal':
      return <SpeakerAnimalSlide speaker={speaker} />;

    case 'speaker-quiz':
      return (
        <SpeakerQuizSlide
          speaker={speaker}
          onQuizAnswer={onQuizAnswer}
          onComplete={onQuizComplete}
        />
      );

    case 'speaker-words':
      return <SpeakerWordsSlide speaker={speaker} />;

    case 'speaker-topics':
      return <SpeakerTopicsSlide speaker={speaker} />;

    case 'speaker-share':
      return <SpeakerShareSlide speaker={speaker} onRestart={onRestart} />;

    default:
      return null;
  }
});

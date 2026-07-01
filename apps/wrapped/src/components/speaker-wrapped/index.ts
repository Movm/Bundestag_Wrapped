// Slide components
export { SpeakerIntroSlide } from './SpeakerIntroSlide';
export { SpeakerAnimalSlide } from './SpeakerAnimalSlide';
export { SpeakerQuizSlide } from './SpeakerQuizSlide';
export { SpeakerWordsSlide } from './SpeakerWordsSlide';
export { SpeakerTopicsSlide } from './SpeakerTopicsSlide';
export { SpeakerShareSlide } from './SpeakerShareSlide';

// Slide renderer
export { SpeakerSlideRenderer } from './SpeakerSlideRenderer';

// Constants and types
export {
  SPEAKER_SLIDES,
  SPEAKER_QUIZ_SLIDES,
  SPEAKER_AUTO_SCROLL_SLIDES,
  SPEAKER_HIDE_PROGRESS_SLIDES,
  type SpeakerSlideType,
} from './constants';

// Hooks
export { useSpeakerScrollWrapped } from './useSpeakerScrollWrapped';

// Party colors (local override)
export {
  getPartyColor,
  getPartyBgColor,
  getPartyGradient,
  getPartyBgClass,
  PARTY_COLORS,
  PARTY_BG_COLORS,
  PARTY_BG_CLASSES,
  PARTY_GRADIENTS,
} from './party-colors';

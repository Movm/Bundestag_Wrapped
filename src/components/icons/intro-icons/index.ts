/**
 * Intro Icons - Custom SVG icons for intro slides
 * Each icon matches its section's color scheme and background effect
 */

export { TopicsIcon } from './TopicsIcon';
export { VocabularyIcon } from './VocabularyIcon';
export { SpeechesIcon } from './SpeechesIcon';
export { DramaIcon } from './DramaIcon';
export { DiscriminatoryIcon } from './DiscriminatoryIcon';
export { CommonWordsIcon } from './CommonWordsIcon';
export { MoinIcon } from './MoinIcon';
export { SwiftieIcon } from './SwiftieIcon';
export { ToneIcon } from './ToneIcon';
export { GenderIcon } from './GenderIcon';

export type { IntroIconProps } from './types';

// Icon to slide mapping for convenience
export const INTRO_ICONS = {
  'intro-topics': TopicsIcon,
  'intro-vocabulary': VocabularyIcon,
  'intro-speeches': SpeechesIcon,
  'intro-drama': DramaIcon,
  'intro-discriminatory': DiscriminatoryIcon,
  'intro-common-words': CommonWordsIcon,
  'intro-moin': MoinIcon,
  'intro-swiftie': SwiftieIcon,
  'intro-tone': ToneIcon,
  'intro-gender': GenderIcon,
} as const;

// Animation class mapping for each icon
export const INTRO_ICON_ANIMATIONS = {
  'intro-topics': 'animate-icon-pulse',
  'intro-vocabulary': 'animate-icon-wave',
  'intro-speeches': 'animate-icon-bars',
  'intro-drama': 'animate-icon-flash',
  'intro-discriminatory': 'animate-icon-none',
  'intro-common-words': 'animate-icon-float',
  'intro-moin': 'animate-icon-sway',
  'intro-swiftie': 'animate-icon-twinkle',
  'intro-tone': 'animate-icon-glow',
  'intro-gender': 'animate-icon-pulse',
} as const;

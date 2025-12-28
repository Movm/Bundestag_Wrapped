/**
 * Intro Icons - Custom SVG icons for intro slides
 * Each icon matches its section's color scheme and background effect
 */

import { TopicsIcon } from './TopicsIcon';
import { VocabularyIcon } from './VocabularyIcon';
import { SpeechesIcon } from './SpeechesIcon';
import { DramaIcon } from './DramaIcon';
import { DiscriminatoryIcon } from './DiscriminatoryIcon';
import { CommonWordsIcon } from './CommonWordsIcon';
import { MoinIcon } from './MoinIcon';
import { SwiftieIcon } from './SwiftieIcon';
import { ToneIcon } from './ToneIcon';
import { GenderIcon } from './GenderIcon';
import { DisclaimerIcon } from './DisclaimerIcon';

// Re-export all icons
export {
  TopicsIcon,
  VocabularyIcon,
  SpeechesIcon,
  DramaIcon,
  DiscriminatoryIcon,
  CommonWordsIcon,
  MoinIcon,
  SwiftieIcon,
  ToneIcon,
  GenderIcon,
  DisclaimerIcon,
};

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

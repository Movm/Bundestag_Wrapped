/**
 * Centralized Slide Icons Configuration (React Native)
 * Single source of truth for all section icons used across mobile slides.
 */

import type { ComponentType } from 'react';
import {
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
} from '../components/icons/intro-icons';

export interface SlideIconConfig {
  /** Custom SVG icon component */
  Icon: ComponentType<{ width?: number; height?: number }>;
  /** Fallback emoji */
  emoji: string;
}

/**
 * Icon configuration for each section.
 * Keys are section names without prefix (e.g., 'topics' not 'intro-topics').
 */
export const SLIDE_ICONS: Record<string, SlideIconConfig> = {
  disclaimer: {
    Icon: DisclaimerIcon,
    emoji: '⚠️',
  },
  topics: {
    Icon: TopicsIcon,
    emoji: '📊',
  },
  vocabulary: {
    Icon: VocabularyIcon,
    emoji: '📚',
  },
  speeches: {
    Icon: SpeechesIcon,
    emoji: '🎤',
  },
  drama: {
    Icon: DramaIcon,
    emoji: '🎭',
  },
  discriminatory: {
    Icon: DiscriminatoryIcon,
    emoji: '⚠️',
  },
  'common-words': {
    Icon: CommonWordsIcon,
    emoji: '📊',
  },
  moin: {
    Icon: MoinIcon,
    emoji: '👋',
  },
  swiftie: {
    Icon: SwiftieIcon,
    emoji: '💜',
  },
  tone: {
    Icon: ToneIcon,
    emoji: '🎭',
  },
  gender: {
    Icon: GenderIcon,
    emoji: '👩‍💼',
  },
};

/**
 * Get icon configuration from any slide ID.
 * Handles prefixes: intro-*, info-*, reveal-*, chart-*, quiz-*
 */
export function getSlideIconConfig(slideId: string): SlideIconConfig | undefined {
  const section = slideId.replace(/^(intro-|info-|reveal-|chart-|quiz-)/, '');
  const key = section === 'signature' ? 'vocabulary' : section;
  return SLIDE_ICONS[key];
}

/**
 * Get just the emoji for a slide (useful for fallbacks)
 */
export function getSlideEmoji(slideId: string): string {
  return getSlideIconConfig(slideId)?.emoji ?? '';
}

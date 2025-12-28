/**
 * Centralized Slide Icons Configuration
 * Single source of truth for all section icons used across slides.
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
} from '@/components/icons/intro-icons';

export interface SlideIconConfig {
  /** Custom SVG icon component */
  Icon: ComponentType<{ className?: string }>;
  /** Fallback emoji (for mobile/SSR) */
  emoji: string;
  /** CSS animation class */
  animation: string;
}

/**
 * Icon configuration for each section.
 * Keys are section names without prefix (e.g., 'topics' not 'intro-topics').
 */
export const SLIDE_ICONS: Record<string, SlideIconConfig> = {
  disclaimer: {
    Icon: DisclaimerIcon,
    emoji: '⚠️',
    animation: 'animate-icon-none',
  },
  topics: {
    Icon: TopicsIcon,
    emoji: '📊',
    animation: 'animate-icon-pulse',
  },
  vocabulary: {
    Icon: VocabularyIcon,
    emoji: '📚',
    animation: 'animate-icon-wave',
  },
  speeches: {
    Icon: SpeechesIcon,
    emoji: '🎤',
    animation: 'animate-icon-bars',
  },
  drama: {
    Icon: DramaIcon,
    emoji: '🎭',
    animation: 'animate-icon-flash',
  },
  discriminatory: {
    Icon: DiscriminatoryIcon,
    emoji: '⚠️',
    animation: 'animate-icon-none',
  },
  'common-words': {
    Icon: CommonWordsIcon,
    emoji: '📊',
    animation: 'animate-icon-float',
  },
  moin: {
    Icon: MoinIcon,
    emoji: '👋',
    animation: 'animate-icon-sway',
  },
  swiftie: {
    Icon: SwiftieIcon,
    emoji: '💜',
    animation: 'animate-icon-twinkle',
  },
  tone: {
    Icon: ToneIcon,
    emoji: '🎭',
    animation: 'animate-icon-glow',
  },
  gender: {
    Icon: GenderIcon,
    emoji: '👩‍💼',
    animation: 'animate-icon-pulse',
  },
};

/**
 * Get icon configuration from any slide ID.
 * Handles prefixes: intro-*, info-*, reveal-*, chart-*, quiz-*
 *
 * @example
 * getSlideIconConfig('intro-topics') // returns TopicsIcon config
 * getSlideIconConfig('info-speeches') // returns SpeechesIcon config
 * getSlideIconConfig('quiz-signature') // returns VocabularyIcon config (special case)
 */
export function getSlideIconConfig(slideId: string): SlideIconConfig | undefined {
  // Strip prefix to get section name
  const section = slideId.replace(/^(intro-|info-|reveal-|chart-|quiz-)/, '');

  // Handle special cases
  let key = section;
  if (section === 'signature') key = 'vocabulary';
  if (section === 'party-topics') key = 'topics';

  return SLIDE_ICONS[key];
}

/**
 * Get just the emoji for a slide (useful for fallbacks)
 */
export function getSlideEmoji(slideId: string): string {
  return getSlideIconConfig(slideId)?.emoji ?? '';
}

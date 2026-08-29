/**
 * Shared Web Layer Exports
 *
 * This module centralizes reusable code within the web app.
 */

// Animation configurations
export * from './animations/animation-config';

// Hooks
export { useQuizConfig, type QuizConfig, type QuizConfigOptions } from './hooks/useQuizConfig';

// Re-export shared data
export { QUIZZES } from '../data/quizzes';
export { INFO_SLIDES, type InfoSlideContent } from '../data/info-slides';

// Re-export party colors
export {
  PARTY_COLORS,
  PARTY_BG_COLORS,
  getPartyColor,
  getPartyBgColor,
  getPartyGradient,
} from '../lib/party-colors';

// Topic constants
export { TOPICS, TOPIC_BY_ID, type TopicMeta } from './constants/topics';

// Speaker wrapped utilities
export * from './speaker-wrapped';

// Sound system (types and hook factory)
export * from './sounds';

// Theme backgrounds
export * from './theme-backgrounds/types';

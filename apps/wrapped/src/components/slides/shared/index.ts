// Utilities
export { shuffle, type SlidePhase, BUBBLE_POSITIONS, FLOAT_ANIMATIONS } from './utils';
export { useQuizConfig, type QuizConfigOptions } from './hooks/useQuizConfig';

// Animation variants and utilities
export {
  containerVariants,
  itemVariants,
  itemSlideInVariants,
  scaleInVariants,
  defaultViewport,
  // Quiz-specific (more fluid)
  quizContainerVariants,
  quizItemVariants,
  optionButtonVariants,
  featuredWordVariants,
} from './animations';

// Shared slide components
export { FloatingParticles } from './FloatingParticles';
export { SlideContainer, type SparklesConfig } from './SlideContainer';
export { SlideInfo } from './SlideInfo';
export { SlideIntro } from './SlideIntro';
export {
  SlideQuiz,
  type QuizConfig,
  type QuizConfigAlt,
  type QuizOptionWithCorrect,
} from './SlideQuiz';
export { SlideShareFAB } from './SlideShareFAB';

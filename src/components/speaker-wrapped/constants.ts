/**
 * Speaker Wrapped slide configuration
 *
 * 6 slides for individual speaker wrapped experience:
 * - intro: Welcome with speaker name/party
 * - animal: Spirit animal reveal
 * - quiz: Signature word quiz (one question)
 * - words: Favorite and signature words
 * - topics: Top topics they speak about
 * - share: Generate sharepic and navigation
 */

export const SPEAKER_SLIDES = [
  'speaker-intro',
  'speaker-animal',
  'speaker-quiz',
  'speaker-words',
  'speaker-topics',
  'speaker-share',
] as const;

export type SpeakerSlideType = (typeof SPEAKER_SLIDES)[number];

// Quiz slide requires answer before scrolling to next slide
export const SPEAKER_QUIZ_SLIDES = new Set<SpeakerSlideType>(['speaker-quiz']);

// No auto-scroll for speaker wrapped (shorter experience, user-driven)
export const SPEAKER_AUTO_SCROLL_SLIDES = new Set<SpeakerSlideType>([]);

// Slides where progress bar is hidden
export const SPEAKER_HIDE_PROGRESS_SLIDES = new Set<SpeakerSlideType>([
  'speaker-intro',
  'speaker-share',
]);

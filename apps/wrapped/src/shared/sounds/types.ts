/**
 * Shared Sound Types
 *
 * Sound type definitions and constants for browser audio.
 */

export type SoundType = 'click' | 'correct' | 'wrong' | 'start' | 'whoosh' | 'hover';

export const SOUND_PATHS: Record<SoundType, string> = {
  click: '/sounds/click.wav',
  correct: '/sounds/correct.wav',
  wrong: '/sounds/wrong.wav',
  start: '/sounds/start.wav',
  whoosh: '/sounds/whoosh.mp3',
  hover: '/sounds/click.wav', // Reuses click at lower volume
};

export const SOUND_VOLUMES: Record<SoundType, number> = {
  click: 0.7,
  correct: 0.85,
  wrong: 0.85,
  start: 0.9,
  whoosh: 0.5,
  hover: 0.25, // Subtle hover feedback
};

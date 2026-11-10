/**
 * Shared Sound Types
 *
 * Sound type definitions and constants for browser audio. The short UI sounds
 * are segments of the SND sprite (`lib/snd-sprite.ts`); only the long intro
 * sound is a file of its own.
 */

export type SoundType =
  | 'click'
  | 'correct'
  | 'wrong'
  | 'start'
  | 'whoosh'
  | 'hover'
  /** Perfect Match: a card moves one place while reordering. */
  | 'tick'
  /** Perfect Match: a card or chip is picked up. */
  | 'lift'
  /** Perfect Match: a chip lands in a slot. */
  | 'drop'
  | 'like'
  | 'nope'
  /** Perfect Match: the result appears. */
  | 'match';

/** Sounds served as files of their own. */
export const SOUND_FILES: Partial<Record<SoundType, string>> = {
  start: '/sounds/start.wav',
};

const TAPS = ['tap_01', 'tap_02', 'tap_03', 'tap_04', 'tap_05'] as const;
const SWIPES = ['swipe_01', 'swipe_02', 'swipe_03', 'swipe_04', 'swipe_05'] as const;

/**
 * SND sprite segments per sound. Several names = variants picked at random,
 * as SND recommends for sounds that repeat often.
 */
export const SOUND_SPRITES: Partial<Record<SoundType, readonly string[]>> = {
  click: ['button'],
  hover: TAPS,
  correct: ['notification'],
  wrong: ['toggle_off'],
  whoosh: SWIPES,
  tick: TAPS,
  lift: ['select'],
  drop: ['toggle_on'],
  like: ['transition_up'],
  nope: ['transition_down'],
  match: ['celebration'],
};

export const SOUND_VOLUMES: Record<SoundType, number> = {
  click: 0.6,
  correct: 0.8,
  wrong: 0.7,
  start: 0.9,
  whoosh: 0.45,
  hover: 0.25, // Subtle hover feedback
  tick: 0.35,
  lift: 0.45,
  drop: 0.7,
  like: 0.6,
  nope: 0.6,
  match: 0.85,
};

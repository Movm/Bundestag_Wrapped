/**
 * Shared Sound Types
 *
 * Sound type definitions and constants for browser audio. The short UI sounds
 * live as data URIs in `lib/ui-sounds.ts`; only the long intro sound is a file.
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

/** Sounds served as files instead of data URIs in `lib/ui-sounds.ts`. */
export const SOUND_FILES: Partial<Record<SoundType, string>> = {
  start: '/sounds/start.wav',
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

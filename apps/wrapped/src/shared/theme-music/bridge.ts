import { type ThemeType } from './types';

/** Commands the web app sends to the native music engine (protocol 1). */
export type MusicCommand =
  | { type: 'prime'; theme: ThemeType; path: string }
  | { type: 'preload'; theme: ThemeType; path: string }
  | { type: 'play'; theme: ThemeType; path: string }
  | { type: 'startPrimed' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'release' };

export type MusicSink = (command: MusicCommand) => void;

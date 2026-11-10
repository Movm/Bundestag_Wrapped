/**
 * Sound System for Bundestag Wrapped (Web)
 *
 * Provides audio feedback for quiz interactions:
 * - click: Button tap feedback
 * - correct: Success fanfare for right answers
 * - wrong: Error sound for wrong answers
 * - whoosh: Slide transition sound
 *
 * Features:
 * - Preloads sounds on first user interaction
 * - Background music with loop support
 * - Mute preference persisted to localStorage
 * - Graceful fallback if audio fails
 */

import {
  type SoundType,
  SOUND_PATHS,
  SOUND_VOLUMES,
  createSlideTransitionSoundHook,
} from '@/shared/sounds';
import { whenTrulyIdle } from './when-idle';
import { IS_DEV_AUDIO_DISABLED, useAudioStore } from '@/stores/audioStore';

export type { SoundType };

const BACKGROUND_MUSIC_PATH = '/sounds/background.mp3';
const BACKGROUND_VOLUME = 0.08;

// Background music instance
let backgroundMusic: HTMLAudioElement | null = null;
let isMusicPlaying = false;

// Audio cache for preloaded sounds
const audioCache: Partial<Record<SoundType, HTMLAudioElement>> = {};
let isInitialized = false;

// Track user interaction to unlock audio and preload sounds
if (typeof window !== 'undefined' && !IS_DEV_AUDIO_DISABLED) {
  const unlockAudio = () => {
    // Initialize sounds on first interaction
    if (!isInitialized) {
      initSounds();
    }
    // Remove listeners after first interaction
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };

  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  // Creating and loading audio needs no user gesture (only play() does). Doing it
  // while the page is idle keeps the media setup out of the "Starten" click,
  // where it cost a dropped frame.
  whenTrulyIdle(() => initSounds());
}

/**
 * Initialize and preload all sounds.
 * Call this on first user interaction to comply with autoplay policies.
 */
function loadSound(type: SoundType): HTMLAudioElement {
  const cached = audioCache[type];
  if (cached) return cached;
  const audio = new Audio(SOUND_PATHS[type]);
  audio.preload = 'auto';
  audio.load();
  audioCache[type] = audio;
  return audio;
}

/**
 * Preload all sounds, one media element per task: creating an Audio element
 * is native main-thread work, and doing all of them in one task cost a frame.
 */
export function initSounds(): void {
  if (IS_DEV_AUDIO_DISABLED || isInitialized) return;
  isInitialized = true;
  const pending = Object.keys(SOUND_PATHS) as SoundType[];
  const next = () => {
    const type = pending.shift();
    if (!type) return;
    loadSound(type);
    window.setTimeout(next, 120);
  };
  next();
}

/**
 * Play a sound effect
 * Uses cached audio elements for efficiency - no new allocations per play
 * @param type - The type of sound to play
 */
export function playSound(type: SoundType): void {
  if (IS_DEV_AUDIO_DISABLED) return;
  if (useAudioStore.getState().isMuted) return;
  if (typeof window === 'undefined') return;

  // Only the sound needed now is created on demand; the rest preloads in the background.
  const audio = loadSound(type);
  if (!isInitialized) initSounds();

  audio.currentTime = 0;
  audio.volume = SOUND_VOLUMES[type];
  audio.play().catch((error) => {
    console.debug('Sound playback failed:', error.message);
  });
}

/**
 * Initialize background music (lazy, called on first play)
 */
function initBackgroundMusic(): HTMLAudioElement {
  if (!backgroundMusic) {
    backgroundMusic = new Audio(BACKGROUND_MUSIC_PATH);
    backgroundMusic.loop = true;
    backgroundMusic.volume = BACKGROUND_VOLUME;
    backgroundMusic.preload = 'auto';
  }
  return backgroundMusic;
}

/**
 * Start playing background music
 */
export function playBackgroundMusic(): void {
  if (IS_DEV_AUDIO_DISABLED) return;
  if (useAudioStore.getState().isMuted) return;
  if (typeof window === 'undefined') return;

  const music = initBackgroundMusic();
  const playPromise = music.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isMusicPlaying = true;
      })
      .catch((error) => {
        console.debug('Background music failed:', error.message);
      });
  }
}

/**
 * Pause background music
 */
export function pauseBackgroundMusic(): void {
  if (backgroundMusic) {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
}

/**
 * Toggle background music on/off
 */
export function toggleBackgroundMusic(): boolean {
  if (IS_DEV_AUDIO_DISABLED) return false;
  if (isMusicPlaying) {
    pauseBackgroundMusic();
    return false;
  } else {
    playBackgroundMusic();
    return true;
  }
}

/**
 * Check if background music is currently playing
 */
export function isBackgroundMusicPlaying(): boolean {
  return isMusicPlaying;
}

/**
 * Hook for playing whoosh sound on slide transitions
 */
export const useSlideTransitionSound = createSlideTransitionSoundHook(playSound);

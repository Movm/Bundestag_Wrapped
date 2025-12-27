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
import { useAudioStore } from '@/stores/audioStore';

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
if (typeof window !== 'undefined') {
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
}

/**
 * Initialize and preload all sounds.
 * Call this on first user interaction to comply with autoplay policies.
 */
export function initSounds(): void {
  if (isInitialized) return;

  Object.entries(SOUND_PATHS).forEach(([type, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.load();
    audioCache[type as SoundType] = audio;
  });

  isInitialized = true;
}

/**
 * Play a sound effect
 * Uses cached audio elements for efficiency - no new allocations per play
 * @param type - The type of sound to play
 */
export function playSound(type: SoundType): void {
  if (useAudioStore.getState().isMuted) return;
  if (typeof window === 'undefined') return;

  // Initialize on first play if not already done
  if (!isInitialized) {
    initSounds();
  }

  // Use cached audio element - reset position and play
  const audio = audioCache[type];
  if (!audio) return;

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

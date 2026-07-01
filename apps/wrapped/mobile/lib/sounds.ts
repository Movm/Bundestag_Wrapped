/**
 * Sound System for Bundestag Wrapped (Mobile/Expo)
 *
 * Provides audio feedback for quiz interactions:
 * - click: Button tap feedback
 * - correct: Success fanfare for right answers
 * - wrong: Error sound for wrong answers
 * - whoosh: Slide transition sound
 *
 * Features:
 * - Preloads sounds on app start
 * - Mute state from Zustand store (single source of truth)
 * - Uses expo-audio for native audio playback
 * - Shares types with web via @/shared/sounds
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import {
  type SoundType,
  SOUND_VOLUMES,
  createSlideTransitionSoundHook,
} from '@/shared/sounds';
import { useAppStore } from '~/stores/appStore';

export type { SoundType };

// Sound file requires - must use require() for bundling
// Uses public/sounds/ via Metro's watchFolders configuration
const SOUND_FILES: Partial<Record<SoundType, ReturnType<typeof require>>> = {
  click: require('../../public/sounds/click.wav'),
  correct: require('../../public/sounds/correct.wav'),
  wrong: require('../../public/sounds/wrong.wav'),
  whoosh: require('../../public/sounds/whoosh.mp3'),
  // Note: 'start' is not used on mobile (no start button)
};

// Preloaded audio players
const audioPlayers: Partial<Record<SoundType, AudioPlayer>> = {};
let isInitialized = false;

/**
 * Initialize and preload all sounds.
 * Call this early in app startup.
 */
export async function initSounds(): Promise<void> {
  if (isInitialized) return;

  try {
    // Configure audio mode for mixing with other audio
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
    } catch (audioModeError) {
      console.warn('Failed to set audio mode:', audioModeError);
      // Continue anyway - sounds might still work
    }

    // Preload all sounds
    await Promise.allSettled(
      (Object.keys(SOUND_FILES) as SoundType[]).map(async (type) => {
        const file = SOUND_FILES[type];
        if (!file) return;

        try {
          const player = createAudioPlayer(file);
          player.volume = SOUND_VOLUMES[type];
          audioPlayers[type] = player;
        } catch (error) {
          console.warn(`Failed to load sound ${type}:`, error);
        }
      })
    );

    isInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize sounds:', error);
    isInitialized = true; // Mark as initialized to prevent retry loops
  }
}

/**
 * Play a sound effect
 * @param type - The type of sound to play
 */
export async function playSound(type: SoundType): Promise<void> {
  // Read mute state from Zustand store (single source of truth)
  if (useAppStore.getState().isMuted) return;

  // Initialize on first play if not already done
  if (!isInitialized) {
    await initSounds();
  }

  const player = audioPlayers[type];
  if (!player) return;

  try {
    // Rewind to start and play
    player.seekTo(0);
    player.play();
  } catch (error) {
    // Silently fail - audio might not be available
  }
}

/**
 * Cleanup sounds when app closes
 */
export async function unloadSounds(): Promise<void> {
  await Promise.all(
    Object.values(audioPlayers).map(async (player) => {
      if (player) {
        try {
          player.release();
        } catch {
          // Ignore errors
        }
      }
    })
  );
}

/**
 * Hook for playing whoosh sound on slide transitions
 */
export const useSlideTransitionSound = createSlideTransitionSoundHook(playSound);

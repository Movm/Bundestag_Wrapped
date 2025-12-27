/**
 * Theme Music Manager for Bundestag Wrapped (Mobile/Expo)
 *
 * Mobile-specific implementation using expo-audio.
 * Uses shared types from @/shared/theme-music.
 *
 * Features:
 * - LAZY LOADING: Only loads tracks when needed (not all 13 at startup)
 * - Preloads next section's theme for seamless transitions
 * - Crossfade between themes using expo-audio
 * - Continuous looping within sections
 * - Respects mute state from AsyncStorage
 */

import React from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import {
  type ThemeType,
  THEME_TRACK_INFO,
  THEME_VOLUME,
  CROSSFADE_DURATION,
  getThemeForSlide,
  SECTION_THEMES,
} from '@/shared/theme-music';
import { useAppStore } from '~/stores/appStore';

// Re-export shared types and functions
export { type ThemeType, THEME_TRACK_INFO, getThemeForSlide } from '@/shared/theme-music';

// Lazy-loaded theme sources - require() is evaluated when getThemeSource() is called
// This defers the audio file loading until actually needed
function getThemeSource(theme: ThemeType): ReturnType<typeof require> | null {
  switch (theme) {
    case 'night':
      return require('../../public/sounds/broke-for-free-night-owl.mp3');
    case 'mutant':
      return require('../../public/sounds/holiznacc0-mutant-club.mp3');
    case 'starling':
      return require('../../public/sounds/podington-bear-starling.mp3');
    case 'industrial':
      return require('../../public/sounds/ikillya-godsize.mp3');
    case 'spacey':
      return require('../../public/sounds/chromix-i-know-youre-out-there.mp3');
    case 'playful':
      return require('../../public/sounds/kidkanevil-dza-nuff-stickers.mp3');
    case 'chiptune':
      return require('../../public/sounds/kevin-macleod-hyperfun.mp3');
    case 'loveice':
      return require('../../public/sounds/lopkerjo-love-others-ice.mp3');
    case 'popular':
      return require('../../public/sounds/sarah-rasines-cancion-popular.mp3');
    case 'reverse':
      return require('../../public/sounds/broke-for-free-living-in-reverse.mp3');
    case 'reflections':
      return require('../../public/sounds/jonas-the-plugexpert-apc-reflections-gobot-rmx.mp3');
    case 'hustle':
      return require('../../public/sounds/kevin-macleod-hustle.mp3');
    case 'rhodes':
      return require('../../public/sounds/kevin-macleod-dirt-rhodes.mp3');
    default:
      return null;
  }
}

// Section order for next-theme prediction
const SECTION_ORDER: string[] = [
  'topics',
  'vocabulary',
  'speeches',
  'drama',
  'discriminatory',
  'common-words',
  'moin',
  'swiftie',
  'tone',
  'gender',
  'share',
  'finale',
];

/**
 * Get the next theme to preload based on current slide
 */
function getNextTheme(currentSlide: string): ThemeType | null {
  // Extract section from slide ID
  const section = currentSlide.replace(/^(intro|quiz|info|reveal|chart)-/, '');
  const currentIndex = SECTION_ORDER.indexOf(section);

  if (currentIndex === -1 || currentIndex >= SECTION_ORDER.length - 1) {
    return null; // No next section or unknown
  }

  const nextSection = SECTION_ORDER[currentIndex + 1];
  return SECTION_THEMES[nextSection] || null;
}

const FADE_STEPS = 20;
const STEP_DURATION = CROSSFADE_DURATION / FADE_STEPS;

/**
 * Theme Music Manager class for mobile - with LAZY LOADING
 */
class ThemeMusicManager {
  private currentTheme: ThemeType | null = null;
  private currentSlide: string | null = null;
  private audioPlayers: Map<ThemeType, AudioPlayer> = new Map();
  private loadingThemes: Set<ThemeType> = new Set();
  private audioModeSet = false;
  private isTransitioning = false;
  private fadeTimeouts: ReturnType<typeof setTimeout>[] = [];
  private fadeGeneration = 0; // Cancellation token for in-flight fades

  /**
   * Ensure audio mode is configured (only once)
   */
  private async ensureAudioMode(): Promise<void> {
    if (this.audioModeSet) return;

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
      this.audioModeSet = true;
    } catch (error) {
      console.warn('Failed to set audio mode:', error);
      this.audioModeSet = true; // Prevent retry loops
    }
  }

  /**
   * Load a single theme track on-demand
   * Returns cached player if already loaded
   */
  private async loadTheme(theme: ThemeType): Promise<AudioPlayer | null> {
    // Return cached player
    if (this.audioPlayers.has(theme)) {
      return this.audioPlayers.get(theme)!;
    }

    // Prevent duplicate loading
    if (this.loadingThemes.has(theme)) {
      // Wait for existing load to complete
      while (this.loadingThemes.has(theme)) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.audioPlayers.get(theme) || null;
    }

    this.loadingThemes.add(theme);

    try {
      await this.ensureAudioMode();

      const source = getThemeSource(theme);
      if (!source) {
        this.loadingThemes.delete(theme);
        return null;
      }

      const player = createAudioPlayer(source);
      player.loop = true;
      player.volume = 0;

      this.audioPlayers.set(theme, player);
      this.loadingThemes.delete(theme);

      return player;
    } catch (error) {
      console.warn(`Failed to load theme ${theme}:`, error);
      this.loadingThemes.delete(theme);
      return null;
    }
  }

  /**
   * Preload next theme in background (non-blocking)
   */
  private preloadNextTheme(currentSlide: string): void {
    const nextTheme = getNextTheme(currentSlide);
    if (nextTheme && !this.audioPlayers.has(nextTheme)) {
      // Fire and forget - don't await
      this.loadTheme(nextTheme).catch(() => {
        // Silently fail preloading
      });
    }
  }

  /**
   * Play a theme (crossfade from current if different)
   * Now with lazy loading - only loads the needed track
   */
  async playTheme(theme: ThemeType, slideId?: string): Promise<void> {
    // Read mute state from Zustand store (single source of truth)
    if (useAppStore.getState().isMuted) return;

    // Store current slide for preloading logic
    if (slideId) {
      this.currentSlide = slideId;
    }

    // Skip if already playing this theme
    if (theme === this.currentTheme) return;

    // If already transitioning, force stop everything first
    if (this.isTransitioning) {
      await this.forceStopAll();
    }

    this.isTransitioning = true;

    // Load the theme on-demand (lazy loading!)
    const player = await this.loadTheme(theme);
    if (!player) {
      this.isTransitioning = false;
      return;
    }

    await this.crossfadeTo(theme);

    // Preload next theme in background after starting current
    if (this.currentSlide) {
      this.preloadNextTheme(this.currentSlide);
    }
  }

  /**
   * Force stop all audio immediately
   * Uses generation counter to invalidate any in-flight fade callbacks
   */
  private async forceStopAll(): Promise<void> {
    // Increment generation to invalidate in-flight fades
    this.fadeGeneration++;

    // Clear all pending fade timeouts (mutate, don't replace array)
    this.fadeTimeouts.forEach(clearTimeout);
    this.fadeTimeouts.length = 0;

    // Stop all players
    this.audioPlayers.forEach((player) => {
      try {
        player.pause();
        player.volume = 0;
        player.seekTo(0);
      } catch {
        // Ignore errors
      }
    });
  }

  /**
   * Crossfade from current theme to new theme
   */
  private async crossfadeTo(newTheme: ThemeType): Promise<void> {
    const oldTheme = this.currentTheme;
    const newPlayer = this.audioPlayers.get(newTheme);

    if (!newPlayer) {
      this.isTransitioning = false;
      return;
    }

    // Set current theme first to prevent race conditions
    this.currentTheme = newTheme;

    // Stop all players except old and new
    this.audioPlayers.forEach((player, theme) => {
      if (theme !== newTheme && theme !== oldTheme) {
        try {
          player.pause();
          player.volume = 0;
        } catch {
          // Ignore errors
        }
      }
    });

    // Fade out old theme
    if (oldTheme && oldTheme !== newTheme) {
      this.fadeOut(oldTheme);
    }

    // Start new theme and fade in
    try {
      newPlayer.volume = 0;
      newPlayer.seekTo(0);
      newPlayer.play();
      this.fadeIn(newTheme);
    } catch (error) {
      console.debug('Theme music failed to start:', error);
      this.isTransitioning = false;
    }
  }

  /**
   * Fade in a theme to target volume
   * Uses generation counter to abort if forceStopAll was called
   */
  private fadeIn(theme: ThemeType): void {
    const player = this.audioPlayers.get(theme);
    if (!player) return;

    const fadeGen = this.fadeGeneration; // Capture current generation
    let currentStep = 0;
    const volumeStep = THEME_VOLUME / FADE_STEPS;

    const fade = () => {
      // Abort if this fade has been invalidated by forceStopAll
      if (fadeGen !== this.fadeGeneration) return;

      currentStep++;
      const newVolume = Math.min(volumeStep * currentStep, THEME_VOLUME);

      try {
        player.volume = newVolume;
      } catch {
        return; // Player error, abort fade
      }

      if (currentStep >= FADE_STEPS) {
        // Fade complete - ensure only this theme is playing
        if (fadeGen === this.fadeGeneration) {
          this.stopAllExcept(theme);
          this.isTransitioning = false;
        }
      } else {
        const timeout = setTimeout(fade, STEP_DURATION);
        this.fadeTimeouts.push(timeout);
      }
    };

    const timeout = setTimeout(fade, STEP_DURATION);
    this.fadeTimeouts.push(timeout);
  }

  /**
   * Fade out a theme to silence
   * Uses generation counter to abort if forceStopAll was called
   */
  private fadeOut(theme: ThemeType): void {
    const player = this.audioPlayers.get(theme);
    if (!player) return;

    const fadeGen = this.fadeGeneration; // Capture current generation
    let currentStep = 0;
    const startVolume = THEME_VOLUME;
    const volumeStep = startVolume / FADE_STEPS;

    const fade = () => {
      // Abort if this fade has been invalidated by forceStopAll
      if (fadeGen !== this.fadeGeneration) return;

      currentStep++;
      const newVolume = Math.max(startVolume - volumeStep * currentStep, 0);

      try {
        player.volume = newVolume;
      } catch {
        return; // Player error, abort fade
      }

      if (currentStep >= FADE_STEPS) {
        if (fadeGen === this.fadeGeneration) {
          try {
            player.pause();
            player.seekTo(0);
          } catch {
            // Ignore errors
          }
        }
      } else {
        const timeout = setTimeout(fade, STEP_DURATION);
        this.fadeTimeouts.push(timeout);
      }
    };

    const timeout = setTimeout(fade, STEP_DURATION);
    this.fadeTimeouts.push(timeout);
  }

  /**
   * Stop all tracks except the specified one
   */
  private stopAllExcept(theme: ThemeType): void {
    this.audioPlayers.forEach((player, t) => {
      if (t !== theme) {
        try {
          if (!player.paused) {
            player.pause();
            player.volume = 0;
          }
        } catch {
          // Ignore errors
        }
      }
    });
  }

  /**
   * Pause current theme
   */
  pause(): void {
    if (this.currentTheme) {
      const player = this.audioPlayers.get(this.currentTheme);
      if (player) {
        try {
          player.pause();
        } catch {
          // Ignore errors
        }
      }
    }
  }

  /**
   * Resume current theme
   */
  resume(): void {
    // Read mute state from Zustand store (single source of truth)
    if (useAppStore.getState().isMuted) return;

    if (this.currentTheme) {
      const player = this.audioPlayers.get(this.currentTheme);
      if (player) {
        try {
          player.volume = THEME_VOLUME;
          player.play();
        } catch {
          // Ignore errors
        }
      }
    }
  }

  /**
   * Stop all themes
   */
  stop(): void {
    this.fadeGeneration++; // Invalidate any in-flight fades
    this.fadeTimeouts.forEach(clearTimeout);
    this.fadeTimeouts.length = 0; // Mutate, don't replace

    this.audioPlayers.forEach((player) => {
      try {
        player.pause();
        player.volume = 0;
        player.seekTo(0);
      } catch {
        // Ignore errors
      }
    });

    this.currentTheme = null;
    this.currentSlide = null;
  }

  /**
   * Get current playing theme
   */
  getCurrentTheme(): ThemeType | null {
    return this.currentTheme;
  }

  /**
   * Cleanup sounds - release all loaded players
   */
  unload(): void {
    this.stop();

    this.audioPlayers.forEach((player) => {
      try {
        player.release();
      } catch {
        // Ignore errors
      }
    });

    this.audioPlayers.clear();
    this.loadingThemes.clear();
    this.audioModeSet = false;
  }

  /**
   * Get number of loaded themes (for debugging)
   */
  getLoadedThemeCount(): number {
    return this.audioPlayers.size;
  }
}

// Export singleton instance
export const themeMusic = new ThemeMusicManager();

/**
 * Hook for using theme music with slide changes
 *
 * Uses useEffect to trigger music on slide transitions.
 * Handles cleanup when component unmounts.
 * Also updates the ThemeMusicContext for UI display.
 */
export function useThemeMusic(
  currentSlide: string | null,
  setCurrentTheme?: (theme: ThemeType | null) => void
): void {
  React.useEffect(() => {
    if (!currentSlide) return;

    const theme = getThemeForSlide(currentSlide);
    // Pass slideId for preloading logic
    themeMusic.playTheme(theme, currentSlide);
    setCurrentTheme?.(theme);
  }, [currentSlide, setCurrentTheme]);

  // Note: No cleanup on unmount - audio lifecycle is managed at the provider level.
  // Stopping audio here would cause music to stop when switching tabs,
  // since expo-router unmounts inactive tab screens by default.
}

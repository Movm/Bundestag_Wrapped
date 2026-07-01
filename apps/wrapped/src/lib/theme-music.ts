/**
 * Theme Music Manager for Bundestag Wrapped (Web)
 *
 * Web-specific implementation using browser Audio API.
 * Uses shared types from @/shared/theme-music.
 *
 * Features:
 * - LAZY LOADING: Only loads tracks when needed (not all 13 at startup)
 * - Preloads next section's theme for seamless transitions
 * - Crossfade between themes using browser Audio API
 *
 * Sound Files Inventory (public/sounds/):
 * All files use kebab-case names for Metro/asset bundler compatibility.
 * See THEME_PATHS in @/shared/theme-music/types.ts for file mappings.
 */

import { useEffect, useRef } from 'react';
import type { SlideType } from '@/components/main-wrapped/constants';
import { useAudioStore } from '@/stores/audioStore';
import {
  type ThemeType,
  THEME_PATHS,
  THEME_VOLUME,
  CROSSFADE_DURATION,
  SECTION_THEMES,
  getThemeForSlide as getThemeForSlideShared,
} from '@/shared/theme-music';

// Re-export shared types and constants for backwards compatibility
export { type ThemeType, THEME_TRACK_INFO } from '@/shared/theme-music';

const FADE_STEPS = 20; // Smooth fade with 20 steps

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
  const section = currentSlide.replace(/^(intro|quiz|info|reveal|chart)-/, '');
  const currentIndex = SECTION_ORDER.indexOf(section);

  if (currentIndex === -1 || currentIndex >= SECTION_ORDER.length - 1) {
    return null;
  }

  const nextSection = SECTION_ORDER[currentIndex + 1];
  return SECTION_THEMES[nextSection] || null;
}

/**
 * Get the theme type for a given slide
 */
export function getThemeForSlide(slideId: SlideType): ThemeType {
  return getThemeForSlideShared(slideId);
}

/**
 * Theme Music Manager class
 * Singleton that handles crossfading between section themes with LAZY LOADING
 */
class ThemeMusicManager {
  private currentTheme: ThemeType | null = null;
  private currentSlide: string | null = null;
  private audioElements: Map<ThemeType, HTMLAudioElement> = new Map();
  private loadingThemes: Set<ThemeType> = new Set();
  private fadeIntervals: Map<ThemeType, number> = new Map();
  private isTransitioning = false;

  /**
   * Load a single theme track on-demand (LAZY LOADING)
   * Returns cached audio element if already loaded
   */
  private async loadTheme(theme: ThemeType): Promise<HTMLAudioElement | null> {
    if (typeof window === 'undefined') return null;

    // Return cached audio element
    if (this.audioElements.has(theme)) {
      return this.audioElements.get(theme)!;
    }

    // Prevent duplicate loading
    if (this.loadingThemes.has(theme)) {
      // Wait for existing load to complete
      while (this.loadingThemes.has(theme)) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.audioElements.get(theme) || null;
    }

    this.loadingThemes.add(theme);

    try {
      const path = THEME_PATHS[theme];
      if (!path) {
        this.loadingThemes.delete(theme);
        return null;
      }

      const audio = new Audio(path);
      audio.loop = true;
      audio.volume = 0;
      audio.preload = 'auto';

      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        audio.addEventListener('error', () => reject(new Error('Failed to load')), { once: true });
        audio.load();
      });

      this.audioElements.set(theme, audio);
      this.loadingThemes.delete(theme);

      return audio;
    } catch (error) {
      console.debug(`Failed to load theme ${theme}:`, error);
      this.loadingThemes.delete(theme);
      return null;
    }
  }

  /**
   * Preload next theme in background (non-blocking)
   */
  private preloadNextTheme(currentSlide: string): void {
    const nextTheme = getNextTheme(currentSlide);
    if (nextTheme && !this.audioElements.has(nextTheme)) {
      // Fire and forget - don't await
      this.loadTheme(nextTheme).catch(() => {});
    }
  }

  /**
   * Play a theme (crossfade from current if different)
   * Now with lazy loading - only loads the needed track
   */
  async playTheme(theme: ThemeType, slideId?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (useAudioStore.getState().isMuted) return;

    // Store current slide for preloading logic
    if (slideId) {
      this.currentSlide = slideId;
    }

    // Skip if already playing this theme
    if (theme === this.currentTheme) return;

    // If already transitioning (rapid scroll), force stop everything first
    if (this.isTransitioning) {
      this.forceStopAll();
    }

    this.isTransitioning = true;

    // Load the theme on-demand (lazy loading!)
    const audio = await this.loadTheme(theme);
    if (!audio) {
      this.isTransitioning = false;
      return;
    }

    this.crossfadeTo(theme);

    // Update store so UI components can react to theme changes
    useAudioStore.getState().setCurrentTheme(theme);

    // Preload next theme in background after starting current
    if (this.currentSlide) {
      this.preloadNextTheme(this.currentSlide);
    }
  }

  /**
   * Force stop all audio immediately (for rapid scrolling)
   */
  private forceStopAll(): void {
    this.fadeIntervals.forEach((interval) => clearInterval(interval));
    this.fadeIntervals.clear();
    this.audioElements.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    });
  }

  /**
   * Crossfade from current theme to new theme
   */
  private crossfadeTo(newTheme: ThemeType): void {
    const oldTheme = this.currentTheme;
    const newAudio = this.audioElements.get(newTheme);

    if (!newAudio) return;

    // FIRST: Set currentTheme to prevent race conditions
    this.currentTheme = newTheme;

    // Stop ALL tracks except the new one and the one we're fading out
    this.audioElements.forEach((audio, theme) => {
      if (theme !== newTheme && theme !== oldTheme) {
        const fade = this.fadeIntervals.get(theme);
        if (fade) clearInterval(fade);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
      }
    });

    // Clear any existing fade for the new theme
    const existingFade = this.fadeIntervals.get(newTheme);
    if (existingFade) {
      clearInterval(existingFade);
    }

    // Fade out old theme if playing
    if (oldTheme && oldTheme !== newTheme) {
      this.fadeOut(oldTheme);
    }

    // Start new theme at 0 volume and fade in
    newAudio.volume = 0;
    newAudio.currentTime = 0;

    const playPromise = newAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.fadeIn(newTheme);
        })
        .catch((error) => {
          console.debug('Theme music failed to start:', error.message);
        });
    }
  }

  /**
   * Fade in a theme to target volume
   */
  private fadeIn(theme: ThemeType): void {
    const audio = this.audioElements.get(theme);
    if (!audio) return;

    const stepDuration = CROSSFADE_DURATION / FADE_STEPS;
    const volumeStep = THEME_VOLUME / FADE_STEPS;
    let currentStep = 0;

    const interval = window.setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, THEME_VOLUME);

      if (currentStep >= FADE_STEPS) {
        clearInterval(interval);
        this.fadeIntervals.delete(theme);

        // SAFETY: After fade completes, ensure no other tracks are playing
        this.stopAllExcept(theme);

        // Clear transitioning flag
        this.isTransitioning = false;
      }
    }, stepDuration);

    this.fadeIntervals.set(theme, interval);
  }

  /**
   * Stop all tracks except the specified one (safety mechanism)
   */
  private stopAllExcept(theme: ThemeType): void {
    this.audioElements.forEach((audio, t) => {
      if (t !== theme && !audio.paused) {
        const fade = this.fadeIntervals.get(t);
        if (fade) clearInterval(fade);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
      }
    });
  }

  /**
   * Fade out a theme to silence and pause
   */
  private fadeOut(theme: ThemeType): void {
    const audio = this.audioElements.get(theme);
    if (!audio) return;

    // Clear any existing fade for this theme
    const existingFade = this.fadeIntervals.get(theme);
    if (existingFade) {
      clearInterval(existingFade);
    }

    const stepDuration = CROSSFADE_DURATION / FADE_STEPS;
    const startVolume = audio.volume;
    const volumeStep = startVolume / FADE_STEPS;
    let currentStep = 0;

    const interval = window.setInterval(() => {
      currentStep++;
      audio.volume = Math.max(startVolume - volumeStep * currentStep, 0);

      if (currentStep >= FADE_STEPS) {
        clearInterval(interval);
        this.fadeIntervals.delete(theme);
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepDuration);

    this.fadeIntervals.set(theme, interval);
  }

  /**
   * Pause current theme (preserves position)
   */
  pause(): void {
    if (this.currentTheme) {
      const audio = this.audioElements.get(this.currentTheme);
      if (audio) {
        audio.pause();
      }
    }
  }

  /**
   * Resume current theme
   */
  resume(): void {
    if (useAudioStore.getState().isMuted) return;

    if (this.currentTheme) {
      const audio = this.audioElements.get(this.currentTheme);
      if (audio) {
        audio.volume = THEME_VOLUME;
        audio.play().catch((error) => {
          console.debug('Theme resume failed:', error.message);
        });
      }
    }
  }

  /**
   * Stop all themes (for finale or mute)
   */
  stop(): void {
    this.audioElements.forEach((audio, theme) => {
      const fade = this.fadeIntervals.get(theme);
      if (fade) clearInterval(fade);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    });
    this.fadeIntervals.clear();
    this.currentTheme = null;
    this.currentSlide = null;

    // Clear theme in store
    useAudioStore.getState().setCurrentTheme(null);
  }

  /**
   * Get current playing theme
   */
  getCurrentTheme(): ThemeType | null {
    return this.currentTheme;
  }

  /**
   * Check if a theme is currently playing
   */
  isPlaying(): boolean {
    if (!this.currentTheme) return false;
    const audio = this.audioElements.get(this.currentTheme);
    return audio ? !audio.paused : false;
  }

  /**
   * Cleanup all audio resources
   * Call when leaving the wrapped experience to release memory
   */
  cleanup(): void {
    this.stop();

    // Release all audio elements
    this.audioElements.forEach((audio) => {
      audio.pause();
      audio.src = ''; // Release network resources
      audio.load(); // Reset audio element
    });

    this.audioElements.clear();
    this.fadeIntervals.clear();
    this.loadingThemes.clear();
    this.currentTheme = null;
    this.currentSlide = null;
  }
}

// Export singleton instance
export const themeMusic = new ThemeMusicManager();

/**
 * React hook for using theme music with slide changes
 * Properly uses useEffect to trigger music only on actual slide transitions
 */
export function useThemeMusic(currentSlide: SlideType | null): void {
  const prevSlideRef = useRef<SlideType | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentSlide) return;

    // Only play if slide actually changed (prevents unnecessary calls)
    if (prevSlideRef.current === currentSlide) return;
    prevSlideRef.current = currentSlide;

    const theme = getThemeForSlide(currentSlide);
    themeMusic.playTheme(theme);
  }, [currentSlide]);
}

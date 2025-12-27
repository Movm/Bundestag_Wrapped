/**
 * Unified App Store - Zustand-based state management
 *
 * Consolidates ThemeMusicContext + LayoutContext + BackgroundContext
 * into a single store with selective subscriptions for optimal performance.
 *
 * Benefits over React Context:
 * - Components only re-render when their specific slice of state changes
 * - No provider wrapping needed
 * - Better performance for high-frequency updates (scroll, music changes)
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ThemeType, THEME_TRACK_INFO } from '@/shared/theme-music';
import {
  getBackgroundTheme,
  THEME_BACKGROUNDS,
  type BackgroundTheme,
  type ThemeConfig,
} from '@/shared';

// ─────────────────────────────────────────────────────────────
// Constants (from LayoutContext)
// ─────────────────────────────────────────────────────────────

/** Tab bar height - floating tab bar is transparent overlay, no reserved space needed */
export const TAB_BAR_HEIGHT = 0;

/** Header height - set to 0 as header is hidden */
export const HEADER_HEIGHT = 0;

// Default accent color (pink-500)
const DEFAULT_ACCENT = '#ec4899';

// AsyncStorage key for mute state persistence
const MUTE_STORAGE_KEY = 'bundestag-wrapped-sound-muted';

// Memoization cache for accent colors (slide -> hex color)
const accentColorCache = new Map<string, string>();

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TrackInfo {
  title: string;
  artist: string;
}

interface AppState {
  // Theme Music State
  currentTheme: ThemeType | null;
  currentSlide: string | null;
  isMuted: boolean;

  // Layout State
  screenWidth: number;
  screenHeight: number;
  availableHeight: number;
  topInset: number;
  bottomInset: number;

  // Accessibility State
  reducedMotion: boolean;

  // Actions
  setCurrentTheme: (theme: ThemeType | null) => void;
  setCurrentSlide: (slideId: string | null) => void;
  setMuted: (muted: boolean) => Promise<void>;
  toggleMute: () => Promise<boolean>;
  initMuteState: () => Promise<void>;
  setReducedMotion: (reduced: boolean) => void;
  updateLayout: (
    screenWidth: number,
    screenHeight: number,
    topInset: number,
    bottomInset: number
  ) => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Convert RGB string "236, 72, 153" to hex "#ec4899"
 */
function rgbToHex(rgb: string): string {
  const [r, g, b] = rgb.split(',').map((s) => parseInt(s.trim(), 10));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');

export const useAppStore = create<AppState>((set, get) => ({
  // Theme Music State
  currentTheme: null,
  currentSlide: null,
  isMuted: false,

  // Layout State
  screenWidth: width,
  screenHeight: height,
  availableHeight: height - HEADER_HEIGHT - TAB_BAR_HEIGHT,
  topInset: 0,
  bottomInset: 0,

  // Accessibility State
  reducedMotion: false,

  // Actions
  setCurrentTheme: (theme) => set({ currentTheme: theme }),
  setCurrentSlide: (slideId) => set({ currentSlide: slideId }),

  // Mute state with AsyncStorage persistence
  setMuted: async (muted) => {
    set({ isMuted: muted });
    try {
      await AsyncStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch (error) {
      console.warn('Failed to save mute state:', error);
    }
  },

  toggleMute: async () => {
    const newMuted = !get().isMuted;
    set({ isMuted: newMuted });
    try {
      await AsyncStorage.setItem(MUTE_STORAGE_KEY, String(newMuted));
    } catch (error) {
      console.warn('Failed to save mute state:', error);
    }
    return newMuted;
  },

  initMuteState: async () => {
    try {
      const value = await AsyncStorage.getItem(MUTE_STORAGE_KEY);
      if (value !== null) {
        set({ isMuted: value === 'true' });
      }
    } catch (error) {
      console.warn('Failed to load mute state:', error);
    }
  },

  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
  updateLayout: (screenWidth, screenHeight, topInset, bottomInset) =>
    set({
      screenWidth,
      screenHeight,
      availableHeight: screenHeight - HEADER_HEIGHT - TAB_BAR_HEIGHT,
      topInset,
      bottomInset,
    }),
}));

// ─────────────────────────────────────────────────────────────
// Selective Selectors
// Components only re-render when their specific data changes
// ─────────────────────────────────────────────────────────────

/**
 * Get current track info (title, artist)
 * Only re-renders when theme changes (every 7-8 slides)
 */
export function useTrackInfo(): TrackInfo | null {
  return useAppStore((s) =>
    s.currentTheme ? THEME_TRACK_INFO[s.currentTheme] : null
  );
}

/**
 * Get accent color for dynamic UI theming
 * Only re-renders when background theme changes
 * Uses memoization cache to avoid redundant computation
 */
export function useAccentColor(): string {
  return useAppStore((s) => {
    if (!s.currentSlide) return DEFAULT_ACCENT;

    // Check cache first
    let color = accentColorCache.get(s.currentSlide);
    if (!color) {
      const backgroundTheme = getBackgroundTheme(s.currentSlide);
      const themeConfig = THEME_BACKGROUNDS[backgroundTheme];
      color = rgbToHex(themeConfig.colors.primary);
      accentColorCache.set(s.currentSlide, color);
    }
    return color;
  });
}

/**
 * Get mute state
 * Only re-renders when mute toggles
 */
export function useMuted(): boolean {
  return useAppStore((s) => s.isMuted);
}

/**
 * Get reduced motion preference
 * Only re-renders when accessibility setting changes
 */
export function useReducedMotion(): boolean {
  return useAppStore((s) => s.reducedMotion);
}

/**
 * Layout dimension selectors - return primitives to avoid infinite re-render loops.
 * Each selector subscribes to exactly one value for optimal performance.
 */
export function useScreenWidth(): number {
  return useAppStore((s) => s.screenWidth);
}

export function useScreenHeight(): number {
  return useAppStore((s) => s.screenHeight);
}

export function useAvailableHeight(): number {
  return useAppStore((s) => s.availableHeight);
}

export function useTopInset(): number {
  return useAppStore((s) => s.topInset);
}

export function useBottomInset(): number {
  return useAppStore((s) => s.bottomInset);
}

/**
 * Get background theme config for a specific slide
 * Used by BackgroundSystem to render effects
 * Memoized to prevent object recreation on every render
 */
export function useBackgroundTheme(slideId: string): {
  currentTheme: BackgroundTheme;
  themeConfig: ThemeConfig;
  reducedMotion: boolean;
} {
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  // Memoize to prevent new object on every render
  return useMemo(() => {
    const currentTheme = getBackgroundTheme(slideId);
    const themeConfig = THEME_BACKGROUNDS[currentTheme];
    return { currentTheme, themeConfig, reducedMotion };
  }, [slideId, reducedMotion]);
}

/**
 * Get theme colors as RGBA strings for use in styles
 */
export function useThemeColors(slideId: string, opacity: number = 1) {
  const { themeConfig } = useBackgroundTheme(slideId);
  const { colors } = themeConfig;

  return {
    primary: `rgba(${colors.primary}, ${opacity})`,
    secondary: `rgba(${colors.secondary}, ${opacity})`,
    accent: `rgba(${colors.accent}, ${opacity})`,
    glow: `rgba(${colors.glow}, ${opacity})`,
  };
}

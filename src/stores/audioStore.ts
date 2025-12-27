/**
 * Audio Store - Zustand-based state management for audio
 *
 * Consolidates mute state and theme music tracking into a single store
 * with selective subscriptions for optimal performance.
 *
 * Benefits over module singletons:
 * - Components automatically re-render when state changes
 * - No manual sync between global and local state
 * - Consistent pattern with mobile app
 */

import { create } from 'zustand';
import { type ThemeType, THEME_TRACK_INFO } from '@/shared/theme-music';

const STORAGE_KEY = 'bundestag-wrapped-sound-muted';

interface AudioState {
  // State
  isMuted: boolean;
  currentTheme: ThemeType | null;

  // Actions
  setMuted: (muted: boolean) => void;
  toggleMute: () => boolean;
  setCurrentTheme: (theme: ThemeType | null) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isMuted:
    typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY) === 'true'
      : false,
  currentTheme: null,

  setMuted: (muted) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(muted));
    }
    set({ isMuted: muted });
  },

  toggleMute: () => {
    const newMuted = !get().isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(newMuted));
    }
    set({ isMuted: newMuted });
    return newMuted;
  },

  setCurrentTheme: (theme) => set({ currentTheme: theme }),
}));

// ─────────────────────────────────────────────────────────────
// Selectors - Components only re-render when their specific data changes
// ─────────────────────────────────────────────────────────────

/**
 * Get mute state
 * Only re-renders when mute toggles
 */
export const useMuted = () => useAudioStore((s) => s.isMuted);

/**
 * Get current theme
 * Only re-renders when theme changes
 */
export const useCurrentTheme = () => useAudioStore((s) => s.currentTheme);

/**
 * Get current track info (title, artist)
 * Only re-renders when theme changes
 */
export const useTrackInfo = () =>
  useAudioStore((s) =>
    s.currentTheme ? THEME_TRACK_INFO[s.currentTheme] : null
  );

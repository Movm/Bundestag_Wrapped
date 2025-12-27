/**
 * Zustand store for scroll/navigation state
 *
 * This store manages the scroll state for the wrapped experience:
 * - Current index tracking
 * - Started/not started state
 * - Quiz answered tracking
 *
 * All actions are accessed via getState() for STABLE references.
 * This eliminates the re-render cascade that was happening when
 * useWrappedScroll returned a new object on every render.
 */

import { create } from 'zustand';
import { FlatList } from 'react-native';

interface ScrollState {
  // State
  currentIndex: number;
  hasStarted: boolean;
  answeredItems: Set<number>;

  // Actions (accessed via getState() for stability)
  setCurrentIndex: (index: number) => void;
  setHasStarted: (started: boolean) => void;
  addAnsweredItem: (index: number) => void;
  reset: () => void;
}

export const useScrollStore = create<ScrollState>((set, get) => ({
  currentIndex: 0,
  hasStarted: false,
  answeredItems: new Set(),

  setCurrentIndex: (index) =>
    set((state) => {
      if (state.currentIndex === index) {
        console.log(`[ScrollStore] setCurrentIndex(${index}) - SAME, skip`);
        return state;
      }
      console.log(`[ScrollStore] setCurrentIndex: ${state.currentIndex} → ${index}`);
      return { currentIndex: index };
    }),

  setHasStarted: (started) => {
    console.log(`[ScrollStore] setHasStarted(${started})`);
    set({ hasStarted: started });
  },

  addAnsweredItem: (index) =>
    set((state) => {
      if (state.answeredItems.has(index)) {
        console.log(`[ScrollStore] addAnsweredItem(${index}) - already answered`);
        return state;
      }
      console.log(`[ScrollStore] addAnsweredItem(${index})`);
      return { answeredItems: new Set(state.answeredItems).add(index) };
    }),

  reset: () => {
    console.log(`[ScrollStore] reset()`);
    set({
      currentIndex: 0,
      hasStarted: false,
      answeredItems: new Set(),
    });
  },
}));

// ─────────────────────────────────────────────────────────────
// Selector hooks for optimal re-render performance
// ─────────────────────────────────────────────────────────────

/** Get current scroll index */
export const useCurrentIndex = () => useScrollStore((s) => s.currentIndex);

/** Check if experience has started */
export const useHasStarted = () => useScrollStore((s) => s.hasStarted);

/** Check if a specific quiz index has been answered */
export const useIsQuizAnswered = (index: number) =>
  useScrollStore((s) => s.answeredItems.has(index));

/** Get progress as fraction (0-1) */
export const useScrollProgress = (totalItems: number) =>
  useScrollStore((s) => (totalItems > 0 ? (s.currentIndex + 1) / totalItems : 0));

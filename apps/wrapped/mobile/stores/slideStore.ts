/**
 * Zustand store for slide visibility and animation state
 *
 * Replaces SlideAnimationContext with better performance:
 * - Selective subscriptions: slides only re-render when THEIR visibility changes
 * - No provider wrapping needed
 * - Better for high-frequency updates (scroll events)
 * - Dormant tracking for memory optimization of distant slides
 */

import { create } from 'zustand';

/** Number of slides away from current before considered "dormant" */
const DORMANT_THRESHOLD = 5;

interface SlideState {
  /** Currently focused slide index */
  currentIndex: number;
  /** Set of slide indices currently visible in the viewport */
  visibleIndices: Set<number>;
  /** Whether effects are globally ready (deferred loading complete) */
  effectsReady: boolean;

  // Actions
  setCurrentIndex: (index: number) => void;
  setVisibleIndices: (indices: number[]) => void;
  setEffectsReady: (ready: boolean) => void;
}

export const useSlideStore = create<SlideState>((set) => ({
  currentIndex: 0,
  visibleIndices: new Set([0]),
  effectsReady: false,

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setVisibleIndices: (indices) =>
    set((state) => {
      // Skip update if indices are unchanged (avoids unnecessary Set recreation)
      if (
        indices.length === state.visibleIndices.size &&
        indices.every((i) => state.visibleIndices.has(i))
      ) {
        return state; // Return existing state, no update triggered
      }
      console.log(`[SlideStore] visibleIndices: [${Array.from(state.visibleIndices).join(',')}] → [${indices.join(',')}]`);
      return { visibleIndices: new Set(indices) };
    }),

  setEffectsReady: (ready) => set({ effectsReady: ready }),
}));

// Selector hooks for optimal re-render performance
// Each component only re-renders when its specific selector result changes

/**
 * Check if a specific slide is visible in the viewport
 * Uses a stable selector to prevent unnecessary re-renders
 */
export function useSlideVisible(slideIndex: number): boolean {
  return useSlideStore((state) => state.visibleIndices.has(slideIndex));
}

/**
 * Check if a specific slide is the current (active) slide
 */
export function useSlideActive(slideIndex: number): boolean {
  return useSlideStore((state) => state.currentIndex === slideIndex);
}

/**
 * Check if effects should be shown (globally ready + slide visible)
 */
export function useEffectsEnabled(slideIndex: number): boolean {
  return useSlideStore(
    (state) => state.effectsReady && state.visibleIndices.has(slideIndex)
  );
}

/**
 * Check if a slide is "dormant" (far from current view)
 *
 * Slides that are DORMANT_THRESHOLD or more slides away from the current
 * slide can release resources like SharedValues to reduce memory pressure.
 * This is especially useful for apps with many slides (30+).
 *
 * @param slideIndex - The index of the slide to check
 * @returns true if the slide is far enough away to be considered dormant
 */
export function useSlideDormant(slideIndex: number): boolean {
  return useSlideStore(
    (state) => Math.abs(state.currentIndex - slideIndex) > DORMANT_THRESHOLD
  );
}

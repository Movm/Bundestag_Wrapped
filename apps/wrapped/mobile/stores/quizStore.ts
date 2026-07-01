/**
 * Quiz Store - Zustand-based quiz state management
 *
 * Moves quiz state from WrappedExperience's useState to Zustand store.
 * This prevents renderItem callback recreation on quiz answers,
 * which was causing all visible slides to re-render.
 *
 * With Zustand:
 * - Only quiz slides subscribe to quiz state
 * - Non-quiz slides never re-render for quiz changes
 * - renderItem callback becomes stable (no quiz deps)
 */

import { create } from 'zustand';
import type { SlideType } from '../components/SlideRenderer';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface QuizState {
  /** Current quiz number (1-indexed) */
  quizNumber: number;
  /** Number of correct answers */
  correctCount: number;
  /** Set of answered quiz slide IDs */
  answeredQuizzes: Set<SlideType>;

  // Actions
  answerQuiz: (slideId: SlideType, isCorrect: boolean) => void;
  incrementQuizNumber: () => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export const useQuizStore = create<QuizState>((set) => ({
  quizNumber: 1,
  correctCount: 0,
  answeredQuizzes: new Set(),

  answerQuiz: (slideId, isCorrect) =>
    set((state) => {
      // Skip if already answered (prevents double-counting)
      if (state.answeredQuizzes.has(slideId)) {
        return state;
      }

      const newAnswered = new Set(state.answeredQuizzes);
      newAnswered.add(slideId);

      return {
        correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
        answeredQuizzes: newAnswered,
      };
    }),

  incrementQuizNumber: () =>
    set((state) => ({ quizNumber: state.quizNumber + 1 })),

  reset: () =>
    set({
      quizNumber: 1,
      correctCount: 0,
      answeredQuizzes: new Set(),
    }),
}));

// ─────────────────────────────────────────────────────────────
// Selectors - Components subscribe only to what they need
// ─────────────────────────────────────────────────────────────

/**
 * Get current quiz number (for badge display)
 * Only SlideQuiz components need this
 */
export function useQuizNumber(): number {
  return useQuizStore((state) => state.quizNumber);
}

/**
 * Get correct answer count (for ShareSlide score display)
 * Only ShareSlide needs this
 */
export function useCorrectCount(): number {
  return useQuizStore((state) => state.correctCount);
}

/**
 * Check if a specific quiz has been answered
 * Per-slide subscription - only that quiz slide re-renders
 */
export function useIsQuizAnswered(slideId: SlideType): boolean {
  return useQuizStore((state) => state.answeredQuizzes.has(slideId));
}

/**
 * Check if ANY quiz has been answered (for scroll unlock logic)
 */
export function useHasAnsweredAny(): boolean {
  return useQuizStore((state) => state.answeredQuizzes.size > 0);
}

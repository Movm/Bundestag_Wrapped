/**
 * Quiz Store - Zustand-based quiz state management
 *
 * Adapted from mobile/stores/quizStore.ts for web.
 * This prevents re-render cascades when quiz answers change.
 *
 * With Zustand:
 * - Only quiz slides subscribe to quiz state
 * - Non-quiz slides never re-render for quiz changes
 * - MainWrappedPage doesn't hold quiz state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SlideType } from '@/components/main-wrapped/constants';

interface QuizState {
  /** Record of quiz answers: slideId -> isCorrect */
  quizAnswers: Record<string, boolean>;

  /** Answer a quiz question */
  answerQuiz: (slideId: SlideType, isCorrect: boolean) => void;

  /** Reset all quiz state */
  reset: () => void;

  /** Clear persisted state (on finale) */
  clearProgress: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      quizAnswers: {},

      answerQuiz: (slideId, isCorrect) =>
        set((state) => {
          // Skip if already answered
          if (slideId in state.quizAnswers) {
            return state;
          }
          return {
            quizAnswers: { ...state.quizAnswers, [slideId]: isCorrect },
          };
        }),

      reset: () => set({ quizAnswers: {} }),

      clearProgress: () => {
        // Clear localStorage directly
        localStorage.removeItem('quiz-storage');
        set({ quizAnswers: {} });
      },
    }),
    {
      name: 'quiz-storage',
    }
  )
);

/**
 * Get correct answer count
 * Only ShareSlide needs this
 */
export function useCorrectCount(): number {
  return useQuizStore((state) =>
    Object.values(state.quizAnswers).filter(Boolean).length
  );
}

/**
 * Check if a specific quiz has been answered
 * Per-slide subscription - only that quiz slide re-renders when answered
 */
export function useIsQuizAnswered(slideId: SlideType): boolean {
  return useQuizStore((state) => slideId in state.quizAnswers);
}

/**
 * Check if ANY quiz has been answered (for conditional logic)
 */
export function useHasAnsweredAny(): boolean {
  return useQuizStore((state) => Object.keys(state.quizAnswers).length > 0);
}

/**
 * Get the answerQuiz action without subscribing to state
 * Using getState() to avoid subscription entirely
 */
export function useAnswerQuiz() {
  return useQuizStore.getState().answerQuiz;
}

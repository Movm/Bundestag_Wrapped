/**
 * Speaker Quiz Store - Zustand-based quiz state management for Speaker Wrapped
 *
 * Following the pattern from quizStore.ts.
 * Each speaker has one quiz (signature word guess).
 * State is keyed by speaker slug.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SpeakerQuizState {
  /** Record of quiz answers: speakerSlug -> isCorrect */
  quizAnswers: Record<string, boolean>;

  /** Answer a speaker's quiz question */
  answerQuiz: (slug: string, isCorrect: boolean) => void;

  /** Reset all quiz state */
  reset: () => void;

  /** Clear persisted state */
  clearProgress: () => void;
}

export const useSpeakerQuizStore = create<SpeakerQuizState>()(
  persist(
    (set) => ({
      quizAnswers: {},

      answerQuiz: (slug, isCorrect) =>
        set((state) => {
          // Skip if already answered for this speaker
          if (slug in state.quizAnswers) {
            return state;
          }
          return {
            quizAnswers: { ...state.quizAnswers, [slug]: isCorrect },
          };
        }),

      reset: () => set({ quizAnswers: {} }),

      clearProgress: () => {
        localStorage.removeItem('speaker-quiz-storage');
        set({ quizAnswers: {} });
      },
    }),
    {
      name: 'speaker-quiz-storage',
    }
  )
);

/**
 * Check if a specific speaker's quiz has been answered
 * Per-speaker subscription - only that speaker's quiz slide re-renders
 */
export function useSpeakerQuizAnswered(slug: string): boolean {
  return useSpeakerQuizStore((state) => slug in state.quizAnswers);
}

/**
 * Check if a specific speaker's quiz was answered correctly
 */
export function useSpeakerQuizCorrect(slug: string): boolean | null {
  return useSpeakerQuizStore((state) => state.quizAnswers[slug] ?? null);
}

/**
 * Get the answerQuiz action without subscribing to state
 */
export function useAnswerSpeakerQuiz() {
  return useSpeakerQuizStore.getState().answerQuiz;
}

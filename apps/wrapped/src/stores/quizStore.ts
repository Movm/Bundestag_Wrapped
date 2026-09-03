/** Edition-scoped quiz persistence for the Wrapped journey. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SlideType } from '@/components/main-wrapped/constants';
import { editionStorageKey, type EditionSurface } from '@/edition/surface';

type QuizSurface = Pick<EditionSurface, 'editionId' | 'dataVersion'>;
type ScopedAnswers = Record<string, Record<string, boolean>>;

interface QuizState {
  answersByScope: ScopedAnswers;
  answerQuiz: (surface: QuizSurface, slideId: SlideType, isCorrect: boolean) => void;
  reset: (surface: QuizSurface) => void;
  clearProgress: (surface: QuizSurface) => void;
}

export function quizScope(surface: QuizSurface): string {
  return editionStorageKey('quiz', surface);
}

function answersFor(state: QuizState, surface: QuizSurface): Record<string, boolean> {
  return state.answersByScope[quizScope(surface)] ?? {};
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      answersByScope: {},
      answerQuiz: (surface, slideId, isCorrect) => set((state) => {
        const scope = quizScope(surface);
        const answers = answersFor(state, surface);
        if (slideId in answers) return state;
        return { answersByScope: { ...state.answersByScope, [scope]: { ...answers, [slideId]: isCorrect } } };
      }),
      reset: (surface) => set((state) => ({
        answersByScope: { ...state.answersByScope, [quizScope(surface)]: {} },
      })),
      clearProgress: (surface) => set((state) => {
        const { [quizScope(surface)]: _removed, ...remaining } = state.answersByScope;
        return { answersByScope: remaining };
      }),
    }),
    {
      name: 'quiz-storage-v2',
      // The former unscoped answers cannot safely be assigned to a year. Discard
      // them once instead of allowing a legacy answer to unlock an edition route.
      onRehydrateStorage: () => () => localStorage.removeItem('quiz-storage'),
    },
  ),
);

export function countCorrectAnswers(
  answers: Record<string, boolean>,
  activeSlides?: readonly SlideType[],
): number {
  const relevantAnswers = activeSlides
    ? activeSlides.map((slide) => answers[slide]).filter((answer): answer is boolean => answer !== undefined)
    : Object.values(answers);
  return relevantAnswers.filter(Boolean).length;
}

export function useCorrectCount(surface: QuizSurface, activeSlides?: readonly SlideType[]): number {
  return useQuizStore((state) => countCorrectAnswers(answersFor(state, surface), activeSlides));
}

export function useIsQuizAnswered(surface: QuizSurface, slideId: SlideType): boolean {
  return useQuizStore((state) => slideId in answersFor(state, surface));
}

export function useHasAnsweredAny(surface: QuizSurface): boolean {
  return useQuizStore((state) => Object.keys(answersFor(state, surface)).length > 0);
}

export function useAnswerQuiz(surface: QuizSurface) {
  return (slideId: SlideType, isCorrect: boolean) => useQuizStore.getState().answerQuiz(surface, slideId, isCorrect);
}

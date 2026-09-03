/** Edition- and speaker-scoped persistence for the personal Wrapped quiz. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { editionStorageKey, type EditionSurface } from '@/edition/surface';

type SpeakerSurface = Pick<EditionSurface, 'editionId' | 'dataVersion'>;
type ScopedAnswers = Record<string, Record<string, boolean>>;

function editionSuffix(surface: SpeakerSurface): string {
  return `:${surface.editionId}:${surface.dataVersion}`;
}

interface SpeakerQuizState {
  answersByScope: ScopedAnswers;
  answerQuiz: (surface: SpeakerSurface, slug: string, isCorrect: boolean) => void;
  reset: (surface: SpeakerSurface, slug?: string) => void;
  clearProgress: (surface: SpeakerSurface, slug?: string) => void;
}

export function speakerQuizScope(surface: SpeakerSurface, slug: string): string {
  return editionStorageKey(`speaker-quiz:${slug}`, surface);
}

function answersFor(state: SpeakerQuizState, surface: SpeakerSurface, slug: string): Record<string, boolean> {
  return state.answersByScope[speakerQuizScope(surface, slug)] ?? {};
}

export const useSpeakerQuizStore = create<SpeakerQuizState>()(
  persist(
    (set) => ({
      answersByScope: {},
      answerQuiz: (surface, slug, isCorrect) => set((state) => {
        const scope = speakerQuizScope(surface, slug);
        const answers = answersFor(state, surface, slug);
        if (slug in answers) return state;
        return { answersByScope: { ...state.answersByScope, [scope]: { ...answers, [slug]: isCorrect } } };
      }),
      reset: (surface, slug) => set((state) => {
        if (slug) return { answersByScope: { ...state.answersByScope, [speakerQuizScope(surface, slug)]: {} } };
        return { answersByScope: Object.fromEntries(Object.entries(state.answersByScope).filter(([key]) => !key.endsWith(editionSuffix(surface)))) };
      }),
      clearProgress: (surface, slug) => set((state) => {
        if (slug) {
          const { [speakerQuizScope(surface, slug)]: _removed, ...remaining } = state.answersByScope;
          return { answersByScope: remaining };
        }
        return { answersByScope: Object.fromEntries(Object.entries(state.answersByScope).filter(([key]) => !key.endsWith(editionSuffix(surface)))) };
      }),
    }),
    {
      name: 'speaker-quiz-storage-v2',
      // Global legacy speaker answers have no reliable edition ownership.
      onRehydrateStorage: () => () => localStorage.removeItem('speaker-quiz-storage'),
    },
  ),
);

export function useSpeakerQuizAnswered(surface: SpeakerSurface, slug: string): boolean {
  return useSpeakerQuizStore((state) => slug in answersFor(state, surface, slug));
}

export function useSpeakerQuizCorrect(surface: SpeakerSurface, slug: string): boolean | null {
  return useSpeakerQuizStore((state) => answersFor(state, surface, slug)[slug] ?? null);
}

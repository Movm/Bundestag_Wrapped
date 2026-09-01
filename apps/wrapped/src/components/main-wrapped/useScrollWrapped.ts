import { useState, useMemo, useEffect } from 'react';
import { SLIDES, TOTAL_QUIZ_QUESTIONS, type SlideType } from './constants';
import {
  getWrappedProgress,
  setWrappedProgress,
  clearWrappedProgress,
} from '@/lib/wrapped-storage';
import { useQuizStore } from '@/stores/quizStore';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';

/**
 * Simplified scroll state hook - quiz state moved to quizStore.
 *
 * This hook now only manages:
 * - currentSection (which slide is visible)
 * - initialSection (for scroll restoration)
 * - Section persistence to localStorage
 *
 * Quiz state (answers, correctCount) is in quizStore with selective subscriptions.
 */
export interface ScrollWrappedState {
  // Current slide
  currentSection: SlideType;

  // Restored section (for scroll restoration on mount)
  initialSection: SlideType | null;

  // Actions
  setCurrentSection: (section: SlideType) => void;
}

// Load initial section from localStorage
function getInitialSection(surface: ReturnType<typeof editionSurface>): SlideType {
  const saved = getWrappedProgress(surface);
  if (saved && SLIDES.includes(saved.currentSection as SlideType)) {
    return saved.currentSection as SlideType;
  }
  return 'intro';
}

export function useScrollWrapped(): ScrollWrappedState {
  const edition = useOptionalEdition();
  const surface = useMemo(
    () => editionSurface(edition),
    [edition],
  );
  const initialSection = useMemo(() => getInitialSection(surface), [surface]);
  const [currentSection, setCurrentSection] = useState<SlideType>(initialSection);
  const clearQuizProgress = useQuizStore((state) => state.clearProgress);

  // Track initial section for scroll restoration (null after first render)
  const restoredSection = initialSection !== 'intro' ? initialSection : null;

  // Persist section to localStorage on changes
  useEffect(() => {
    // Don't persist intro (fresh state)
    if (currentSection === 'intro') {
      return;
    }

    // Clear all progress when user completes the experience
    if (currentSection === 'finale') {
      clearWrappedProgress(surface);
      clearQuizProgress();
      return;
    }

    // Only persist currentSection - quiz state is in quizStore
    setWrappedProgress({ currentSection, quizAnswers: {} }, surface);
  }, [currentSection, clearQuizProgress, surface]);

  return {
    currentSection,
    initialSection: restoredSection,
    setCurrentSection,
  };
}

export { SLIDES, TOTAL_QUIZ_QUESTIONS, type SlideType };

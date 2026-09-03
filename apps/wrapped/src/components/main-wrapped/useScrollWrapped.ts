import { useState, useMemo, useEffect } from 'react';
import { SLIDES, type SlideType } from './constants';
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
export function normalizeSection(
  section: string | null | undefined,
  activeSlides: readonly SlideType[],
): SlideType {
  if (section && activeSlides.includes(section as SlideType)) return section as SlideType;
  return activeSlides[0] ?? 'intro';
}

function getInitialSection(
  surface: ReturnType<typeof editionSurface>,
  activeSlides: readonly SlideType[],
): SlideType {
  const saved = getWrappedProgress(surface, activeSlides);
  return normalizeSection(saved?.currentSection, activeSlides);
}

export function useScrollWrapped(activeSlides: readonly SlideType[] = SLIDES): ScrollWrappedState {
  const edition = useOptionalEdition();
  const surface = useMemo(
    () => editionSurface(edition),
    [edition],
  );
  const initialSection = useMemo(
    () => getInitialSection(surface, activeSlides),
    [activeSlides, surface],
  );
  const [currentSection, setCurrentSection] = useState<SlideType>(initialSection);
  const clearQuizProgress = useQuizStore((state) => state.clearProgress);

  // Track initial section for scroll restoration (null after first render)
  const normalizedCurrentSection = normalizeSection(currentSection, activeSlides);
  const restoredSection = initialSection !== 'intro' ? initialSection : null;

  // An edition update can remove a story group. Repair both the visible section
  // and persisted progress before a renderer can be asked for a missing slide.
  useEffect(() => {
    if (currentSection !== normalizedCurrentSection) {
      const frame = requestAnimationFrame(() => setCurrentSection(normalizedCurrentSection));
      return () => cancelAnimationFrame(frame);
    }
  }, [currentSection, normalizedCurrentSection]);

  // Persist section to localStorage on changes
  useEffect(() => {
    // Don't persist intro (fresh state)
    if (normalizedCurrentSection === 'intro') {
      return;
    }

    // Clear all progress when user completes the experience
    if (normalizedCurrentSection === 'finale') {
      clearWrappedProgress(surface);
      clearQuizProgress(surface);
      return;
    }

    // Only persist currentSection - quiz state is in quizStore
    setWrappedProgress({ currentSection: normalizedCurrentSection }, surface);
  }, [normalizedCurrentSection, clearQuizProgress, surface]);

  return {
    currentSection: normalizedCurrentSection,
    initialSection: restoredSection,
    setCurrentSection,
  };
}

export { SLIDES, type SlideType };

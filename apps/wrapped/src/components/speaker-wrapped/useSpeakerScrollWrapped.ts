import { useState, useMemo, useEffect } from 'react';
import { SPEAKER_SLIDES, type SpeakerSlideType } from './constants';
import { useSpeakerQuizStore } from '@/stores/speakerQuizStore';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionStorageKey, editionSurface } from '@/edition/surface';

/**
 * Scroll state hook for Speaker Wrapped.
 *
 * Similar to main wrapped's useScrollWrapped but:
 * - Storage is keyed by speaker slug (different progress per speaker)
 * - Simpler storage (just current section, no quiz answers - those are in speakerQuizStore)
 */

const STORAGE_PREFIX = 'speaker-wrapped-progress-';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SpeakerProgress {
  currentSection: SpeakerSlideType;
  savedAt: number;
}

function getStorageKey(slug: string, surface: ReturnType<typeof editionSurface>): string {
  return editionStorageKey(`${STORAGE_PREFIX}${slug}`, surface);
}

function getSavedProgress(slug: string, surface: ReturnType<typeof editionSurface>): SpeakerSlideType | null {
  try {
    const raw = localStorage.getItem(getStorageKey(slug, surface));
    if (!raw) return null;

    const data = JSON.parse(raw) as SpeakerProgress;

    // Check expiration
    if (Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(getStorageKey(slug, surface));
      return null;
    }

    // Validate section is valid
    if (SPEAKER_SLIDES.includes(data.currentSection)) {
      return data.currentSection;
    }

    return null;
  } catch {
    localStorage.removeItem(getStorageKey(slug, surface));
    return null;
  }
}

function saveProgress(slug: string, section: SpeakerSlideType, surface: ReturnType<typeof editionSurface>): void {
  try {
    const data: SpeakerProgress = {
      currentSection: section,
      savedAt: Date.now(),
    };
    localStorage.setItem(getStorageKey(slug, surface), JSON.stringify(data));
  } catch {
    // Storage full or disabled - fail silently
  }
}

function clearProgress(slug: string, surface: ReturnType<typeof editionSurface>): void {
  try {
    localStorage.removeItem(getStorageKey(slug, surface));
  } catch {
    // Fail silently
  }
}

export interface SpeakerScrollWrappedState {
  currentSection: SpeakerSlideType;
  initialSection: SpeakerSlideType | null;
  setCurrentSection: (section: SpeakerSlideType) => void;
  handleRestart: () => void;
}

export function useSpeakerScrollWrapped(slug: string): SpeakerScrollWrappedState {
  const surface = editionSurface(useOptionalEdition());
  // Load initial section from localStorage
  const initialSection = useMemo(() => {
    const saved = getSavedProgress(slug, surface);
    return saved || 'speaker-intro';
  }, [slug, surface]);

  const [currentSection, setCurrentSection] = useState<SpeakerSlideType>(initialSection);

  // Track initial section for scroll restoration (null after first render)
  const restoredSection = initialSection !== 'speaker-intro' ? initialSection : null;

  // Clear quiz progress action from store
  const clearQuizProgress = useSpeakerQuizStore((state) => state.clearProgress);

  // Persist section to localStorage on changes
  useEffect(() => {
    // Don't persist intro (fresh state)
    if (currentSection === 'speaker-intro') {
      return;
    }

    // Clear all progress when user completes the experience
    if (currentSection === 'speaker-share') {
      clearProgress(slug, surface);
      // Note: Don't clear quiz progress here - user might restart
      return;
    }

    saveProgress(slug, currentSection, surface);
  }, [slug, currentSection, surface]);

  // Handle restart - clears progress and resets to intro
  const handleRestart = useMemo(() => {
    return () => {
      clearProgress(slug, surface);
      clearQuizProgress(surface, slug);
      setCurrentSection('speaker-intro');
    };
  }, [slug, surface, clearQuizProgress]);

  return {
    currentSection,
    initialSection: restoredSection,
    setCurrentSection,
    handleRestart,
  };
}

import { useState, useMemo, useRef, useEffect } from 'react';
import { SPEAKER_SLIDES, type SpeakerSlideType } from './constants';
import { useSpeakerQuizStore } from '@/stores/speakerQuizStore';

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

function getStorageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

function getSavedProgress(slug: string): SpeakerSlideType | null {
  try {
    const raw = localStorage.getItem(getStorageKey(slug));
    if (!raw) return null;

    const data = JSON.parse(raw) as SpeakerProgress;

    // Check expiration
    if (Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(getStorageKey(slug));
      return null;
    }

    // Validate section is valid
    if (SPEAKER_SLIDES.includes(data.currentSection)) {
      return data.currentSection;
    }

    return null;
  } catch {
    localStorage.removeItem(getStorageKey(slug));
    return null;
  }
}

function saveProgress(slug: string, section: SpeakerSlideType): void {
  try {
    const data: SpeakerProgress = {
      currentSection: section,
      savedAt: Date.now(),
    };
    localStorage.setItem(getStorageKey(slug), JSON.stringify(data));
  } catch {
    // Storage full or disabled - fail silently
  }
}

function clearProgress(slug: string): void {
  try {
    localStorage.removeItem(getStorageKey(slug));
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
  // Load initial section from localStorage
  const initialSection = useMemo(() => {
    const saved = getSavedProgress(slug);
    return saved || 'speaker-intro';
  }, [slug]);

  const [currentSection, setCurrentSection] = useState<SpeakerSlideType>(initialSection);

  // Track initial section for scroll restoration (null after first render)
  const initialSectionRef = useRef<SpeakerSlideType | null>(
    initialSection !== 'speaker-intro' ? initialSection : null
  );

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
      clearProgress(slug);
      // Note: Don't clear quiz progress here - user might restart
      return;
    }

    saveProgress(slug, currentSection);
  }, [slug, currentSection]);

  // Handle restart - clears progress and resets to intro
  const handleRestart = useMemo(() => {
    return () => {
      clearProgress(slug);
      clearQuizProgress();
      setCurrentSection('speaker-intro');
    };
  }, [slug, clearQuizProgress]);

  return {
    currentSection,
    initialSection: initialSectionRef.current,
    setCurrentSection,
    handleRestart,
  };
}

/**
 * MobileWrappedPage - A simplified version of MainWrappedPage for mobile
 *
 * This component is designed to be used with expo-dom. It:
 * - Receives data as a prop (bundled offline) instead of fetching
 * - Has no Header/Footer (native app handles navigation)
 * - Has no SEO/meta tags
 * - Has no BackgroundSystem (simplified for performance)
 * - Has no ShareFAB (skipping sharepics for mobile)
 */

import { useRef, useCallback, useMemo, useEffect } from 'react';
import type { WrappedData } from '@/data/wrapped';
import {
  ScrollContainer,
  SlideSection,
  useScrollWrapped,
  useSlideTransitionSound,
  SlideRenderer,
  SLIDES,
  type ScrollContainerRef,
  type SlideType,
} from '@/components/main-wrapped';
import { useQuizStore } from '@/stores/quizStore';
import { useWrappedStore } from '@/stores/wrappedStore';
import { LEGACY_SURFACE } from '@/edition/surface';

interface MobileWrappedPageProps {
  /** DOM prop required by Expo's 'use dom' directive */
  dom?: unknown;
  /** Bundled wrapped data passed from native context */
  data: WrappedData;
  /** Called when the experience is completed */
  onComplete?: () => void;
}

export function MobileWrappedPage({ data, onComplete }: MobileWrappedPageProps) {
  const scrollContainerRef = useRef<ScrollContainerRef>(null);

  // Sync bundled data prop to wrappedStore (slides use store selectors)
  const setData = useWrappedStore((s) => s.setData);
  useEffect(() => {
    if (data) {
      setData(data);
    }
  }, [data, setData]);

  // Simplified: quiz state is in quizStore, not passed as props
  const { currentSection, initialSection, setCurrentSection } = useScrollWrapped();

  const resetQuiz = useQuizStore((state) => state.reset);

  // Play subtle whoosh sound on slide transitions
  useSlideTransitionSound(currentSection);

  const handleQuizComplete = useCallback((slideId: string) => {
    if (slideId === 'finale') {
      resetQuiz(LEGACY_SURFACE);
      onComplete?.();
    }
    setTimeout(() => {
      scrollContainerRef.current?.scrollToNextSlide(slideId);
    }, 100);
  }, [onComplete, resetQuiz]);

  const handleSectionChange = useCallback((id: string) => {
    setCurrentSection(id as SlideType);
  }, [setCurrentSection]);

  // Pre-compute slide callbacks (simplified - quiz answers handled by store)
  const slideCallbacks = useMemo(() => {
    return Object.fromEntries(
      SLIDES.map((slideId) => [
        slideId,
        { onComplete: () => handleQuizComplete(slideId) },
      ])
    ) as Record<SlideType, { onComplete: () => void }>;
  }, [handleQuizComplete]);

  // Data is passed as prop, so no loading state needed
  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white/50">Keine Daten</div>
      </div>
    );
  }

  return (
    <div className="relative bg-neutral-950 min-h-screen h-full">
      <ScrollContainer
        ref={scrollContainerRef}
        initialSection={initialSection}
        onSectionChange={handleSectionChange}
      >
        {SLIDES.map((slideId) => (
          <SlideSection key={slideId} id={slideId}>
            <SlideRenderer
              slide={slideId}
              onComplete={slideCallbacks[slideId].onComplete}
            />
          </SlideSection>
        ))}
      </ScrollContainer>
    </div>
  );
}

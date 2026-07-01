import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { useDebugRender } from '@/hooks/useDebugRender';
import { motion, AnimatePresence } from 'motion/react';
import { useWrappedData } from '@/hooks/useDataQueries';
import { WrappedToolbar } from '@/components/ui/WrappedToolbar';
import { Footer } from '@/components/ui/Footer';
import { SEO } from '@/components/seo/SEO';
import { SITE_CONFIG } from '@/components/seo/constants';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { getSlideIntensity } from '@/lib/background-config';
import { themeMusic, getThemeForSlide } from '@/lib/theme-music';
import { clearWrappedProgress } from '@/lib/wrapped-storage';
import { useIsQuizAnswered, useQuizStore } from '@/stores/quizStore';
import {
  ScrollContainer,
  SlideSection,
  useScrollWrapped,
  useAutoScroll,
  useSlideTransitionSound,
  SlideRenderer,
  SLIDES,
  SHAREABLE_SLIDES,
  useSlideShareData,
  type ScrollContainerRef,
  type SlideType,
} from './main-wrapped';
import { SlideShareFAB } from './slides/shared';

interface MainWrappedPageProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function MainWrappedPage({ isMenuOpen, onMenuToggle }: MainWrappedPageProps) {
  // React Query fetches data and syncs to wrappedStore
  // Slides use store selectors directly, not data prop
  const { isLoading: loading, error, data } = useWrappedData();
  const scrollContainerRef = useRef<ScrollContainerRef>(null);

  // Simplified: quiz state is in quizStore, not passed as props
  const { currentSection, initialSection, setCurrentSection } = useScrollWrapped();

  // For scroll lock: check if current quiz is answered (only subscribes when on quiz slide)
  const isCurrentQuizAnswered = useIsQuizAnswered(currentSection as SlideType);
  const resetQuiz = useQuizStore((state) => state.reset);

  // Auto-scroll on intro slides after 4 seconds
  useAutoScroll(currentSection, scrollContainerRef);

  // Play subtle whoosh sound on slide transitions
  useSlideTransitionSound(currentSection);

  // Track if intro slide has been started (for scroll lock)
  // If we're restoring past intro, mark as started
  const [introStarted, setIntroStarted] = useState(
    () => initialSection !== null && initialSection !== 'intro'
  );

  // Switch background theme music based on current section
  // Theme is automatically pushed to audioStore by themeMusic.playTheme()
  useEffect(() => {
    // Only switch themes after intro has started (user clicked start button)
    if (!introStarted) return;

    const theme = getThemeForSlide(currentSection);
    themeMusic.playTheme(theme);
  }, [currentSection, introStarted]);

  // Clean up theme music when leaving the page to free memory
  useEffect(() => {
    return () => {
      themeMusic.cleanup();
    };
  }, []);

  // Restore scroll position on mount if we have saved progress
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (initialSection && !hasRestoredRef.current && !loading && data) {
      hasRestoredRef.current = true;
      // Small delay to ensure ScrollContainer is mounted
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollToSlide(initialSection);
      });
    }
  }, [initialSection, loading, data]);

  const handleQuizComplete = useCallback((slideId: string) => {
    if (slideId === 'intro') {
      setIntroStarted(true);
    }
    setTimeout(() => {
      scrollContainerRef.current?.scrollToNextSlide(slideId);
    }, 100);
  }, []);

  // Restart handler - clears progress and reloads page
  const handleRestart = useCallback(() => {
    clearWrappedProgress();
    resetQuiz();
    window.location.reload();
  }, [resetQuiz]);

  // Stable section change handler
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

  // Lock scroll on intro (until started) and unanswered quiz slides
  const [scrollLocked, setScrollLocked] = useState(true); // Start locked for intro
  const shouldLock =
    (currentSection === 'intro' && !introStarted) ||
    (currentSection.startsWith('quiz-') && !isCurrentQuizAnswered);

  useEffect(() => {
    if (shouldLock) {
      // Delay lock to let scroll-snap animation complete before triggering reflow
      const timer = setTimeout(() => setScrollLocked(true), 200);
      return () => clearTimeout(timer);
    } else {
      // Unlock immediately (no delay needed)
      setScrollLocked(false);
    }
  }, [shouldLock]);

  // Debug: Track re-renders and prop changes
  useDebugRender('MainWrappedPage', {
    currentSection,
    introStarted,
    scrollLocked,
    dataLoaded: !!data,
    handleQuizComplete,
  });

  // Share data from store (only subscribes when on shareable slide)
  const isShareable = SHAREABLE_SLIDES.has(currentSection);
  const shareData = useSlideShareData(isShareable ? currentSection : 'intro');

  if (loading) {
    return null;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center pt-14">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 mb-2">Fehler beim Laden</p>
          <p className="text-white/40 text-sm">{error?.message}</p>
        </div>
      </div>
    );
  }

  const showFooter = currentSection === 'finale';

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.siteName,
    url: SITE_CONFIG.siteUrl,
    description: SITE_CONFIG.defaultDescription,
    inLanguage: 'de-DE',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.siteUrl}/suche?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <SEO canonicalUrl="/" structuredData={websiteSchema} />
      <WrappedToolbar isMenuOpen={isMenuOpen} onMenuToggle={onMenuToggle} />

      <BackgroundSystem
        slideId={currentSection}
        intensity={getSlideIntensity(currentSection)}
        scrollContainer={scrollContainerRef.current?.containerRef}
        sparkles={true}
      />

      <div className="relative z-10">
        <ScrollContainer
          ref={scrollContainerRef}
          onSectionChange={handleSectionChange}
          locked={scrollLocked}
        >
          {SLIDES.map((slideId) => (
            <SlideSection key={slideId} id={slideId}>
              <SlideRenderer
                slide={slideId}
                onComplete={slideCallbacks[slideId].onComplete}
                onRestart={handleRestart}
              />
            </SlideSection>
          ))}
        </ScrollContainer>

        {/* Single FAB instance - only show on shareable slides */}
        {isShareable && shareData && <SlideShareFAB slideData={shareData} />}

        <AnimatePresence>
          {showFooter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Footer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

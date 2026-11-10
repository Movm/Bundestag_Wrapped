import { startTransition, useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { useDebugRender } from '@/hooks/useDebugRender';
import { useWrappedData } from '@/hooks/useDataQueries';
import { WrappedToolbar } from '@/components/ui/WrappedToolbar';
import { Footer } from '@/components/ui/Footer';
import { SkipLink } from '@/components/ui/SkipLink';
import { SEO } from '@/components/seo/SEO';
import { SITE_CONFIG } from '@/components/seo/constants';
import { themeMusic, getThemeForSlide } from '@/lib/theme-music';
import { whenTrulyIdle } from '@/lib/when-idle';
import { clearWrappedProgress } from '@/lib/wrapped-storage';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import { buildConfiguredEditionQuizModel } from '@/domain/edition-quiz';
import { quizScope, useQuizStore } from '@/stores/quizStore';
import {
  ScrollContainer,
  SlideSection,
  useScrollWrapped,
  useSlideTransitionSound,
  SlideRenderer,
  SLIDES,
  SHAREABLE_SLIDES,
  useSlideShareData,
  buildActiveSlidePlan,
  getQuizSlides,
  type ScrollContainerRef,
  type SlideType,
} from './main-wrapped';
import { SlideShareFAB } from './slides/shared';

interface MainWrappedPageProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onRestart: () => void;
}

export function MainWrappedPage({ isMenuOpen, onMenuToggle, onRestart }: MainWrappedPageProps) {
  const surface = editionSurface(useOptionalEdition());
  // React Query fetches data and syncs to wrappedStore
  // Slides use store selectors directly, not data prop
  const { isLoading: loading, error, data } = useWrappedData();
  const scrollContainerRef = useRef<ScrollContainerRef>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const quizConfiguration = useOptionalEdition()?.content?.quiz;
  const quizModel = useMemo(() => (data ? buildConfiguredEditionQuizModel(data, quizConfiguration) : {}), [data, quizConfiguration]);
  const activeSlides = useMemo(
    () => data ? buildActiveSlidePlan(quizModel, data.moinSpeakers, quizConfiguration, Boolean(data.yearOverYear)) : SLIDES,
    [data, quizModel, quizConfiguration],
  );
  const activeQuizSlides = useMemo(() => getQuizSlides(activeSlides), [activeSlides]);

  // Simplified: quiz state is in quizStore, not passed as props
  const { currentSection, initialSection, setCurrentSection } = useScrollWrapped(activeSlides);

  const quizAnswers = useQuizStore(state => state.answersByScope[quizScope(surface)]);
  const resetQuiz = useQuizStore((state) => state.reset);

  // Play subtle whoosh sound on slide transitions
  useSlideTransitionSound(currentSection);

  // Track if intro slide has been started (for scroll lock)
  // If we're restoring past intro, mark as started
  const [introStarted, setIntroStarted] = useState(
    () => initialSection !== null && initialSection !== 'intro'
  );

  // Switch background theme music based on current section
  // Theme is automatically pushed to audioStore by themeMusic.playTheme()
  // The very first play() sets up the browser's audio output on the main
  // thread (a measured 22 ms task = one dropped frame). Start it only after the
  // first slide has finished arriving, in an idle moment; later theme switches
  // reuse the running output and stay immediate.
  const musicStarted = useRef(false);
  useEffect(() => {
    // Only switch themes after intro has started (user clicked start button)
    if (!introStarted) return;

    const theme = getThemeForSlide(currentSection);
    if (musicStarted.current) {
      themeMusic.playTheme(theme);
      return;
    }
    return whenTrulyIdle(() => {
      musicStarted.current = true;
      void themeMusic.playTheme(theme);
    });
  }, [currentSection, introStarted]);

  // Load the first theme while the reader is still on the cover, so pressing
  // "Starten" only starts playback instead of setting up a media element.
  const firstThemeSlide = activeSlides[1];
  useEffect(() => {
    if (introStarted || !firstThemeSlide) return;
    return whenTrulyIdle(() => themeMusic.preload(getThemeForSlide(firstThemeSlide)));
  }, [introStarted, firstThemeSlide]);

  // Clean up theme music when leaving the page to free memory
  useEffect(() => {
    return () => {
      themeMusic.cleanup();
    };
  }, []);

  // "Starten": rendering the started story is a big update. Run it as a
  // transition (time-sliced, so the click frame stays short) and scroll only
  // after it has committed — before that, the cover is still forward-blocked.
  // A reader who comes back to the cover is already started: just move on.
  const pendingStart = useRef(false);
  const startedRef = useRef(introStarted);
  useEffect(() => { startedRef.current = introStarted; }, [introStarted]);
  const handleQuizComplete = useCallback((slideId: string) => {
    if (slideId !== 'intro') return;
    if (startedRef.current) {
      requestAnimationFrame(() => scrollContainerRef.current?.scrollToNextSlide('intro', true));
      return;
    }
    pendingStart.current = true;
    startTransition(() => setIntroStarted(true));
  }, []);
  useEffect(() => {
    if (!introStarted || !pendingStart.current) return;
    pendingStart.current = false;
    const frame = requestAnimationFrame(() => scrollContainerRef.current?.scrollToNextSlide('intro', true));
    return () => cancelAnimationFrame(frame);
  }, [introStarted]);

  // Remount the journey after clearing progress; avoid unload/scroll persistence races.
  const handleRestart = useCallback(() => {
    clearWrappedProgress(surface);
    resetQuiz(surface);
    onRestart();
  }, [resetQuiz, surface, onRestart]);

  // Stable section change handler
  const handleSectionChange = useCallback((id: string) => {
    setCurrentSection(id as SlideType);
  }, [setCurrentSection]);

  // Pre-compute slide callbacks (simplified - quiz answers handled by store)
  const slideCallbacks = useMemo(() => {
    return Object.fromEntries(
      activeSlides.map((slideId) => [
        slideId,
        { onComplete: () => handleQuizComplete(slideId) },
      ])
    ) as Record<SlideType, { onComplete: () => void }>;
  }, [activeSlides, handleQuizComplete]);

  // Debug: Track re-renders and prop changes
  useDebugRender('MainWrappedPage', {
    currentSection,
    introStarted,
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
          <p className="text-on-muted text-sm">{error?.message}</p>
        </div>
      </div>
    );
  }


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
      <SEO canonicalUrl={surface.canonicalPath} structuredData={{ ...websiteSchema, name: surface.title, url: `${SITE_CONFIG.siteUrl}${surface.canonicalPath}` }} />
      <SkipLink />
      <WrappedToolbar isMenuOpen={isMenuOpen} onMenuToggle={onMenuToggle} />

      <main id="main-content" tabIndex={-1} className="relative z-10">
        <ScrollContainer
          ref={scrollContainerRef}
          scrollElementRef={scrollElementRef}
          initialSection={initialSection}
          onSectionChange={handleSectionChange}
        >
          {activeSlides.map((slideId, index) => (
            <SlideSection key={slideId} id={slideId} forwardBlocked={(slideId === 'intro' && !introStarted) || (slideId.startsWith('quiz-') && !(slideId in (quizAnswers ?? {})))} active={Math.abs(index - activeSlides.findIndex(id => id === currentSection)) <= 1}>
              <SlideRenderer
                slide={slideId}
                onComplete={slideCallbacks[slideId].onComplete}
                onRestart={handleRestart}
                quizModel={quizModel}
                quizSlides={activeQuizSlides}
              />
              {slideId === 'finale' && <Footer />}
            </SlideSection>
          ))}
        </ScrollContainer>

        {/* Single FAB instance - only show on shareable slides */}
        {isShareable && shareData && <SlideShareFAB slideData={shareData} />}

      </main>
    </>
  );
}

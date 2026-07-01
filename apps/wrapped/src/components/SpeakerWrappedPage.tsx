import { useRef, useEffect, useCallback, useState } from 'react';
import { useParams } from 'react-router';
import { motion } from 'motion/react';
import { useSpeakerData } from '@/hooks/useDataQueries';
import { SpeakerSEO } from '@/components/seo/SpeakerSEO';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { ScrollContainer, type ScrollContainerRef } from '@/components/main-wrapped/ScrollContainer';
import { SlideSection } from '@/components/main-wrapped/SlideSection';
import { playSound } from '@/lib/sounds';
import { getPartyColor } from './speaker-wrapped/party-colors';
import {
  SPEAKER_SLIDES,
  SPEAKER_HIDE_PROGRESS_SLIDES,
  type SpeakerSlideType,
} from './speaker-wrapped/constants';
import { useSpeakerScrollWrapped } from './speaker-wrapped/useSpeakerScrollWrapped';
import {
  useSpeakerQuizAnswered,
  useSpeakerQuizStore,
} from '@/stores/speakerQuizStore';
import { SpeakerSlideRenderer } from './speaker-wrapped/SpeakerSlideRenderer';

export function SpeakerWrappedPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading: loading, error } = useSpeakerData(slug);
  const scrollContainerRef = useRef<ScrollContainerRef>(null);

  // Scroll state with persistence
  const { currentSection, initialSection, setCurrentSection } = useSpeakerScrollWrapped(slug);

  // Track if intro has started (user clicked "Los geht's")
  const [introStarted, setIntroStarted] = useState(false);

  // Quiz state from store (like main wrapped)
  const isQuizAnswered = useSpeakerQuizAnswered(slug);
  const answerQuiz = useSpeakerQuizStore((state) => state.answerQuiz);

  // Scroll lock logic (like main wrapped)
  const scrollLocked =
    (currentSection === 'speaker-intro' && !introStarted) ||
    (currentSection === 'speaker-quiz' && !isQuizAnswered);

  // Progress calculation
  const sectionIndex = SPEAKER_SLIDES.indexOf(currentSection);
  const progress = ((sectionIndex + 1) / SPEAKER_SLIDES.length) * 100;
  const hideProgressBar = SPEAKER_HIDE_PROGRESS_SLIDES.has(currentSection);

  // Play sound on section change
  const prevSectionRef = useRef(currentSection);
  useEffect(() => {
    if (prevSectionRef.current !== currentSection) {
      playSound('whoosh');
      prevSectionRef.current = currentSection;
    }
  }, [currentSection]);

  // Restore scroll position on mount (if resuming)
  useEffect(() => {
    if (initialSection && data && initialSection !== 'speaker-intro') {
      setIntroStarted(true); // Skip intro lock if resuming
      const timer = setTimeout(() => {
        scrollContainerRef.current?.scrollToSlide(initialSection);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection, data]);

  // Handle intro start (unlock scroll)
  const handleIntroStart = useCallback(() => {
    setIntroStarted(true);
    setTimeout(() => {
      scrollContainerRef.current?.scrollToNextSlide('speaker-intro');
    }, 100);
  }, []);

  // Handle quiz answer (store in Zustand, like main wrapped)
  const handleQuizAnswer = useCallback((isCorrect: boolean) => {
    answerQuiz(slug, isCorrect);
  }, [slug, answerQuiz]);

  // Handle quiz complete (scroll to next after animation)
  const handleQuizComplete = useCallback(() => {
    setTimeout(() => {
      scrollContainerRef.current?.scrollToNextSlide('speaker-quiz');
    }, 100);
  }, []);

  // Handle restart
  const handleRestart = useCallback(() => {
    setIntroStarted(false);
    setCurrentSection('speaker-intro');
    scrollContainerRef.current?.scrollToSlide('speaker-intro');
  }, [setCurrentSection]);

  // Handle section change from scroll
  const handleSectionChange = useCallback((sectionId: string) => {
    setCurrentSection(sectionId as SpeakerSlideType);
  }, [setCurrentSection]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center pt-14">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎤</div>
          <p className="text-white/60">Lade Wrapped...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center pt-14">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 mb-2">
            {error?.message?.includes('not found') ? 'Abgeordnete/r nicht gefunden' : 'Fehler beim Laden'}
          </p>
          <p className="text-white/40 text-sm">{error?.message}</p>
        </div>
      </div>
    );
  }

  const partyColor = getPartyColor(data.party);

  return (
    <>
      <SpeakerSEO speaker={data} />

      {/* Background system with themed effects */}
      <BackgroundSystem
        slideId={currentSection}
        scrollContainer={scrollContainerRef.current?.containerRef}
        sparkles
      />

      <div className="min-h-screen page-bg pt-14">
        {/* Progress bar */}
        {!hideProgressBar && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-14 left-0 right-0 z-50 p-4"
          >
            <div
              className="max-w-md mx-auto h-1 bg-white/10 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Fortschritt durch das Wrapped"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: partyColor }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* Scroll container with slides */}
        <ScrollContainer
          ref={scrollContainerRef}
          onSectionChange={handleSectionChange}
          locked={scrollLocked}
        >
          {SPEAKER_SLIDES.map((slideId) => (
            <SlideSection key={slideId} id={slideId}>
              <SpeakerSlideRenderer
                slide={slideId}
                speaker={data}
                onStart={handleIntroStart}
                onQuizAnswer={handleQuizAnswer}
                onQuizComplete={handleQuizComplete}
                onRestart={handleRestart}
              />
            </SlideSection>
          ))}
        </ScrollContainer>
      </div>
    </>
  );
}

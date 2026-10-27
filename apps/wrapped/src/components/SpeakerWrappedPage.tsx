import { useRef, useEffect, useCallback } from 'react';
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
  useSpeakerQuizStore,
} from '@/stores/speakerQuizStore';
import { SpeakerSlideRenderer } from './speaker-wrapped/SpeakerSlideRenderer';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';

export function SpeakerWrappedPage() {
  const surface = editionSurface(useOptionalEdition());
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading: loading, error } = useSpeakerData(slug);
  const scrollContainerRef = useRef<ScrollContainerRef>(null);

  // Scroll state with persistence
  const { currentSection, initialSection, setCurrentSection, handleRestart: clearSpeakerProgress } = useSpeakerScrollWrapped(slug);

  const answerQuiz = useSpeakerQuizStore((state) => state.answerQuiz);

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

  // Handle intro start (unlock scroll)
  const handleIntroStart = useCallback(() => {
    setTimeout(() => {
      scrollContainerRef.current?.scrollToNextSlide('speaker-intro');
    }, 100);
  }, []);

  // Handle quiz answer (store in Zustand, like main wrapped)
  const handleQuizAnswer = useCallback((isCorrect: boolean) => {
    answerQuiz(surface, slug, isCorrect);
  }, [surface, slug, answerQuiz]);

  // Handle quiz complete (scroll to next after animation)
  const handleQuizComplete = useCallback(() => {
    setTimeout(() => {
      scrollContainerRef.current?.scrollToNextSlide('speaker-quiz');
    }, 100);
  }, []);

  // Handle restart
  const handleRestart = useCallback(() => {
    clearSpeakerProgress();
    setCurrentSection('speaker-intro');
    scrollContainerRef.current?.scrollToSlide('speaker-intro');
  }, [clearSpeakerProgress, setCurrentSection]);

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
        sparkles
      />

      <div className="speaker-story page-bg">
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
          initialSection={initialSection}
          onSectionChange={handleSectionChange}
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

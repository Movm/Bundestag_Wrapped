import { useRef, useEffect, useCallback, useState } from 'react';
import { useParams } from 'react-router';
import { useSpeakerData } from '@/hooks/useDataQueries';
import { SpeakerSEO } from '@/components/seo/SpeakerSEO';
import { ScrollContainer, type ScrollContainerRef } from '@/components/main-wrapped/ScrollContainer';
import { SlideSection } from '@/components/main-wrapped/SlideSection';
import { playSound } from '@/lib/sounds';
import {
  SPEAKER_SLIDES,
  type SpeakerSlideType,
} from './speaker-wrapped/constants';
import { useSpeakerScrollWrapped } from './speaker-wrapped/useSpeakerScrollWrapped';
import {
  useSpeakerQuizStore, useSpeakerQuizCorrect,
} from '@/stores/speakerQuizStore';
import { SpeakerSlideRenderer } from './speaker-wrapped/SpeakerSlideRenderer';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';

export function SpeakerWrappedPage() {
  const surface = editionSurface(useOptionalEdition());
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading: loading, error } = useSpeakerData(slug);
  const scrollContainerRef = useRef<ScrollContainerRef>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Scroll state with persistence
  const { currentSection, initialSection, setCurrentSection, handleRestart: clearSpeakerProgress } = useSpeakerScrollWrapped(slug);

  const [introStarted, setIntroStarted] = useState(() => !!initialSection && initialSection !== 'speaker-intro');
  const quizAnswer = useSpeakerQuizCorrect(surface, slug);
  const isQuizAnswered = quizAnswer !== null;
  const [restartCount, setRestartCount] = useState(0);
  const answerQuiz = useSpeakerQuizStore((state) => state.answerQuiz);

  const sectionIndex = SPEAKER_SLIDES.indexOf(currentSection);

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
    setIntroStarted(true);
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollToNextSlide('speaker-intro');
    });
  }, []);

  // Handle quiz answer (store in Zustand, like main wrapped)
  const handleQuizAnswer = useCallback((isCorrect: boolean) => {
    answerQuiz(surface, slug, isCorrect);
  }, [surface, slug, answerQuiz]);

  const handleQuizComplete = useCallback(() => {}, []);

  // Handle restart
  const handleRestart = useCallback(() => {
    setRestartCount(count => count + 1);
    setIntroStarted(false);
    clearSpeakerProgress();
    setCurrentSection('speaker-intro');
    scrollContainerRef.current?.scrollToSlide('speaker-intro');
  }, [clearSpeakerProgress, setCurrentSection]);

  // Handle section change from scroll
  const handleSectionChange = useCallback((sectionId: string) => {
    setCurrentSection(sectionId as SpeakerSlideType);
  }, [setCurrentSection]);

  if (loading) {
    return (
      <div data-surface="ink" className="speaker-story">
        <div className="story-shell grid place-items-center px-6">
          <p role="status" className="ds-display ds-display--lg">Lade Wrapped…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const notFound = error?.message?.includes('not found');
    return (
      <div data-surface="ink" className="speaker-story">
        <div className="story-shell grid place-items-center px-6">
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="ds-display ds-display--lg">{notFound ? 'Abgeordnete/r nicht gefunden' : 'Fehler beim Laden'}</p>
            {!notFound && error?.message && <p className="ds-note">{error.message}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SpeakerSEO speaker={data} />

      <div data-surface="ink" className="speaker-story">
        {/* Scroll container with slides */}
        <ScrollContainer
          ref={scrollContainerRef}
          scrollElementRef={scrollElementRef}
          initialSection={initialSection}
          onSectionChange={handleSectionChange}
        >
          {SPEAKER_SLIDES.map((slideId, index) => (
            <SlideSection key={slideId} id={slideId} forwardBlocked={(slideId === 'speaker-intro' && !introStarted) || (slideId === 'speaker-quiz' && !!data.signatureQuiz && !isQuizAnswered)} active={Math.abs(index - sectionIndex) <= 1}>
              <SpeakerSlideRenderer
                key={restartCount}
                quizAnswer={quizAnswer}
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

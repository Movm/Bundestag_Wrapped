import { memo } from 'react';
import { useDebugRender } from '@/hooks/useDebugRender';
import { QUIZZES } from '@/data/quizzes';
import { INFO_SLIDES } from '@/data/info-slides';
import { TOTAL_QUIZ_QUESTIONS, type SlideType } from './constants';
import {
  IntroSlide,
  QuizSlide,
  VocabularySlide,
  SpeechesSlide,
  DramaSlide,
  TopicsSlide,
  PartyTopicsSlide,
  CommonWordsSlide,
  MoinSlide,
  SwiftieSlide,
  ToneAnalysisSlide,
  DiscriminatorySlide,
  GenderSlide,
  ShareSlide,
  EndSlide,
} from '@/components/slides';
import { SlideInfo } from '@/components/slides/shared';
import type { SlideData } from '@/lib/slide-sharepics';
import { useIsQuizAnswered, useAnswerQuiz } from '@/stores/quizStore';
import {
  useParties,
  useDrama,
  useTopicAnalysis,
  useToneAnalysis,
  useHotTopics,
  useMoinSpeakers,
  useGenderAnalysis,
  useFullWrappedData,
} from '@/stores/wrappedStore';

/**
 * Hook to get share data for the current slide.
 * Uses Zustand store so only re-renders when relevant data changes.
 */
export function useSlideShareData(slide: SlideType): SlideData | null {
  const data = useFullWrappedData();
  if (!data) return null;

  switch (slide) {
    case 'reveal-signature':
      return { type: 'vocabulary', data: { parties: data.parties } };
    case 'chart-speeches':
      return {
        type: 'speeches',
        data: {
          parties: data.parties.map(p => ({
            party: p.party,
            speeches: p.speeches,
            wortbeitraege: p.wortbeitraege,
          })),
        },
      };
    case 'reveal-drama':
      return { type: 'drama', drama: data.drama };
    case 'reveal-common-words':
      return { type: 'commonWords', data: { topics: data.hotTopics } };
    case 'reveal-moin':
      return { type: 'moin', speakers: data.moinSpeakers ?? [] };
    case 'reveal-swiftie':
      return { type: 'swiftie', data: { name: 'Daniel Baldy', party: 'SPD' } };
    case 'reveal-tone':
      return data.toneAnalysis?.partyProfiles
        ? { type: 'toneAnalysis', data: { partyProfiles: data.toneAnalysis.partyProfiles } }
        : null;
    case 'reveal-gender':
      return data.genderAnalysis
        ? { type: 'gender', genderAnalysis: data.genderAnalysis }
        : null;
    default:
      return null;
  }
}

/**
 * SlideRenderer - renders the appropriate slide component.
 *
 * Data is fetched via Zustand store selectors, not props.
 * Each slide subscribes only to the data it needs, preventing cascade re-renders.
 *
 * Quiz state also uses quizStore for the same reason.
 */
interface SlideRendererProps {
  slide: SlideType;
  onComplete: () => void;
  onRestart?: () => void;
}

// Pre-compute quiz slides and their numbers at module level
const QUIZ_SLIDES = [
  'quiz-topics', 'quiz-signature', 'quiz-speeches', 'quiz-drama',
  'quiz-discriminatory', 'quiz-common-words', 'quiz-moin', 'quiz-swiftie',
  'quiz-tone', 'quiz-gender',
] as const;

function getQuizNumber(slideId: string): number {
  const index = QUIZ_SLIDES.indexOf(slideId as typeof QUIZ_SLIDES[number]);
  return index >= 0 ? index + 1 : 0;
}

// ============================================================================
// Wrapper components - each subscribes to only the data it needs
// ============================================================================

function TopicsSlideWrapper({ phase }: { phase: 'intro' | 'result' }) {
  const topicAnalysis = useTopicAnalysis();
  if (!topicAnalysis) return null;
  return <TopicsSlide topicAnalysis={topicAnalysis} phase={phase} />;
}

function PartyTopicsSlideWrapper() {
  const topicAnalysis = useTopicAnalysis();
  if (!topicAnalysis) return null;
  return <PartyTopicsSlide topicAnalysis={topicAnalysis} />;
}

function VocabularySlideWrapper({ phase }: { phase: 'intro' | 'result' }) {
  const parties = useParties();
  if (!parties) return null;
  return <VocabularySlide parties={parties} phase={phase} />;
}

function SpeechesSlideWrapper({ phase }: { phase: 'intro' | 'result' }) {
  const parties = useParties();
  if (!parties) return null;
  return <SpeechesSlide parties={parties} phase={phase} />;
}

function DramaSlideWrapper({ phase }: { phase: 'intro' | 'result' }) {
  const drama = useDrama();
  if (!drama) return null;
  return <DramaSlide drama={drama} phase={phase} />;
}

function DiscriminatorySlideWrapper({ phase }: { phase: 'intro' | 'result' }) {
  const toneAnalysis = useToneAnalysis();
  return <DiscriminatorySlide toneAnalysis={toneAnalysis} phase={phase} />;
}

function CommonWordsSlideWrapper({ phase }: { phase: 'intro' | 'result' }) {
  const hotTopics = useHotTopics();
  if (!hotTopics) return null;
  return <CommonWordsSlide topics={hotTopics} phase={phase} />;
}

function MoinSlideWrapper({
  phase,
  onQuizAnswer,
  onComplete,
}: {
  phase: 'intro' | 'quiz' | 'result';
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}) {
  const moinSpeakers = useMoinSpeakers();
  return (
    <MoinSlide
      moinSpeakers={moinSpeakers ?? []}
      phase={phase}
      onQuizAnswer={onQuizAnswer}
      onComplete={onComplete}
    />
  );
}

function ToneSlideWrapper({ phase }: { phase: 'intro' | 'result' }) {
  const toneAnalysis = useToneAnalysis();
  if (!toneAnalysis) return null;
  return <ToneAnalysisSlide toneAnalysis={toneAnalysis} phase={phase} />;
}

function GenderSlideWrapper() {
  const genderAnalysis = useGenderAnalysis();
  if (!genderAnalysis) return null;
  return <GenderSlide genderAnalysis={genderAnalysis} phase="result" />;
}

// ============================================================================
// Main SlideRenderer
// ============================================================================

export const SlideRenderer = memo(function SlideRenderer({
  slide,
  onComplete,
  onRestart,
}: SlideRendererProps) {
  // Quiz state from store
  const isQuizAnswered = useIsQuizAnswered(slide);
  const answerQuiz = useAnswerQuiz();

  // Quiz number computed from slide ID (static)
  const quizNumber = getQuizNumber(slide);

  // Handle quiz answer by updating store
  const handleQuizAnswer = (isCorrect: boolean) => {
    answerQuiz(slide, isCorrect);
  };

  // Debug: Verify memo is working correctly
  useDebugRender('SlideRenderer', { slide });

  const renderSlideContent = () => {
    switch (slide) {
    case 'intro':
      return <IntroSlide onStart={onComplete} />;

    // Topics: intro -> result (first section)
    case 'intro-topics':
      return <TopicsSlideWrapper phase="intro" />;

    case 'reveal-topics':
      return <TopicsSlideWrapper phase="result" />;

    case 'reveal-party-topics':
      return <PartyTopicsSlideWrapper />;

    // Vocabulary: intro -> quiz -> result
    case 'intro-vocabulary':
      return <VocabularySlideWrapper phase="intro" />;

    case 'reveal-signature':
      return <VocabularySlideWrapper phase="result" />;

    // Speeches: intro -> result
    case 'intro-speeches':
      return <SpeechesSlideWrapper phase="intro" />;

    case 'chart-speeches':
      return <SpeechesSlideWrapper phase="result" />;

    // Drama: intro -> result
    case 'intro-drama':
      return <DramaSlideWrapper phase="intro" />;

    // Discriminatory Language: intro -> quiz -> info -> result
    case 'intro-discriminatory':
      return <DiscriminatorySlideWrapper phase="intro" />;

    // Common Words: intro -> result
    case 'intro-common-words':
      return <CommonWordsSlideWrapper phase="intro" />;

    // Moin: intro -> quiz -> result
    case 'intro-moin':
      return <MoinSlideWrapper phase="intro" />;

    case 'quiz-moin':
      return (
        <MoinSlideWrapper
          phase="quiz"
          onQuizAnswer={handleQuizAnswer}
          onComplete={onComplete}
        />
      );

    case 'reveal-moin':
      return <MoinSlideWrapper phase="result" />;

    // Swiftie Easter Egg: intro -> quiz -> result (no data needed)
    case 'intro-swiftie':
      return <SwiftieSlide phase="intro" />;

    case 'quiz-swiftie':
      return (
        <SwiftieSlide
          phase="quiz"
          onQuizAnswer={handleQuizAnswer}
          onComplete={onComplete}
        />
      );

    case 'reveal-swiftie':
      return <SwiftieSlide phase="result" />;

    // Tone: intro -> result
    case 'intro-tone':
      return <ToneSlideWrapper phase="intro" />;

    // All quiz slides use hardcoded QUIZZES (no data needed)
    case 'quiz-topics':
    case 'quiz-signature':
    case 'quiz-speeches':
    case 'quiz-drama':
    case 'quiz-discriminatory':
    case 'quiz-common-words':
    case 'quiz-tone':
    case 'quiz-gender': {
      const question = QUIZZES[slide];
      return (
        <QuizSlide
          question={question}
          questionNumber={quizNumber}
          totalQuestions={TOTAL_QUIZ_QUESTIONS}
          isAnswered={isQuizAnswered}
          onAnswer={handleQuizAnswer}
          onComplete={onComplete}
          slideId={slide}
        />
      );
    }

    // Info slides - educational context (no data needed, uses INFO_SLIDES constant)
    case 'info-disclaimer':
    case 'info-topics':
    case 'info-party-topics':
    case 'info-signature':
    case 'info-speeches':
    case 'info-drama':
    case 'info-discriminatory':
    case 'info-moin':
    case 'info-tone':
    case 'info-gender':
      return <SlideInfo {...INFO_SLIDES[slide]} slideId={slide} />;

    case 'reveal-drama':
      return <DramaSlideWrapper phase="result" />;

    case 'reveal-discriminatory':
      return <DiscriminatorySlideWrapper phase="result" />;

    case 'reveal-common-words':
      return <CommonWordsSlideWrapper phase="result" />;

    case 'reveal-tone':
      return <ToneSlideWrapper phase="result" />;

    case 'reveal-gender':
      return <GenderSlideWrapper />;

    case 'share':
      return <ShareSlide totalQuestions={TOTAL_QUIZ_QUESTIONS} />;

    case 'finale':
      return <EndSlide onRestart={onRestart} />;

    default:
      return null;
    }
  };

  return renderSlideContent();
}, (prev, next) => prev.slide === next.slide);

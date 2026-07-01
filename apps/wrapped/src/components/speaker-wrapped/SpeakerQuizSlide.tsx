import { useMemo } from 'react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { getPartyColor } from './party-colors';
import { SlideQuiz, type QuizConfigAlt } from '@/components/slides/shared/SlideQuiz';
import { SlideContainer } from '@/components/slides/shared/SlideContainer';
import { SlideHeader } from '@/components/slides/shared/SlideHeader';

interface SpeakerQuizSlideProps {
  speaker: SpeakerWrapped;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

/**
 * Speaker Wrapped quiz slide.
 * Uses the signature word quiz from speaker data.
 * Follows the same pattern as main wrapped quizzes.
 */
export function SpeakerQuizSlide({
  speaker,
  onQuizAnswer,
  onComplete,
}: SpeakerQuizSlideProps) {
  const partyColor = getPartyColor(speaker.party);
  const nounQuiz = speaker.signatureQuiz;

  // Build quiz config from speaker data
  const quizConfig = useMemo((): QuizConfigAlt | null => {
    if (!nounQuiz) return null;

    const explanationParty = nounQuiz.explanationParty ?? (nounQuiz as any).explanation ?? '';
    const explanationBundestag = nounQuiz.explanationBundestag ?? '';

    return {
      question: nounQuiz.question,
      options: nounQuiz.options,
      explanation: explanationBundestag
        ? [explanationParty, explanationBundestag]
        : explanationParty,
    };
  }, [nounQuiz]);

  // Fallback if no quiz data
  if (!quizConfig) {
    return (
      <SlideContainer>
        <SlideHeader
          emoji="✨"
          title="Bereit für die Statistiken?"
          subtitle="Lass uns sehen, wie du im Bundestag performt hast."
        />
      </SlideContainer>
    );
  }

  return (
    <SlideQuiz
      quiz={quizConfig}
      onAnswer={onQuizAnswer ?? (() => {})}
      onComplete={onComplete ?? (() => {})}
      emoji="🎯"
      title="Wort-Quiz"
      partyColor={partyColor}
      slideId="speaker-quiz"
    />
  );
}

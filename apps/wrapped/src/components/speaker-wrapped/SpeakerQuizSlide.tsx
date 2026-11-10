import { useMemo } from 'react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { SlideQuiz, type QuizConfigAlt } from '@/components/slides/shared/SlideQuiz';
import { Slide } from '@/design-system/components/Slide';
import { Display, Lead, Mark } from '@/design-system/components/Type';

interface SpeakerQuizSlideProps {
  speaker: SpeakerWrapped;
  isAnswered?: boolean;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

/** Signature-word quiz (one question) on the quiz surface; same engine as the main story. */
export function SpeakerQuizSlide({ speaker, isAnswered, onQuizAnswer, onComplete }: SpeakerQuizSlideProps) {
  const nounQuiz = speaker.signatureQuiz;

  const quizConfig = useMemo((): QuizConfigAlt | null => {
    if (!nounQuiz) return null;

    const explanationParty = nounQuiz.explanationParty ?? '';
    const explanationBundestag = nounQuiz.explanationBundestag ?? '';

    return {
      question: nounQuiz.question,
      options: nounQuiz.options,
      explanation: explanationBundestag ? [explanationParty, explanationBundestag] : explanationParty,
    };
  }, [nounQuiz]);

  if (!quizConfig) {
    return (
      <Slide shapes="band">
        <Display size="xl">Bereit für die <Mark>Statistiken</Mark>?</Display>
        <Lead>Lass uns sehen, wie du im Bundestag performt hast.</Lead>
      </Slide>
    );
  }

  return (
    <SlideQuiz
      quiz={quizConfig}
      isAnswered={isAnswered}
      onAnswer={onQuizAnswer ?? (() => {})}
      onComplete={onComplete ?? (() => {})}
      title="Wort-Quiz"
      slideId="speaker-quiz"
    />
  );
}

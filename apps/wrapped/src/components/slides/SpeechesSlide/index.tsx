import { memo, useMemo } from 'react';
import type { PartyStats } from '@/data/wrapped';
import { INTRO_SLIDES } from '@/data/intro-slides';
import {
  SlideIntro,
  SlideQuiz,
  useQuizConfig,
  type SlidePhase,
} from '../shared';
import { ResultView } from './ResultView';

interface SpeechesSlideProps {
  parties: PartyStats[];
  phase: SlidePhase;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

export const SpeechesSlide = memo(function SpeechesSlide({
  parties,
  phase,
  onQuizAnswer,
  onComplete,
}: SpeechesSlideProps) {
  const sorted = useMemo(
    () =>
      [...parties]
        .filter((p) => p.party !== 'fraktionslos')
        .map((p) => ({
          ...p,
          totalBeitraege: p.speeches + (p.wortbeitraege || 0),
        }))
        .sort((a, b) => b.speeches - a.speeches),
    [parties]
  );

  const quiz = useQuizConfig({
    items: sorted,
    getOption: (p) => p.party,
    question: 'Welche Partei hält die meisten Reden?',
    getExplanation: (p) =>
      `${p.party} mit ${p.speeches.toLocaleString('de-DE')} Reden!`,
  });

  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-speeches'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-speeches"
      />
    );
  }

  if (phase === 'quiz' && quiz) {
    return (
      <SlideQuiz
        quiz={quiz}
        onAnswer={onQuizAnswer ?? (() => {})}
        onComplete={onComplete ?? (() => {})}
      />
    );
  }

  return <ResultView parties={sorted} />;
});

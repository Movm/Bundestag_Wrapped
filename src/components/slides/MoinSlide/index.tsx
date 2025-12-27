import { memo, useMemo } from 'react';
import { INTRO_SLIDES } from '@/data/intro-slides';
import {
  SlideIntro,
  SlideQuiz,
  shuffle,
  type SlidePhase,
  type QuizConfig,
} from '../shared';
import { ResultView } from './ResultView';

interface MoinSpeaker {
  name: string;
  party: string;
  count: number;
}

interface MoinSlideProps {
  moinSpeakers: MoinSpeaker[];
  phase: SlidePhase;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onComplete?: () => void;
}

export const MoinSlide = memo(function MoinSlide({
  moinSpeakers,
  phase,
  onQuizAnswer,
  onComplete,
}: MoinSlideProps) {
  // Custom quiz logic - needs decoy options
  const quiz = useMemo<QuizConfig | null>(() => {
    if (moinSpeakers.length < 2) return null;

    const topSpeaker = moinSpeakers[0];
    const realOptions = moinSpeakers
      .slice(0, 4)
      .map((s) => `${s.name} (${s.party})`);

    const decoys = [
      'Johann Saathoff (SPD)',
      'Denise Loop (GRÜNE)',
      'Dr. Ingeborg Gräßle (CDU/CSU)',
    ];

    const options = [...realOptions];
    for (const decoy of decoys) {
      if (options.length >= 4) break;
      if (!options.includes(decoy)) {
        options.push(decoy);
      }
    }

    return {
      question: 'Welche Person sagt am häufigsten "Moin"?',
      options: shuffle(options.slice(0, 4)),
      correctAnswer: `${topSpeaker.name} (${topSpeaker.party})`,
      explanation: `${topSpeaker.name} grüßt mit ${topSpeaker.count}× "Moin"!`,
    };
  }, [moinSpeakers]);

  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-moin'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-moin"
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

  return <ResultView speakers={moinSpeakers} />;
});

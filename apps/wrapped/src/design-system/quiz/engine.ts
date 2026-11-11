import { useMemo, useState } from 'react';
import { playSound } from '@/lib/sounds';
import { seededShuffle } from './layouts';

/** Input shapes accepted from slides (legacy config + edition questions). */
export interface QuizConfig {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
export interface QuizOptionWithCorrect {
  text: string;
  isCorrect: boolean;
}
export interface QuizConfigAlt {
  question: string;
  options: QuizOptionWithCorrect[];
  explanation: string | string[];
}
export type AnyQuizConfig = QuizConfig | QuizConfigAlt;

export interface NormalizedQuiz {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string[];
}

export function normalizeQuiz(config: AnyQuizConfig): NormalizedQuiz {
  if ('correctAnswer' in config) {
    return { question: config.question, options: config.options, correctAnswer: config.correctAnswer, explanation: [config.explanation] };
  }
  return {
    question: config.question,
    options: config.options.map(option => option.text),
    correctAnswer: config.options.find(option => option.isCorrect)?.text ?? '',
    explanation: Array.isArray(config.explanation) ? config.explanation : [config.explanation],
  };
}

export type OptionStatus = 'idle' | 'correct' | 'wrong' | 'other';

export interface QuizOption {
  text: string;
  /** A, B, C … — shown as a visual index, never as the accessible name. */
  letter: string;
  status: OptionStatus;
  /** "richtig" / "falsch" once answered — layouts render it as visible or sr-only text. */
  statusWord: string | null;
  select: () => void;
}

export interface QuizEngine {
  quiz: NormalizedQuiz;
  options: QuizOption[];
  answered: boolean;
  /** null while unanswered or when restored from storage without the pick. */
  selected: string | null;
  isCorrect: boolean;
  /** Short visible verdict ("Genau richtig!" or "Diesmal nicht. Richtig ist: X"), also for a restored answer. */
  verdict: string;
  /** Full sentence for the live region; e2e and unit tests pin "Richtig ist:". */
  spoken: string;
}

const LETTERS = 'ABCDEFGH';

/**
 * Quiz state, independent of how the quiz looks. Every layout renders the
 * same engine, so scoring, sounds and announcements behave identically
 * whichever variant a quiz uses.
 */
export function useQuizEngine(
  config: AnyQuizConfig,
  options: { storedAnswer?: boolean | null; onAnswer: (correct: boolean) => void; onCorrect?: () => void; shuffleSeed?: string },
): QuizEngine {
  const { shuffleSeed } = options;
  const quiz = useMemo(() => {
    const normalized = normalizeQuiz(config);
    return shuffleSeed ? { ...normalized, options: seededShuffle(normalized.options, shuffleSeed) } : normalized;
  }, [config, shuffleSeed]);
  const [selected, setSelected] = useState<string | null>(null);
  const stored = options.storedAnswer ?? null;
  const answered = stored !== null || selected !== null;
  // A restored answer only knows right or wrong, not which option was picked.
  const isCorrect = selected === null ? stored === true : selected === quiz.correctAnswer;

  const choose = (option: string) => {
    if (answered) return;
    setSelected(option);
    const correct = option === quiz.correctAnswer;
    playSound(correct ? 'correct' : 'wrong');
    if (correct) options.onCorrect?.();
    options.onAnswer(correct);
  };

  const quizOptions = quiz.options.map((text, index): QuizOption => {
    const status: OptionStatus = !answered ? 'idle' : text === quiz.correctAnswer ? 'correct' : selected === text ? 'wrong' : 'other';
    return {
      text,
      letter: LETTERS[index] ?? String(index + 1),
      status,
      statusWord: status === 'correct' ? 'richtig' : status === 'wrong' ? 'falsch' : null,
      select: () => choose(text),
    };
  });

  return {
    quiz,
    options: quizOptions,
    answered,
    selected,
    isCorrect,
    verdict: isCorrect ? 'Genau richtig!' : `Diesmal nicht. Richtig ist: ${quiz.correctAnswer}`,
    spoken: isCorrect ? 'Deine Antwort ist richtig.' : `Deine Antwort ist falsch. Richtig ist: ${quiz.correctAnswer}.`,
  };
}

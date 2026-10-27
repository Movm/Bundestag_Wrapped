import { useState, useMemo } from 'react';
import { playSound } from '@/lib/sounds';

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

interface NormalizedQuiz {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string[];
}

function normalizeQuizConfig(config: QuizConfig | QuizConfigAlt): NormalizedQuiz {
  if ('correctAnswer' in config) {
    return {
      question: config.question,
      options: config.options,
      correctAnswer: config.correctAnswer,
      explanation: [config.explanation],
    };
  }
  const correctOption = config.options.find((o) => o.isCorrect);
  return {
    question: config.question,
    options: config.options.map((o) => o.text),
    correctAnswer: correctOption?.text ?? '',
    explanation: Array.isArray(config.explanation)
      ? config.explanation
      : [config.explanation],
  };
}

interface SlideQuizProps {
  quiz: QuizConfig | QuizConfigAlt;
  isAnswered?: boolean;
  onAnswer: (isCorrect: boolean) => void;
  onComplete: () => void;
  title?: string;
  emoji?: string;
  badge?: string;
  partyColor?: string;
  /** Current slide ID for themed confetti colors */
  slideId?: string;
}

// Persistent inline feedback lets users read explanations at their own pace.
export function SlideQuiz({ quiz: rawQuiz, onAnswer, isAnswered = false, title, emoji, badge }: SlideQuizProps) {
  const quiz = useMemo(() => normalizeQuizConfig(rawQuiz), [rawQuiz]);
  const [selected, setSelected] = useState<string | null>(null);
  const answered = isAnswered || selected !== null;
  const emojiNames: Record<string, string> = { '🛠️': 'Werkzeug', '🏛️': 'Parlament', '⚖️': 'Waage', '✊': 'Erhobene Faust', '😤': 'Verärgertes Gesicht' };
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-lg">
        {emoji && <div className="text-5xl text-center mb-3" aria-hidden="true">{emoji}</div>}
        {title && <p className="text-xl font-bold text-center mb-2">{title}</p>}
        {badge && <p className="text-white/70 text-sm text-center mb-4">{badge}</p>}
        <h2 className="text-2xl font-bold text-center mb-8">{quiz.question}</h2>
        <div className="grid grid-cols-2 gap-3">
          {quiz.options.map(option => (
            <button key={option} type="button" disabled={answered}
              aria-label={emojiNames[option] ? `${option} ${emojiNames[option]}` : undefined}
              className={`min-h-24 p-4 rounded-2xl text-base font-bold break-words ${answered && option === quiz.correctAnswer ? 'bg-green-800 ring-2 ring-green-300' : 'bg-bg-elevated'} ${selected === option ? 'ring-2 ring-white' : ''}`}
              onClick={() => {
                if (answered) return;
                setSelected(option);
                const correct = option === quiz.correctAnswer;
                playSound(correct ? 'correct' : 'wrong');
                onAnswer(correct);
              }}>
              {option}
            </button>
          ))}
        </div>
        <div role="status" aria-live="polite" aria-atomic="true" className="mt-6">
          {answered && <>
            <p className="font-bold">{selected ? selected === quiz.correctAnswer ? 'Richtig!' : 'Nicht ganz.' : 'Antwort gespeichert.'} Richtige Antwort: {quiz.correctAnswer}</p>
            {quiz.explanation.map((line, index) => <p key={index} className="text-white/80 mt-2">{line}</p>)}
          </>}
        </div>
        {answered && <p className="mt-4 text-sm text-white/70">Scroll weiter oder wähle „Weiter“.</p>}
      </div>
    </div>
  );
}

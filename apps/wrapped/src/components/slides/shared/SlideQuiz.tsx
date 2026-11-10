import { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { playSound } from '@/lib/sounds';
import { getPartyBgColor, PARTY_COLORS } from '@/lib/party-colors';
import { useSlideEffectsActive } from '@/components/main-wrapped/SlideEffectsContext';
import { Confetti } from './Confetti';
import { QuizAnswerButton, type QuizAnswerStatus } from './QuizAnswerButton';

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

const EMOJI_NAMES: Record<string, string> = { '🛠️': 'Werkzeug', '🏛️': 'Parlament', '⚖️': 'Waage', '✊': 'Erhobene Faust', '😤': 'Verärgertes Gesicht' };
const CONFETTI_MS = 1000;
const SCATTER_NEUTRAL = ['🗳️', '🏛️', '💬'];
const SCATTER_CORRECT = ['🎉', '✨', '🙌'];
const SCATTER_WRONG = ['🤔', '💭', '📚'];
const SCATTER_POSITIONS = [
  'top-[8%] left-[4%] -rotate-12',
  'top-[10%] right-[4%] rotate-6',
  'bottom-[14%] left-[5%] -rotate-6',
];
const BRAND_TINTS = ['#ec4899', '#f472b6', '#ffffff'];

function partyOf(option: string): string | null {
  const name = option.match(/\(([^)]+)\)$/)?.[1] ?? option;
  return name in PARTY_COLORS ? name : null;
}

// Calm tiles, light playful effects (confetti, emoji, pop): all aria-hidden, non-interactive,
// behind the content, and dropped or reduced under reduced motion.
// The result stays on screen and is announced through the live region.
export function SlideQuiz({ quiz: rawQuiz, onAnswer, isAnswered = false, title, emoji, badge }: SlideQuizProps) {
  const quiz = useMemo(() => normalizeQuizConfig(rawQuiz), [rawQuiz]);
  const reduceMotion = useReducedMotion();
  const effectsActive = useSlideEffectsActive();
  const [selected, setSelected] = useState<string | null>(null);
  const [confettiOn, setConfettiOn] = useState(false);
  const answered = isAnswered || selected !== null;
  const isCorrect = selected === quiz.correctAnswer;
  const correctParty = partyOf(quiz.correctAnswer);

  useEffect(() => {
    if (!confettiOn) return;
    const timer = setTimeout(() => setConfettiOn(false), CONFETTI_MS);
    return () => clearTimeout(timer);
  }, [confettiOn]);

  const confettiColors = useMemo(
    () => (correctParty ? [getPartyBgColor(correctParty), ...BRAND_TINTS] : BRAND_TINTS),
    [correctParty],
  );

  const select = (option: string) => {
    if (answered) return;
    setSelected(option);
    const correct = option === quiz.correctAnswer;
    playSound(correct ? 'correct' : 'wrong');
    if (correct && !reduceMotion) setConfettiOn(true);
    onAnswer(correct);
  };

  const phase = selected === null ? 'neutral' : isCorrect ? 'correct' : 'wrong';
  const scatter = phase === 'correct' ? SCATTER_CORRECT : phase === 'wrong' ? SCATTER_WRONG : SCATTER_NEUTRAL;
  const visibleVerdict = selected === null ? 'Gespeichert' : isCorrect ? 'Richtig!' : `Daneben – ${quiz.correctAnswer}`;
  const spokenVerdict = `${selected === null ? 'Antwort gespeichert.' : isCorrect ? 'Richtig!' : 'Nicht ganz.'} Richtige Antwort: ${quiz.correctAnswer}`;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 pt-8 pb-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="quiz-scatter">
          {scatter.map((glyph, i) => (
            <motion.span
              key={`${phase}-${i}`}
              className={`absolute text-5xl lg:text-6xl ${SCATTER_POSITIONS[i]}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: phase === 'neutral' ? 0.3 : 0.8, scale: 1 }}
              transition={reduceMotion ? { duration: 0.2 } : { duration: 0.3, delay: i * 0.05 }}
            >
              <span
                className="quiz-emoji-float"
                style={{ '--quiz-float-duration': `${3.6 + i * 0.4}s`, animationPlayState: effectsActive ? 'running' : 'paused' } as React.CSSProperties}
              >
                {glyph}
              </span>
            </motion.span>
          ))}
        </div>
        {confettiOn && <Confetti count={20} duration={0.8} colors={confettiColors} />}
      </div>
      <div className="relative z-10 w-full max-w-lg">
        {emoji && <div className="text-5xl text-center mb-3" aria-hidden="true">{emoji}</div>}
        {title && <p className="text-xl font-bold text-center mb-2">{title}</p>}
        {badge && <p className="text-white/60 text-xs text-center mb-4">{badge}</p>}
        <h2 className="text-2xl font-bold text-center mb-8">{quiz.question}</h2>
        <div className="grid grid-cols-2 gap-3">
          {quiz.options.map((option) => {
            const isRight = option === quiz.correctAnswer;
            const status: QuizAnswerStatus = !answered ? 'idle' : isRight ? 'correct' : selected === option ? 'wrong' : 'other';
            const statusWord = status === 'correct' ? 'richtig' : status === 'wrong' ? 'falsch' : null;
            const party = partyOf(option);
            const emojiName = EMOJI_NAMES[option];
            const isGlyph = /^\p{Emoji}/u.test(option) && [...option].length <= 4;
            return (
              <QuizAnswerButton
                key={option}
                status={status}
                inactive={answered}
                aria-label={emojiName ? `${option} ${emojiName}${statusWord ? `, ${statusWord}` : ''}` : undefined}
                style={party ? ({ '--quiz-tile': getPartyBgColor(party) } as React.CSSProperties) : undefined}
                className={`${isGlyph ? 'text-4xl' : 'text-lg'} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => select(option)}
              >
                <span>{option}</span>
                {statusWord && <span className="sr-only">, {statusWord}</span>}
              </QuizAnswerButton>
            );
          })}
        </div>
        <div role="status" aria-live="polite" aria-atomic="true" className="mt-6">
          {answered && (
            <motion.div
              data-testid="quiz-result"
              className="quiz-result-card"
              initial={selected === null ? false : reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-lg font-bold">
                <span aria-hidden="true">{visibleVerdict}</span>
                <span className="sr-only">{spokenVerdict}</span>
              </p>
              {quiz.explanation.map((line, index) => <p key={index} className="text-white/85 mt-2 leading-relaxed">{line}</p>)}
            </motion.div>
          )}
        </div>
        {answered && <p className="sr-only">Scroll weiter oder wähle „Weiter“.</p>}
      </div>
    </div>
  );
}

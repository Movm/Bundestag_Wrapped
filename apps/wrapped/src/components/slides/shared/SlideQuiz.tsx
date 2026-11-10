import { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { playSound } from '@/lib/sounds';
import { getPartyBgColor, PARTY_COLORS } from '@/lib/party-colors';
import { getThemeConfig } from '@/shared/theme-backgrounds/types';
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
const FALLBACK_COLORS = ['#2d2d3a', '#363647', '#3f3f52', '#4a4a5e'];
// Solid surfaces with white text: all >= 7:1.
const CORRECT_BG = '#14532d';
const WRONG_BG = '#7f1d1d';
const NEUTRAL_BG = '#374151';
const CONFETTI_MS = 1000;

const SCATTER_NEUTRAL = ['🗳️', '🏛️', '💬', '📊'];
const SCATTER_CORRECT = ['🎉', '✨', '🎊', '🙌'];
const SCATTER_WRONG = ['😅', '🤔', '💭', '📚'];
const SCATTER_POSITIONS = [
  'top-[8%] left-[4%] -rotate-12',
  'top-[10%] right-[4%] rotate-6',
  'bottom-[10%] left-[5%] -rotate-6',
  'bottom-[12%] right-[4%] rotate-12',
];

// "r, g, b" -> "#rrggbb"
function rgbToHex(rgb: string): string {
  const [r, g, b] = rgb.split(',').map(n => parseInt(n.trim(), 10));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function partyOf(option: string): string | null {
  const name = option.match(/\(([^)]+)\)$/)?.[1] ?? option;
  return name in PARTY_COLORS ? name : null;
}

// Persistent inline feedback lets users read explanations at their own pace.
// Effects are decorative: aria-hidden, non-interactive, behind the content, and never time out the result.
export function SlideQuiz({ quiz: rawQuiz, onAnswer, isAnswered = false, title, emoji, badge, slideId }: SlideQuizProps) {
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

  const confettiColors = useMemo(() => {
    const colors = ['#ffffff'];
    if (correctParty) colors.unshift(getPartyBgColor(correctParty));
    if (slideId) {
      const config = getThemeConfig(slideId);
      colors.unshift(rgbToHex(config.colors.primary), rgbToHex(config.colors.secondary), rgbToHex(config.colors.glow));
    }
    return colors.length > 1 ? colors : undefined;
  }, [slideId, correctParty]);

  const select = (option: string) => {
    if (answered) return;
    setSelected(option);
    const correct = option === quiz.correctAnswer;
    playSound(correct ? 'correct' : 'wrong');
    if (correct && !reduceMotion) setConfettiOn(true);
    onAnswer(correct);
  };

  const phase = !answered ? 'neutral' : selected === null ? 'neutral' : isCorrect ? 'correct' : 'wrong';
  const scatter = phase === 'correct' ? SCATTER_CORRECT : phase === 'wrong' ? SCATTER_WRONG : SCATTER_NEUTRAL;
  const resultWord = selected === null ? 'Antwort gespeichert.' : isCorrect ? 'Richtig!' : 'Nicht ganz.';

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="quiz-scatter">
          {scatter.map((glyph, i) => (
            <motion.span
              key={`${phase}-${i}`}
              className={`absolute text-5xl lg:text-6xl ${SCATTER_POSITIONS[i]}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: phase === 'neutral' ? 0.35 : 0.9, scale: 1 }}
              transition={reduceMotion ? { duration: 0.2 } : { type: 'spring', duration: 0.4, bounce: 0.4, delay: i * 0.05 }}
            >
              <span
                className="quiz-emoji-float"
                style={{ '--quiz-float-duration': `${3.5 + i * 0.3}s`, animationPlayState: effectsActive ? 'running' : 'paused' } as React.CSSProperties}
              >
                {glyph}
              </span>
            </motion.span>
          ))}
        </div>
        {confettiOn && <Confetti count={24} duration={0.8} colors={confettiColors} />}
      </div>
      <div className="relative z-10 w-full max-w-lg">
        {emoji && <div className="text-5xl text-center mb-3" aria-hidden="true">{emoji}</div>}
        {title && <p className="text-xl font-bold text-center mb-2">{title}</p>}
        {badge && <p className="text-white/70 text-sm text-center mb-4">{badge}</p>}
        <h2 className="text-2xl font-bold text-center mb-8">{quiz.question}</h2>
        <div className="grid grid-cols-2 gap-3">
          {quiz.options.map((option, i) => {
            const isRight = option === quiz.correctAnswer;
            const status: QuizAnswerStatus = !answered ? 'idle' : isRight ? 'correct' : selected === option ? 'wrong' : 'other';
            const party = partyOf(option);
            const background = status === 'idle' ? (party ? getPartyBgColor(party) : FALLBACK_COLORS[i % FALLBACK_COLORS.length])
              : status === 'correct' ? CORRECT_BG : status === 'wrong' ? WRONG_BG : NEUTRAL_BG;
            const ring = status === 'correct' ? 'ring-2 ring-green-300' : status === 'wrong' ? 'ring-2 ring-red-300' : '';
            const statusWord = status === 'correct' ? 'Richtig' : status === 'wrong' ? 'Falsch' : null;
            const emojiName = EMOJI_NAMES[option];
            const isGlyph = /^\p{Emoji}/u.test(option) && [...option].length <= 4;
            return (
              <QuizAnswerButton
                key={option}
                status={status}
                inactive={answered}
                aria-label={emojiName ? `${option} ${emojiName}${statusWord ? `, ${statusWord}` : ''}` : undefined}
                style={{ backgroundColor: background }}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-1 text-center text-white font-bold break-words ${isGlyph ? 'text-4xl' : 'text-base'} ${ring} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => select(option)}
                onMouseEnter={() => !answered && playSound('hover')}
              >
                <span>{option}</span>
                {statusWord && (
                  <span className="text-sm font-bold">
                    <span aria-hidden="true">{status === 'correct' ? '✓' : '✗'} </span>{statusWord}
                  </span>
                )}
              </QuizAnswerButton>
            );
          })}
        </div>
        <div role="status" aria-live="polite" aria-atomic="true" className="mt-6">
          {answered && (
            <motion.div
              data-testid="quiz-result"
              className="rounded-2xl border-2 p-4 text-white"
              style={{ backgroundColor: selected === null ? NEUTRAL_BG : isCorrect ? CORRECT_BG : WRONG_BG, borderColor: correctParty ? getPartyBgColor(correctParty) : 'rgba(255,255,255,0.4)' }}
              initial={selected === null ? false : reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduceMotion ? { duration: 0.2 } : { type: 'spring', duration: 0.35, bounce: 0.35 }}
            >
              <p className="font-bold">
                {selected !== null && <span aria-hidden="true">{isCorrect ? '✓ 🎉 ' : '✗ 😅 '}</span>}
                {resultWord} Richtige Antwort: {quiz.correctAnswer}
              </p>
              {quiz.explanation.map((line, index) => <p key={index} className="text-white/90 mt-2">{line}</p>)}
            </motion.div>
          )}
        </div>
        {answered && <p className="mt-4 text-sm text-white/70">Scroll weiter oder wähle „Weiter“.</p>}
      </div>
    </div>
  );
}

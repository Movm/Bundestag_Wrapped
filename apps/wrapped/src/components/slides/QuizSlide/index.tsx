import { memo } from 'react';
import type { QuizQuestion } from '@/data/wrapped';
import { SlideQuiz } from '../shared/SlideQuiz';

interface QuizSlideProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  /** Stored result: true = right, false = wrong, null = not answered yet. */
  storedAnswer: boolean | null;
  onAnswer: (isCorrect: boolean) => void;
  onComplete: () => void;
  slideId?: string;
}

export const QuizSlide = memo(function QuizSlide({ question, questionNumber, totalQuestions, storedAnswer, onAnswer, onComplete, slideId }: QuizSlideProps) {
  return <SlideQuiz quiz={question} badge={`Frage ${questionNumber} von ${totalQuestions}`} storedAnswer={storedAnswer} onAnswer={onAnswer} onComplete={onComplete} slideId={slideId} layout={question.layout} gapSentence={question.gapSentence} />;
});

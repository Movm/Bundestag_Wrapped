import { memo } from 'react';
import type { QuizQuestion } from '@/data/wrapped';
import { SlideQuiz } from '../shared/SlideQuiz';

interface QuizSlideProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  isAnswered: boolean;
  onAnswer: (isCorrect: boolean) => void;
  onComplete: () => void;
  slideId?: string;
}

export const QuizSlide = memo(function QuizSlide({ question, questionNumber, totalQuestions, isAnswered, onAnswer, onComplete }: QuizSlideProps) {
  return <SlideQuiz quiz={question} badge={`Quiz ${questionNumber}/${totalQuestions}`} isAnswered={isAnswered} onAnswer={onAnswer} onComplete={onComplete} />;
});

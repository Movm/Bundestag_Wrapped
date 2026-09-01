import { useState, useCallback, useMemo } from 'react';
import { SLIDES, type SlideType } from './constants';
import { getQuizSlides } from './slide-plan';

export interface WrappedState {
  currentSlide: SlideType;
  quizAnswers: boolean[];
  progress: number;
  quizNumber: number;
  correctCount: number;
  goToNextSlide: () => void;
  handleQuizAnswer: (isCorrect: boolean) => void;
}

export function useWrappedState(activeSlides: readonly SlideType[] = SLIDES): WrappedState {
  const [currentSlide, setCurrentSlide] = useState<SlideType>(activeSlides[0] ?? 'intro');
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);

  const slideIndex = activeSlides.indexOf(currentSlide);
  const progress = ((slideIndex + 1) / activeSlides.length) * 100;

  const quizNumber = useMemo(() => {
    const quizSlides = getQuizSlides(activeSlides);
    const currentQuizIndex = quizSlides.indexOf(currentSlide as (typeof quizSlides)[number]);
    return currentQuizIndex + 1;
  }, [activeSlides, currentSlide]);

  const correctCount = useMemo(
    () => quizAnswers.filter(Boolean).length,
    [quizAnswers]
  );

  const goToNextSlide = useCallback(() => {
    const currentIndex = activeSlides.indexOf(currentSlide);
    if (currentIndex < activeSlides.length - 1) {
      setCurrentSlide(activeSlides[currentIndex + 1]);
    }
  }, [activeSlides, currentSlide]);

  const handleQuizAnswer = useCallback((isCorrect: boolean) => {
    setQuizAnswers((prev) => [...prev, isCorrect]);
  }, []);

  return {
    currentSlide,
    quizAnswers,
    progress,
    quizNumber,
    correctCount,
    goToNextSlide,
    handleQuizAnswer,
  };
}

export { SLIDES, type SlideType };

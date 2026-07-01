/**
 * WrappedExperience - Main wrapped slide navigation
 *
 * Uses shared WrappedScrollContainer for unified scrolling behavior.
 *
 * PERFORMANCE: All callbacks are stable (empty deps or minimal deps).
 * State is accessed via getState() to avoid dependency churn.
 */

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import type { WrappedData } from '@/data/wrapped';
import { SlideRenderer, SLIDES, AUTO_SCROLL_SLIDES, AUTO_SCROLL_DELAY, type SlideType } from './SlideRenderer';
import { WrappedScrollContainer } from './WrappedScrollContainer';
import { useWrappedScroll } from '../hooks/useWrappedScroll';
import { SlideAnimationWrapper } from './SlideAnimationWrapper';
import { useSlideTransitionSound } from '~/lib/sounds';
import { useThemeMusic } from '~/lib/theme-music';
import { useAppStore } from '../stores/appStore';
import { usePrecomputedStore } from '../stores/precomputedDataStore';
import { useQuizStore } from '../stores/quizStore';

interface WrappedExperienceProps {
  data: WrappedData;
  onComplete?: () => void;
}

/**
 * WrappedExperience - Main slide navigation component
 *
 * Uses shared scroll container for smooth vertical scrolling.
 * Features:
 * - Full-screen slides with snap-to-slide behavior
 * - Progress indicator
 * - Auto-scroll for intro/info slides
 * - Quiz state management
 */
export function WrappedExperience({ data, onComplete }: WrappedExperienceProps) {
  // Initialize precomputed data store - runs ONCE when data loads
  // This precomputes heavy calculations (topic rankings, bubble sizes, tone summaries)
  // so slides render instantly without O(n×m) calculations during scroll
  useEffect(() => {
    usePrecomputedStore.getState().initialize(data);
    return () => usePrecomputedStore.getState().reset();
  }, [data]);

  // Convert SLIDES to mutable array
  const slides = useMemo(() => [...SLIDES] as SlideType[], []);

  // Use shared scroll hook - now with STABLE handlers
  const scrollState = useWrappedScroll({
    items: slides,
    autoScrollItems: AUTO_SCROLL_SLIDES as Set<SlideType>,
    autoScrollDelay: AUTO_SCROLL_DELAY,
    isQuizItem: (slide) => slide.startsWith('quiz-'),
    onComplete,
    completeDelay: 2000,
  });

  const currentSlide = scrollState.currentItem;

  // Ref to access current slide in stable callbacks (avoids dependency churn)
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

  // Data ref for stable renderItem callback
  const dataRef = useRef(data);
  dataRef.current = data;

  // Update current slide in store for accent color theming
  React.useEffect(() => {
    useAppStore.getState().setCurrentSlide(currentSlide);
  }, [currentSlide]);

  // Get store actions via getState() - no subscription overhead since actions never change
  const { setCurrentTheme } = useAppStore.getState();

  // Play whoosh sound on slide transitions
  useSlideTransitionSound(currentSlide);

  // Play theme music based on current slide section
  useThemeMusic(currentSlide, setCurrentTheme);

  // Store refs for stable callbacks
  const scrollStateRef = useRef(scrollState);
  scrollStateRef.current = scrollState;

  // Quiz handlers - STABLE callbacks using refs (no scrollState dependency!)
  const handleQuizAnswer = useCallback((isCorrect: boolean) => {
    const slide = currentSlideRef.current;
    const { answeredQuizzes, answerQuiz, incrementQuizNumber } = useQuizStore.getState();

    // Increment counter BEFORE marking as answered (only for quiz-* slides)
    if (slide.startsWith('quiz-') && !answeredQuizzes.has(slide)) {
      incrementQuizNumber();
    }

    answerQuiz(slide, isCorrect);
    scrollStateRef.current.handleQuizAnswer(isCorrect);
  }, []);

  const handleQuizComplete = useCallback(() => {
    scrollStateRef.current.handleItemComplete();
  }, []);

  // Restart handler - resets quiz store and scrolls back to first slide
  const handleRestart = useCallback(() => {
    useQuizStore.getState().reset();
    scrollStateRef.current.reset();
  }, []);

  // handleStart - use ref for stability
  const handleStart = useCallback(() => {
    scrollStateRef.current.handleStart();
  }, []);

  // Render slide - PERF: Now truly stable! All handlers have empty deps
  const renderItem = useCallback(
    ({ item: slide, index }: { item: SlideType; index: number }) => (
      <SlideAnimationWrapper index={index}>
        <SlideRenderer
          slide={slide}
          data={dataRef.current}
          slideIndex={index}
          onQuizAnswer={handleQuizAnswer}
          onQuizComplete={handleQuizComplete}
          onStart={handleStart}
          onRestart={handleRestart}
        />
      </SlideAnimationWrapper>
    ),
    [handleQuizAnswer, handleQuizComplete, handleStart, handleRestart]
    // All these are now stable (empty deps), so renderItem won't recreate!
  );

  // Key extractor
  const keyExtractor = useCallback((item: SlideType) => item, []);

  return (
    <WrappedScrollContainer
      scrollState={scrollState}
      items={slides}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      startOnFirstItemPress
    />
  );
}

/**
 * Shared Wrapped Scroll Hook
 *
 * Unified scrolling behavior for both main wrapped and speaker wrapped.
 * Handles: navigation, auto-scroll, progress tracking, scroll locking.
 *
 * PERFORMANCE: Uses Zustand store for state to ensure stable handler references.
 * All handlers are wrapped in useCallback with empty deps and read state via getState().
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useScrollStore } from '../stores/scrollStore';
import { useAppStore } from '../stores/appStore';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UseWrappedScrollOptions<T> {
  /** Array of slide/section items */
  items: T[];
  /** Set of items that should auto-scroll (by item value or index) */
  autoScrollItems?: Set<T> | Set<number>;
  /** Auto-scroll delay in ms (default: 4000) */
  autoScrollDelay?: number;
  /** Check if an item is a quiz (blocks scrolling until answered) */
  isQuizItem?: (item: T) => boolean;
  /** Callback when experience completes (reaches last item) */
  onComplete?: () => void;
  /** Delay before calling onComplete (default: 2000) */
  completeDelay?: number;
}

export interface UseWrappedScrollReturn<T> {
  // Refs
  flatListRef: React.RefObject<FlatList | null>;

  // State (from Zustand store)
  currentIndex: number;
  currentItem: T;
  hasStarted: boolean;
  isQuizAnswered: boolean;
  isScrollLocked: boolean;

  // Derived
  totalItems: number;
  progress: number;

  // Handlers (STABLE - no dependencies that change)
  handleStart: () => void;
  handleQuizAnswer: (isCorrect: boolean) => void;
  handleItemComplete: () => void;
  handleScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => void;
  handleMomentumScrollEnd: (event: { nativeEvent: { contentOffset: { y: number } } }) => void;

  // Navigation
  goToItem: (index: number, animated?: boolean) => void;
  nextItem: () => void;
  previousItem: () => void;

  // Reset
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useWrappedScroll<T>({
  items,
  autoScrollItems,
  autoScrollDelay = 4000,
  isQuizItem,
  onComplete,
  completeDelay = 2000,
}: UseWrappedScrollOptions<T>): UseWrappedScrollReturn<T> {
  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store refs for stable callback access (avoids dependency churn)
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const isQuizItemRef = useRef(isQuizItem);
  isQuizItemRef.current = isQuizItem;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const completeDelayRef = useRef(completeDelay);
  completeDelayRef.current = completeDelay;

  // Subscribe to store state (triggers re-render when these change)
  const currentIndex = useScrollStore((s) => s.currentIndex);
  const hasStarted = useScrollStore((s) => s.hasStarted);
  const answeredItems = useScrollStore((s) => s.answeredItems);

  // Derived values
  const currentItem = items[currentIndex];
  const isCurrentQuiz = isQuizItem ? isQuizItem(currentItem) : false;
  const isQuizAnswered = answeredItems.has(currentIndex);
  const isScrollLocked = !hasStarted || (isCurrentQuiz && !isQuizAnswered);

  // DEBUG: Log only on index changes
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      console.log(
        `[Scroll] ${prevIndexRef.current} → ${currentIndex} (${String(currentItem)}) quiz=${isCurrentQuiz} locked=${isScrollLocked}`
      );
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex, currentItem, isCurrentQuiz, isScrollLocked]);

  // ─────────────────────────────────────────────────────────────
  // Navigation Methods (STABLE - use refs and getState())
  // ─────────────────────────────────────────────────────────────

  const goToItem = useCallback((index: number, animated = true) => {
    const items = itemsRef.current;
    if (index < 0 || index >= items.length) return;

    flatListRef.current?.scrollToIndex({
      index,
      animated,
      viewPosition: 0,
    });
    useScrollStore.getState().setCurrentIndex(index);
  }, []);

  const nextItem = useCallback(() => {
    const { currentIndex } = useScrollStore.getState();
    const items = itemsRef.current;
    console.log(`[nextItem] idx=${currentIndex} → ${currentIndex + 1}`);
    if (currentIndex < items.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
        viewPosition: 0,
      });
      useScrollStore.getState().setCurrentIndex(currentIndex + 1);
    } else {
      console.log(`[nextItem] BLOCKED - at last item`);
    }
  }, []);

  const previousItem = useCallback(() => {
    const { currentIndex } = useScrollStore.getState();
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
        viewPosition: 0,
      });
      useScrollStore.getState().setCurrentIndex(currentIndex - 1);
    }
  }, []);

  const reset = useCallback(() => {
    useScrollStore.getState().reset();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Handlers (STABLE - use getState())
  // ─────────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    useScrollStore.getState().setHasStarted(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Inline nextItem logic to avoid dependency
    const { currentIndex } = useScrollStore.getState();
    const items = itemsRef.current;
    if (currentIndex < items.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
        viewPosition: 0,
      });
      useScrollStore.getState().setCurrentIndex(currentIndex + 1);
    }
  }, []);

  const handleQuizAnswer = useCallback((isCorrect: boolean) => {
    const { currentIndex } = useScrollStore.getState();
    const items = itemsRef.current;
    const item = items[currentIndex];
    console.log(`[QuizAnswer] idx=${currentIndex} (${String(item)}) correct=${isCorrect}`);
    useScrollStore.getState().addAnsweredItem(currentIndex);
    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );
  }, []);

  const handleItemComplete = useCallback(() => {
    const { currentIndex } = useScrollStore.getState();
    const items = itemsRef.current;
    const item = items[currentIndex];
    console.log(`[ItemComplete] idx=${currentIndex} (${String(item)}) → next`);

    // Inline nextItem logic
    if (currentIndex < items.length - 1) {
      const nextIdx = currentIndex + 1;
      console.log(`[ItemComplete] scrollToIndex(${nextIdx}) and setCurrentIndex(${nextIdx})`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: nextIdx,
        animated: true,
        viewPosition: 0,
      });
      useScrollStore.getState().setCurrentIndex(nextIdx);
    } else {
      console.log(`[ItemComplete] BLOCKED - at last item`);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Scroll Handlers (STABLE)
  // ─────────────────────────────────────────────────────────────

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      // No state update during scroll - just track for momentum end
    },
    []
  );

  const handleMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      // Use actual slide height from app store (accounts for safe areas)
      const slideHeight = useAppStore.getState().availableHeight;
      console.log(`[MomentumEnd] offsetY=${offsetY.toFixed(0)} slideHeight=${slideHeight.toFixed(0)}`);

      if (slideHeight <= 0) {
        console.log(`[MomentumEnd] SKIP - slideHeight not initialized`);
        return;
      }

      const newIndex = Math.round(offsetY / slideHeight);
      const items = itemsRef.current;
      console.log(`[MomentumEnd] calculated newIndex=${newIndex} (items.length=${items.length})`);

      if (newIndex < 0 || newIndex >= items.length) {
        console.log(`[MomentumEnd] SKIP - index out of bounds`);
        return;
      }

      const { currentIndex } = useScrollStore.getState();
      if (newIndex !== currentIndex) {
        console.log(`[MomentumEnd] UPDATE ${currentIndex} → ${newIndex}`);
        useScrollStore.getState().setCurrentIndex(newIndex);
      } else {
        console.log(`[MomentumEnd] SAME index=${newIndex}, no update`);
      }

      // Check for completion
      if (newIndex === items.length - 1 && onCompleteRef.current) {
        completeTimer.current = setTimeout(
          onCompleteRef.current,
          completeDelayRef.current
        );
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────
  // Auto-scroll Effect
  // ─────────────────────────────────────────────────────────────

  const shouldAutoScroll = useMemo(() => {
    if (!autoScrollItems || !hasStarted) return false;
    return (
      autoScrollItems.has(currentItem as any) ||
      autoScrollItems.has(currentIndex as any)
    );
  }, [autoScrollItems, hasStarted, currentItem, currentIndex]);

  useEffect(() => {
    if (autoScrollTimer.current) {
      clearTimeout(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }

    if (!shouldAutoScroll) {
      return;
    }

    console.log(
      `[AutoScroll] scheduling for ${String(currentItem)} in ${autoScrollDelay}ms`
    );
    autoScrollTimer.current = setTimeout(() => {
      console.log(`[AutoScroll] FIRED for ${String(currentItem)}`);
      // Inline nextItem logic
      const { currentIndex } = useScrollStore.getState();
      const items = itemsRef.current;
      if (currentIndex < items.length - 1) {
        const nextIdx = currentIndex + 1;
        console.log(`[AutoScroll] scrollToIndex(${nextIdx}) and setCurrentIndex(${nextIdx})`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        flatListRef.current?.scrollToIndex({
          index: nextIdx,
          animated: true,
          viewPosition: 0,
        });
        useScrollStore.getState().setCurrentIndex(nextIdx);
      } else {
        console.log(`[AutoScroll] BLOCKED - at last item`);
      }
    }, autoScrollDelay);

    return () => {
      if (autoScrollTimer.current) {
        clearTimeout(autoScrollTimer.current);
      }
    };
  }, [shouldAutoScroll, autoScrollDelay, currentItem]);

  // Cleanup complete timer
  useEffect(() => {
    return () => {
      if (completeTimer.current) {
        clearTimeout(completeTimer.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────

  return {
    flatListRef,
    currentIndex,
    currentItem,
    hasStarted,
    isQuizAnswered,
    isScrollLocked,
    totalItems: items.length,
    progress: items.length > 0 ? (currentIndex + 1) / items.length : 0,
    handleStart,
    handleQuizAnswer,
    handleItemComplete,
    handleScroll,
    handleMomentumScrollEnd,
    goToItem,
    nextItem,
    previousItem,
    reset,
  };
}

/**
 * WrappedScrollContainer - Unified scroll container for wrapped experiences
 *
 * Shared component for both main wrapped and speaker wrapped.
 * Features:
 * - Full-screen snap pagination
 * - Auto-scroll support
 * - Scroll locking during quizzes
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Pressable,
  ListRenderItem,
  Platform,
  InteractionManager,
  ViewToken,
} from 'react-native';
import type { UseWrappedScrollReturn } from '../hooks/useWrappedScroll';
import { useSlideStore } from '../stores/slideStore';
import { useScreenWidth, useAvailableHeight } from '../stores/appStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface WrappedScrollContainerProps<T> {
  /** Scroll state from useWrappedScroll hook */
  scrollState: UseWrappedScrollReturn<T>;
  /** Items to render */
  items: T[];
  /** Render function for each item */
  renderItem: ListRenderItem<T>;
  /** Key extractor function */
  keyExtractor: (item: T, index: number) => string;
  /** Whether first item should trigger start on press */
  startOnFirstItemPress?: boolean;
  /** Hide status bar (default: false) */
  hideStatusBar?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

// Viewability config for tracking visible slides
const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 100,
};

export function WrappedScrollContainer<T>({
  scrollState,
  items,
  renderItem,
  keyExtractor,
  startOnFirstItemPress = true,
  hideStatusBar = false,
}: WrappedScrollContainerProps<T>) {
  const {
    flatListRef,
    currentIndex,
    hasStarted,
    isScrollLocked,
    handleStart,
    handleMomentumScrollEnd,
  } = scrollState;

  // Refs for stable callbacks (avoid wrappedRenderItem recreation)
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;

  const handleStartRef = useRef(handleStart);
  handleStartRef.current = handleStart;

  // Get layout dimensions (primitive selectors prevent infinite re-render loops)
  const screenWidth = useScreenWidth();
  const availableHeight = useAvailableHeight();

  // Get store actions via getState() - no subscription overhead since actions never change
  const { setCurrentIndex, setVisibleIndices, setEffectsReady } =
    useSlideStore.getState();

  // Sync currentIndex to Zustand when it changes
  useEffect(() => {
    useSlideStore.getState().setCurrentIndex(currentIndex);
  }, [currentIndex]);

  // Defer effects loading - wait for initial render + interactions to complete
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      // Add small delay to ensure initial paint is complete
      setTimeout(() => {
        useSlideStore.getState().setEffectsReady(true);
      }, 150);
    });
    return () => handle.cancel();
  }, []);

  // Track visible slides for pausing off-screen animations
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const indices = viewableItems
        .map((item) => item.index)
        .filter((index): index is number => index !== null);
      setVisibleIndices(indices);
    }
  ).current;

  // Slide wrapper style with dynamic height
  const slideWrapperStyle = useMemo(
    () => ({
      width: screenWidth,
      height: availableHeight,
    }),
    [screenWidth, availableHeight]
  );

  // Wrapped render item with start handler - STABLE via refs
  const wrappedRenderItem = useCallback<ListRenderItem<T>>(
    (info) => {
      const isFirstItem = info.index === 0;
      const shouldHandlePress =
        startOnFirstItemPress && isFirstItem && !hasStartedRef.current;

      return (
        <Pressable
          style={slideWrapperStyle}
          onPress={shouldHandlePress ? () => handleStartRef.current() : undefined}
        >
          {renderItem(info)}
        </Pressable>
      );
    },
    [renderItem, startOnFirstItemPress, slideWrapperStyle]
    // hasStarted and handleStart now via refs - no dependency churn!
  );

  // Get item layout for optimization
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: availableHeight,
      offset: availableHeight * index,
      index,
    }),
    [availableHeight]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden={hideStatusBar} />

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={wrappedRenderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={availableHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEnabled={!isScrollLocked}
        bounces={false}
        // Performance optimizations
        // - initialNumToRender: Start with 1 slide for fast initial paint
        // - maxToRenderPerBatch: Render 1 at a time for memory efficiency
        // - windowSize: 5 slides (2 before + current + 2 after) for smooth scrolling
        // - updateCellsBatchingPeriod: Batch updates every 50ms to reduce JS thread work
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        // Visibility tracking for pausing off-screen animations
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        // Disabled: removeClippedSubviews causes black flashes during fast scrolling
        removeClippedSubviews={false}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});

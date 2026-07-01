/**
 * SlideAnimationWrapper - Animates slides when they become current
 *
 * Wraps slide content and triggers entrance animation when
 * the slide becomes the current visible slide.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSlideActive } from '../stores/slideStore';

interface SlideAnimationWrapperProps {
  index: number;
  children: React.ReactNode;
}

export function SlideAnimationWrapper({ index, children }: SlideAnimationWrapperProps) {
  // Use Zustand selector - only re-renders when THIS slide's active state changes
  const isCurrent = useSlideActive(index);
  const hasAnimated = useRef(false);

  // Animation values - start visible for first slide, hidden for others
  const opacity = useSharedValue(index === 0 ? 1 : 0);
  const translateY = useSharedValue(index === 0 ? 0 : 20);

  // Trigger animation when slide becomes current
  useEffect(() => {
    if (isCurrent && !hasAnimated.current) {
      hasAnimated.current = true;
      // Animate in
      opacity.value = withDelay(50, withTiming(1, { duration: 300 }));
      translateY.value = withDelay(50, withTiming(0, { duration: 350 }));
    }
    // Don't reset opacity when slide is no longer current - prevents black flash
  }, [isCurrent, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

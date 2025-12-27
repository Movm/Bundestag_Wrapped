import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAvailableHeight, useTopInset } from '../../stores/appStore';
import { BackgroundSystem } from '../../components/backgrounds';

interface SlideContainerProps {
  children: React.ReactNode;
  /** Slide ID for theme selection (e.g., 'quiz-topics', 'reveal-drama') */
  slideId?: string;
  /** Custom background color (only used if slideId not provided) */
  backgroundColor?: string;
  /** Whether to show dynamic background effects (default: true if slideId provided) */
  showBackground?: boolean;
  /** Additional style */
  style?: object;
}

/**
 * SlideContainer - Foundation component for all native slides
 *
 * Provides:
 * - Full-height layout with centered content (using availableHeight from LayoutContext)
 * - Dynamic themed background effects when slideId is provided
 * - Safe area handling via useTopInset() from store (top padding for notch/status bar)
 * - Falls back to solid dark background when slideId not provided
 *
 * Note: Entrance animations are handled by SlideAnimationWrapper
 */
export function SlideContainer({
  children,
  slideId,
  backgroundColor = '#0a0a0a',
  showBackground = true,
  style,
}: SlideContainerProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();
  const hasThemedBackground = slideId && showBackground;

  // If we have a slideId, render with themed background
  // Note: No BackgroundProvider needed - BackgroundSystem uses Zustand directly
  if (hasThemedBackground) {
    return (
      <View style={[styles.wrapper, { minHeight: availableHeight }]}>
        {/* Background layer */}
        <BackgroundSystem slideId={slideId} />

        {/* Content layer - transparent to show background */}
        <View style={[styles.container, styles.transparentContainer, { minHeight: availableHeight }, style]}>
          <View style={[styles.content, { paddingTop: topInset }]}>{children}</View>
        </View>
      </View>
    );
  }

  // Fallback to solid background
  return (
    <View style={[styles.wrapper, { minHeight: availableHeight }]}>
      <View style={[styles.container, { backgroundColor, minHeight: availableHeight }, style]}>
        <View style={[styles.content, { paddingTop: topInset }]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  transparentContainer: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});

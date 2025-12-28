/**
 * AnimatedSkiaBubbles - GPU-accelerated animated bubbles with text
 *
 * Renders animated circles with integrated text in a single Canvas.
 * Uses single SharedValue to drive all animations (proven pattern from Confetti.tsx).
 *
 * Performance:
 * - 1 Canvas for all bubbles (single GPU draw call)
 * - 1 SharedValue drives all animations (no per-element timers)
 * - All calculations run on UI thread via useDerivedValue
 *
 * Note: Uses Paragraph API for text rendering as matchFont() fails on iOS
 */

import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, useFonts } from '@shopify/react-native-skia';
import { AnimatedBubble } from './AnimatedBubble';
import type { AnimatedSkiaBubblesProps, AnimatedBubbleConfig } from './types';

export type { AnimatedBubbleConfig, AnimatedSkiaBubblesProps };

export const AnimatedSkiaBubbles = memo(function AnimatedSkiaBubbles({
  bubbles,
  progress,
  phaseOffset = 0.12,
  fontSize = 28,
  subtextFontSize = 13,
  flipProgresses,
}: AnimatedSkiaBubblesProps) {
  // Font manager for Paragraph API (works on iOS unlike matchFont)
  const fontMgr = useFonts({});

  // Don't render until font manager is ready
  if (!fontMgr) {
    return null;
  }

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {bubbles.map((bubble, i) => (
        <AnimatedBubble
          key={bubble.id}
          config={bubble}
          index={i}
          totalBubbles={bubbles.length}
          progress={progress}
          phaseOffset={phaseOffset}
          flipProgress={flipProgresses?.[i]}
          fontMgr={fontMgr}
          fontSize={fontSize}
          subtextFontSize={subtextFontSize}
        />
      ))}
    </Canvas>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

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
 */

import { memo, useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Canvas, matchFont, useFonts } from '@shopify/react-native-skia';
import { AnimatedBubble } from './AnimatedBubble';
import type { AnimatedSkiaBubblesProps, AnimatedBubbleConfig } from './types';

export type { AnimatedBubbleConfig, AnimatedSkiaBubblesProps };

const fontFamily = Platform.select({ ios: 'System', default: 'sans-serif' });

export const AnimatedSkiaBubbles = memo(function AnimatedSkiaBubbles({
  bubbles,
  progress,
  phaseOffset = 0.12,
  fontSize = 28,
  subtextFontSize = 13,
  flipProgresses,
}: AnimatedSkiaBubblesProps) {
  // Create fonts once (memoized)
  const fonts = useMemo(
    () => ({
      main: matchFont({ fontFamily, fontSize, fontWeight: '900' }),
      subtext: matchFont({ fontFamily, fontSize: subtextFontSize, fontWeight: '700' }),
    }),
    [fontSize, subtextFontSize]
  );

  // Font manager for emoji support (Paragraph API)
  const fontMgr = useFonts({});

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
          fonts={fonts}
          fontMgr={fontMgr}
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

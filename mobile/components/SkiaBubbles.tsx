/**
 * SkiaBubbles - GPU-accelerated solid color bubbles (Skia Canvas)
 *
 * Renders static solid circles in a single Canvas.
 * Used by reveal slides for performance (replaces 5× LinearGradient).
 *
 * Performance: 1 Canvas, 0 SharedValues (static rendering)
 */

import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface BubbleConfig {
  x: number;     // center X position
  y: number;     // center Y position
  size: number;  // diameter
  color: string; // hex color
}

interface SkiaBubblesProps {
  bubbles: BubbleConfig[];
}

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

/**
 * Container that renders all bubbles in a single Canvas
 */
export const SkiaBubbles = memo(function SkiaBubbles({
  bubbles,
}: SkiaBubblesProps) {
  console.log(`[SkiaBubbles] rendering ${bubbles.length} bubbles`);
  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {bubbles.map((bubble, i) => (
        <Circle
          key={i}
          cx={bubble.x}
          cy={bubble.y}
          r={bubble.size / 2}
          color={bubble.color}
        />
      ))}
    </Canvas>
  );
});

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

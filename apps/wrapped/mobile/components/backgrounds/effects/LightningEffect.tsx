/**
 * LightningEffect - Simple diagonal flashing lines (Skia Canvas)
 *
 * Used for: drama (intensity, interruptions)
 * Creates a dramatic feel with simple flashing diagonal lines.
 *
 * Performance: Minimal - just a few Line elements with opacity animation
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Line,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import type { ThemeColors } from '../../../../src/shared/theme-backgrounds/types';

interface LightningEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to convert RGB string to hex
function rgbToRgba(rgb: string, alpha: number): string {
  const [r, g, b] = rgb.split(',').map((s) => parseInt(s.trim(), 10));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Simple diagonal line configurations
const LINE_CONFIGS = [
  { x: 0.15, length: 0.4, angle: -15, strokeWidth: 2, cycleOffset: 0 },
  { x: 0.35, length: 0.5, angle: -12, strokeWidth: 1.5, cycleOffset: 0.2 },
  { x: 0.55, length: 0.35, angle: -18, strokeWidth: 2.5, cycleOffset: 0.4 },
  { x: 0.75, length: 0.45, angle: -10, strokeWidth: 1.5, cycleOffset: 0.6 },
  { x: 0.90, length: 0.3, angle: -20, strokeWidth: 2, cycleOffset: 0.8 },
];

export const LightningEffect = memo(function LightningEffect({
  colors,
  intensity = 1,
}: LightningEffectProps) {
  const baseOpacity = 0.4 * intensity;

  // Single progress drives all line animations
  const progress = useSharedValue(0);

  // Pre-compute colors
  const lineColor = useMemo(
    () => rgbToRgba(colors.accent, 1),
    [colors.accent]
  );

  useEffect(() => {
    // Continuous cycle: 0 → 1 over 4 seconds
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  return (
    <Canvas style={styles.canvas}>
      {LINE_CONFIGS.map((config, i) => (
        <FlashLine
          key={i}
          config={config}
          progress={progress}
          baseOpacity={baseOpacity}
          color={lineColor}
        />
      ))}
    </Canvas>
  );
});

interface FlashLineProps {
  config: (typeof LINE_CONFIGS)[0];
  progress: { value: number };
  baseOpacity: number;
  color: string;
}

const FlashLine = memo(function FlashLine({
  config,
  progress,
  baseOpacity,
  color,
}: FlashLineProps) {
  const startX = SCREEN_WIDTH * config.x;
  const startY = 0;
  const angleRad = config.angle * (Math.PI / 180);
  const length = SCREEN_HEIGHT * config.length;
  const endX = startX + Math.sin(angleRad) * length;
  const endY = startY + Math.cos(angleRad) * length;

  // Flash opacity - brief flash during cycle window
  const opacity = useDerivedValue(() => {
    const phase = (progress.value + config.cycleOffset) % 1;

    // Each line flashes for ~10% of its cycle
    if (phase < 0.02) {
      return baseOpacity * (phase / 0.02);
    } else if (phase < 0.05) {
      return baseOpacity;
    } else if (phase < 0.1) {
      return baseOpacity * (1 - (phase - 0.05) / 0.05);
    }
    return 0;
  }, [progress, baseOpacity]);

  return (
    <Line
      p1={vec(startX, startY)}
      p2={vec(endX, endY)}
      color={color}
      strokeWidth={config.strokeWidth}
      opacity={opacity}
    />
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

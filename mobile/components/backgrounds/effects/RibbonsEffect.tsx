/**
 * RibbonsEffect - Curved undulating paths (Skia Canvas)
 *
 * Used for: tone (emotional, flowing)
 * Creates an emotional, flowing feel with curved ribbon paths.
 *
 * Performance: Single Canvas with 1 SharedValue
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  LinearGradient,
  vec,
  Circle,
  Blur,
  Skia,
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

interface RibbonsEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to convert RGB string to rgba
function rgbToRgba(rgb: string, alpha: number): string {
  const [r, g, b] = rgb.split(',').map((s) => parseInt(s.trim(), 10));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Ribbon configurations
const RIBBON_CONFIGS = [
  { yPercent: 30, amplitude: 60, phaseOffset: 0, strokeWidth: 4 },
  { yPercent: 70, amplitude: 80, phaseOffset: 0.4, strokeWidth: 3 },
];

export const RibbonsEffect = memo(function RibbonsEffect({
  colors,
  intensity = 1,
}: RibbonsEffectProps) {
  const baseOpacity = 0.25 * intensity;

  // Single progress drives all ribbon animations
  const progress = useSharedValue(0);

  // Pre-compute colors
  const gradientColors = useMemo(() => [
    [
      rgbToRgba(colors.primary, 0),
      rgbToRgba(colors.primary, baseOpacity),
      rgbToRgba(colors.glow, baseOpacity * 1.2),
      rgbToRgba(colors.secondary, baseOpacity),
      rgbToRgba(colors.secondary, 0),
    ],
    [
      rgbToRgba(colors.secondary, 0),
      rgbToRgba(colors.secondary, baseOpacity * 0.8),
      rgbToRgba(colors.primary, baseOpacity),
      rgbToRgba(colors.glow, baseOpacity * 0.8),
      rgbToRgba(colors.glow, 0),
    ],
  ], [colors, baseOpacity]);

  const centerGlowColor = useMemo(
    () => rgbToRgba(colors.glow, baseOpacity * 0.15),
    [colors.glow, baseOpacity]
  );

  useEffect(() => {
    // Continuous horizontal scroll + wave motion
    progress.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  return (
    <Canvas style={styles.canvas}>
      {/* Center glow */}
      <Circle
        cx={SCREEN_WIDTH * 0.5}
        cy={SCREEN_HEIGHT * 0.5}
        r={SCREEN_WIDTH * 0.35}
        color={centerGlowColor}
      >
        <Blur blur={50} />
      </Circle>

      {/* Ribbons */}
      {RIBBON_CONFIGS.map((config, i) => (
        <Ribbon
          key={i}
          config={config}
          progress={progress}
          gradientColors={gradientColors[i]}
        />
      ))}
    </Canvas>
  );
});

interface RibbonProps {
  config: (typeof RIBBON_CONFIGS)[0];
  progress: { value: number };
  gradientColors: string[];
}

const Ribbon = memo(function Ribbon({
  config,
  progress,
  gradientColors,
}: RibbonProps) {
  const baseY = SCREEN_HEIGHT * (config.yPercent / 100);
  const width = SCREEN_WIDTH * 1.6;

  // Generate path that animates based on progress
  const path = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    const offsetX = -SCREEN_WIDTH * 0.3 + phase * SCREEN_WIDTH * 0.3;

    const skPath = Skia.Path.Make();
    skPath.moveTo(offsetX, baseY);

    const segments = 4;
    const segmentWidth = width / segments;

    for (let i = 0; i < segments; i++) {
      const x1 = offsetX + i * segmentWidth + segmentWidth * 0.3;
      const x2 = offsetX + i * segmentWidth + segmentWidth * 0.7;
      const x3 = offsetX + (i + 1) * segmentWidth;

      // Add wave motion based on progress
      const waveOffset = Math.sin((phase + i * 0.25) * Math.PI * 2) * 10;
      const direction = i % 2 === 0 ? 1 : -1;

      const y1 = baseY + config.amplitude * direction * 0.5 + waveOffset;
      const y2 = baseY + config.amplitude * direction + waveOffset;
      const y3 = baseY + waveOffset * 0.5;

      skPath.cubicTo(x1, y1, x2, y2, x3, y3);
    }

    return skPath;
  }, [progress]);

  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={config.strokeWidth}
      strokeCap="round"
    >
      <LinearGradient
        start={vec(0, baseY)}
        end={vec(SCREEN_WIDTH, baseY)}
        colors={gradientColors}
      />
    </Path>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

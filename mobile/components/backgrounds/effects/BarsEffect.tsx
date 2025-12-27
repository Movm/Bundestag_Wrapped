/**
 * BarsEffect - Vertical rising bars (Skia Canvas)
 *
 * Used for: speeches (energy, voice)
 * Creates an energetic, dynamic feel with rising/falling bars.
 *
 * Performance: Single Canvas with shared gradients
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Rect,
  LinearGradient,
  vec,
  Blur,
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

interface BarsEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const BAR_COUNT = 10;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to convert RGB string to rgba
function rgbToRgba(rgb: string, alpha: number): string {
  const [r, g, b] = rgb.split(',').map((s) => parseInt(s.trim(), 10));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Pre-generate bar configs
const generateBarConfigs = () => {
  return Array.from({ length: BAR_COUNT }, (_, index) => ({
    x: SCREEN_WIDTH * (0.05 + (index * 0.9) / BAR_COUNT),
    maxHeight: 0.3 + Math.random() * 0.4,
    minHeight: 0.1 + Math.random() * 0.15,
    width: 3 + Math.random() * 3,
    phaseOffset: index / BAR_COUNT,
    colorIndex: index % 2,
  }));
};

const BAR_CONFIGS = generateBarConfigs();

export const BarsEffect = memo(function BarsEffect({
  colors,
  intensity = 1,
}: BarsEffectProps) {
  const baseOpacity = 0.25 * intensity;

  // Single progress drives all bar animations
  const progress = useSharedValue(0);

  // Pre-compute gradient colors for both bar types
  const gradientColorSets = useMemo(() => [
    [
      rgbToRgba(colors.glow, 0.8),
      rgbToRgba(colors.primary, 0.6),
      rgbToRgba(colors.primary, 0.2),
    ],
    [
      rgbToRgba(colors.glow, 0.8),
      rgbToRgba(colors.secondary, 0.6),
      rgbToRgba(colors.secondary, 0.2),
    ],
  ], [colors]);

  const baseGlowColor = useMemo(
    () => rgbToRgba(colors.glow, baseOpacity * 0.2),
    [colors.glow, baseOpacity]
  );

  useEffect(() => {
    // Continuous cycle for bar animations
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true // Reverse for smooth up/down
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  return (
    <Canvas style={styles.canvas}>
      {/* Base glow at bottom */}
      <Rect
        x={0}
        y={SCREEN_HEIGHT * 0.85}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT * 0.15}
        color={baseGlowColor}
      >
        <Blur blur={20} />
      </Rect>

      {/* Bars */}
      {BAR_CONFIGS.map((config, i) => (
        <Bar
          key={i}
          config={config}
          progress={progress}
          baseOpacity={baseOpacity}
          gradientColors={gradientColorSets[config.colorIndex]}
        />
      ))}
    </Canvas>
  );
});

interface BarProps {
  config: (typeof BAR_CONFIGS)[0];
  progress: { value: number };
  baseOpacity: number;
  gradientColors: string[];
}

const Bar = memo(function Bar({
  config,
  progress,
  baseOpacity,
  gradientColors,
}: BarProps) {
  // Derive height from progress with phase offset
  const height = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    // Smooth oscillation between min and max height
    const t = Math.sin(phase * Math.PI);
    const heightPercent = config.minHeight + (config.maxHeight - config.minHeight) * t;
    return heightPercent * SCREEN_HEIGHT;
  }, [progress]);

  const opacity = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    const t = Math.sin(phase * Math.PI);
    return baseOpacity * (0.6 + 0.6 * t);
  }, [progress, baseOpacity]);

  // Y position (bars grow from bottom)
  const y = useDerivedValue(() => SCREEN_HEIGHT - height.value, [height]);

  return (
    <Rect
      x={config.x}
      y={y}
      width={config.width}
      height={height}
      opacity={opacity}
    >
      <LinearGradient
        start={vec(config.x, SCREEN_HEIGHT)}
        end={vec(config.x, SCREEN_HEIGHT * 0.3)}
        colors={gradientColors}
      />
    </Rect>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

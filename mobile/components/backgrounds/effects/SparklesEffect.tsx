/**
 * SparklesEffect - Dense particle bursts (Skia Canvas)
 *
 * Used for: swiftie (pop culture, playful)
 * Creates a magical, celebratory feel with sparkling particles.
 *
 * Performance: Single Canvas with ~1 SharedValue (vs 21 Views with ~50 SharedValues)
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Blur,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import type { ThemeColors } from '../../../../src/shared/theme-backgrounds/types';

interface SparklesEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const SPARKLE_COUNT = 12;
const RAY_COUNT = 8;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to convert RGB string "236, 72, 153" to hex "#EC4899"
function rgbToHex(rgb: string, alpha = 1): string {
  const [r, g, b] = rgb.split(',').map((s) => parseInt(s.trim(), 10));
  if (alpha < 1) {
    // Return rgba for transparency
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Pre-generate sparkle configs (static - no random per render)
const generateSparkleConfigs = () => {
  return Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
    x: (Math.random() * 0.8 + 0.1) * SCREEN_WIDTH,
    y: (Math.random() * 0.8 + 0.1) * SCREEN_HEIGHT,
    size: 3 + Math.random() * 5,
    phaseOffset: i / SPARKLE_COUNT, // Distribute phase evenly
  }));
};

const generateRayConfigs = () => {
  return Array.from({ length: RAY_COUNT }, (_, i) => ({
    angle: (360 / RAY_COUNT) * i * (Math.PI / 180),
    length: SCREEN_WIDTH * 0.15 + Math.random() * SCREEN_WIDTH * 0.1,
    phaseOffset: 0.3 + (i * 0.08), // Stagger ray animations
  }));
};

const SPARKLE_CONFIGS = generateSparkleConfigs();
const RAY_CONFIGS = generateRayConfigs();
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 2;

export const SparklesEffect = memo(function SparklesEffect({
  colors,
  intensity = 1,
}: SparklesEffectProps) {
  const baseOpacity = 0.4 * intensity;

  // Single progress value drives all animations (0 → 1, repeating)
  const progress = useSharedValue(0);

  // Pre-compute colors
  const sparkleColors = useMemo(() => {
    return SPARKLE_CONFIGS.map((_, i) => {
      const colorKey = i % 3 === 0 ? 'accent' : i % 3 === 1 ? 'primary' : 'glow';
      return rgbToHex(colors[colorKey]);
    });
  }, [colors]);

  const glowColor = useMemo(() => rgbToHex(colors.glow, 0.6), [colors.glow]);
  const rayColor = useMemo(() => rgbToHex(colors.glow, 0.8), [colors.glow]);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  return (
    <Canvas style={styles.canvas}>
      {/* Center burst glow */}
      <CenterBurst
        progress={progress}
        baseOpacity={baseOpacity}
        color={glowColor}
      />

      {/* Sparkles */}
      {SPARKLE_CONFIGS.map((config, i) => (
        <Sparkle
          key={`sparkle-${i}`}
          config={config}
          progress={progress}
          baseOpacity={baseOpacity}
          color={sparkleColors[i]}
        />
      ))}

      {/* Burst rays */}
      {RAY_CONFIGS.map((config, i) => (
        <BurstRay
          key={`ray-${i}`}
          config={config}
          progress={progress}
          baseOpacity={baseOpacity}
          color={rayColor}
        />
      ))}
    </Canvas>
  );
});

interface CenterBurstProps {
  progress: { value: number };
  baseOpacity: number;
  color: string;
}

const CenterBurst = memo(function CenterBurst({
  progress,
  baseOpacity,
  color,
}: CenterBurstProps) {
  const baseRadius = SCREEN_WIDTH * 0.2;

  // Derive scale and opacity from progress
  const radius = useDerivedValue(() => {
    const phase = progress.value;
    // Scale oscillates between 0.8 and 1.2
    const scale = 0.8 + 0.4 * Math.sin(phase * Math.PI * 2);
    return baseRadius * scale;
  }, [progress]);

  const opacity = useDerivedValue(() => {
    const phase = progress.value;
    // Opacity oscillates between 0.2 and 0.5 of base
    return baseOpacity * (0.2 + 0.3 * Math.sin(phase * Math.PI * 2));
  }, [progress, baseOpacity]);

  return (
    <Circle cx={CENTER_X} cy={CENTER_Y} r={radius} color={color} opacity={opacity}>
      <Blur blur={20} />
    </Circle>
  );
});

interface SparkleProps {
  config: (typeof SPARKLE_CONFIGS)[0];
  progress: { value: number };
  baseOpacity: number;
  color: string;
}

const Sparkle = memo(function Sparkle({
  config,
  progress,
  baseOpacity,
  color,
}: SparkleProps) {
  // Derive opacity from progress with phase offset
  const opacity = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    // Smooth pop in and out
    if (phase < 0.3) {
      return baseOpacity * (phase / 0.3);
    } else if (phase < 0.7) {
      return baseOpacity * (1 - (phase - 0.3) * 0.75);
    } else {
      return baseOpacity * 0.25 * (1 - (phase - 0.7) / 0.3);
    }
  }, [progress, baseOpacity]);

  const scale = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    if (phase < 0.3) {
      return 0.5 + 0.7 * (phase / 0.3); // Pop in
    } else if (phase < 0.5) {
      return 1.2 - 0.2 * ((phase - 0.3) / 0.2);
    } else {
      return 1.0 * (1 - (phase - 0.5) / 0.5);
    }
  }, [progress]);

  const r = useDerivedValue(() => config.size * scale.value, [scale]);

  return (
    <Circle cx={config.x} cy={config.y} r={r} color={color} opacity={opacity} />
  );
});

interface BurstRayProps {
  config: (typeof RAY_CONFIGS)[0];
  progress: { value: number };
  baseOpacity: number;
  color: string;
}

const BurstRay = memo(function BurstRay({
  config,
  progress,
  baseOpacity,
  color,
}: BurstRayProps) {
  // Rays shoot out periodically
  const opacity = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    if (phase < 0.1) {
      return baseOpacity * 0.6 * (phase / 0.1);
    } else if (phase < 0.2) {
      return baseOpacity * 0.6 * (1 - (phase - 0.1) / 0.1);
    }
    return 0;
  }, [progress, baseOpacity]);

  const length = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    if (phase < 0.15) {
      return config.length * (phase / 0.15);
    } else if (phase < 0.25) {
      return config.length * (1 - (phase - 0.15) / 0.1 * 0.2);
    }
    return 0;
  }, [progress]);

  // Calculate end point of ray
  const endX = useDerivedValue(
    () => CENTER_X + Math.cos(config.angle) * length.value,
    [length]
  );
  const endY = useDerivedValue(
    () => CENTER_Y + Math.sin(config.angle) * length.value,
    [length]
  );

  // Draw ray as a thick line (circle at end gives rounded effect)
  return (
    <Group opacity={opacity}>
      <Circle cx={endX} cy={endY} r={2} color={color} />
    </Group>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

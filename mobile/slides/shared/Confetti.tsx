/**
 * Confetti Component for React Native (Skia Canvas)
 *
 * Simple colored rectangle particles with German flag colors.
 * Performance: Single Canvas (vs 25 individual Views)
 */

import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  RoundedRect,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// German flag colors (like web version)
const DEFAULT_COLORS = ['#000000', '#DD0000', '#FFCC00'];

interface ParticleConfig {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  width: number;
  height: number;
  delay: number;
}

interface ConfettiProps {
  count?: number;
  colors?: string[];
}

// Generate particle configs once
const generateParticles = (count: number, colors: string[]): ParticleConfig[] => {
  return Array.from({ length: count }, (_, i) => {
    const size = 10 + Math.random() * 8; // 10-18px
    return {
      id: i,
      x: Math.random() * (SCREEN_WIDTH - 20),
      y: Math.random() * (SCREEN_HEIGHT - 20),
      rotation: Math.random() * 45 - 22.5, // -22.5 to 22.5 degrees
      color: colors[i % colors.length],
      width: size,
      height: size * 0.7,
      delay: (i / count) * 0.2, // Stagger 0-0.2 for cascade effect
    };
  });
};

/**
 * Single confetti particle drawn with Skia
 */
const ConfettiPiece = memo(function ConfettiPiece({
  config,
  progress,
}: {
  config: ParticleConfig;
  progress: { value: number };
}) {
  // Derive opacity and scale from progress with staggered delay
  const opacity = useDerivedValue(() => {
    const adjustedProgress = Math.max(0, progress.value - config.delay) / (1 - config.delay);
    if (adjustedProgress <= 0) return 0;
    if (adjustedProgress < 0.3) {
      // Fade in with slight overshoot
      return Math.min(1, adjustedProgress / 0.2);
    }
    return 1;
  }, [progress, config.delay]);

  const scale = useDerivedValue(() => {
    const adjustedProgress = Math.max(0, progress.value - config.delay) / (1 - config.delay);
    if (adjustedProgress <= 0) return 0.3;
    if (adjustedProgress < 0.2) {
      // Pop in effect
      return 0.3 + 0.7 * (adjustedProgress / 0.2);
    }
    return 1;
  }, [progress, config.delay]);

  const width = useDerivedValue(() => config.width * scale.value, [scale]);
  const height = useDerivedValue(() => config.height * scale.value, [scale]);

  // Center the scaled rectangle
  const x = useDerivedValue(
    () => config.x + (config.width - width.value) / 2,
    [width]
  );
  const y = useDerivedValue(
    () => config.y + (config.height - height.value) / 2,
    [height]
  );

  return (
    <RoundedRect
      x={x}
      y={y}
      width={width}
      height={height}
      r={2}
      color={config.color}
      opacity={opacity}
      transform={[{ rotate: config.rotation * (Math.PI / 180) }]}
      origin={{ x: config.x + config.width / 2, y: config.y + config.height / 2 }}
    />
  );
});

/**
 * Confetti container - static particles spread across screen
 */
export const Confetti = memo(function Confetti({
  count = 25,
  colors = DEFAULT_COLORS,
}: ConfettiProps) {
  // Animation progress (0 → 1)
  const progress = useSharedValue(0);

  // Pre-compute particle configurations
  const particles = useMemo<ParticleConfig[]>(
    () => generateParticles(count, colors),
    [count, colors]
  );

  useEffect(() => {
    // Start animation
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiPiece key={p.id} config={p} progress={progress} />
      ))}
    </Canvas>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

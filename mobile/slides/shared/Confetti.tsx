/**
 * Fine Glitter Confetti Component for React Native (Skia Canvas)
 *
 * GPU-accelerated falling particles with drift and spin.
 * Performance: Single Canvas + Single SharedValue drives all particles.
 */

import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  RoundedRect,
  vec,
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
  startX: number;
  startY: number;
  endY: number;
  driftX: number;
  rotateEnd: number;
  delay: number;
  color: string;
  size: number;
}

interface ConfettiProps {
  count?: number;
  colors?: string[];
}

// Pre-compute all particle configs (no Math.random during animation)
const generateParticles = (count: number, colors: string[]): ParticleConfig[] => {
  return Array.from({ length: count }, (_, i) => {
    const size = 4 + Math.random() * 4; // Fine glitter: 4-8px
    const startX = Math.random() * SCREEN_WIDTH;
    const startY = Math.random() * SCREEN_HEIGHT; // Spread across ENTIRE screen

    return {
      id: i,
      startX,
      startY,
      endY: startY + 30 + Math.random() * 50, // Gentle fall: 30-80px only
      driftX: (Math.random() - 0.5) * 120, // Drift ±60px
      rotateEnd: (Math.random() - 0.5) * 720, // Spin ±360°
      delay: Math.random() * 0.25, // Stagger 0-0.25s
      color: colors[i % colors.length],
      size,
    };
  });
};

/**
 * Single glitter particle with falling, drifting, spinning animation
 */
const GlitterPiece = memo(function GlitterPiece({
  config,
  progress,
}: {
  config: ParticleConfig;
  progress: { value: number };
}) {
  // Adjusted progress accounts for stagger delay
  const adjustedProgress = useDerivedValue(() => {
    const p = progress.value;
    if (p <= config.delay) return 0;
    return (p - config.delay) / (1 - config.delay);
  }, []);

  // X position: startX + drift over time
  const x = useDerivedValue(() => {
    const p = adjustedProgress.value;
    return config.startX + config.driftX * p;
  }, []);

  // Y position: fall from startY to endY
  const y = useDerivedValue(() => {
    const p = adjustedProgress.value;
    // Ease out for natural gravity feel
    const easedP = 1 - Math.pow(1 - p, 2);
    return config.startY + (config.endY - config.startY) * easedP;
  }, []);

  // Rotation: spin throughout animation
  const rotation = useDerivedValue(() => {
    const p = adjustedProgress.value;
    return (config.rotateEnd * p * Math.PI) / 180;
  }, []);

  // Scale: [0 → 1 → 0.5] three-stage animation
  const scale = useDerivedValue(() => {
    const p = adjustedProgress.value;
    if (p < 0.15) {
      // Pop in: 0 → 1
      return p / 0.15;
    } else if (p < 0.7) {
      // Stay full size
      return 1;
    } else {
      // Shrink: 1 → 0.5
      const shrinkP = (p - 0.7) / 0.3;
      return 1 - shrinkP * 0.5;
    }
  }, []);

  // Opacity: [1, 1, 0] - visible then fade at end
  const opacity = useDerivedValue(() => {
    const p = adjustedProgress.value;
    if (p < 0.7) {
      return 1;
    } else {
      // Fade out in last 30%
      return 1 - (p - 0.7) / 0.3;
    }
  }, []);

  // Animated size
  const width = useDerivedValue(() => config.size * scale.value, []);
  const height = useDerivedValue(() => config.size * scale.value, []);

  // Origin for rotation (center of particle)
  const origin = useDerivedValue(() => vec(x.value, y.value), []);

  return (
    <RoundedRect
      x={x}
      y={y}
      width={width}
      height={height}
      r={1}
      color={config.color}
      opacity={opacity}
      origin={origin}
      transform={[{ rotate: rotation.value }]}
    />
  );
});

/**
 * Fine glitter confetti - falling particles with drift and spin
 */
export const Confetti = memo(function Confetti({
  count = 150,
  colors = DEFAULT_COLORS,
}: ConfettiProps) {
  // Single animation progress drives all particles
  const progress = useSharedValue(0);

  // Pre-compute all particle configs once
  const particles = useMemo<ParticleConfig[]>(
    () => generateParticles(count, colors),
    [count, colors]
  );

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 1500,
      easing: Easing.out(Easing.quad),
    });

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {particles.map((p) => (
        <GlitterPiece key={p.id} config={p} progress={progress} />
      ))}
    </Canvas>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

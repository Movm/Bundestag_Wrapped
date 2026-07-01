/**
 * OrbsEffect - Floating gradient circles (Skia Canvas)
 *
 * Used for: common-words (familiar, grounded)
 * Creates a calm, friendly atmosphere with slowly drifting orbs.
 *
 * Performance: Single Canvas with 1 SharedValue (vs 3 Views × 4 SharedValues)
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Blur,
  RadialGradient,
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

interface OrbsEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to convert RGB string "236, 72, 153" to rgba
function rgbToRgba(rgb: string, alpha: number): string {
  const [r, g, b] = rgb.split(',').map((s) => parseInt(s.trim(), 10));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Orb configurations - positions and movement patterns
const ORB_CONFIGS = [
  {
    size: SCREEN_WIDTH * 0.4,
    startX: 0.15,
    startY: 0.20,
    driftX: 30,
    driftY: 40,
    phaseOffset: 0,
    colorIndex: 0,
  },
  {
    size: SCREEN_WIDTH * 0.3,
    startX: 0.60,
    startY: 0.55,
    driftX: -25,
    driftY: 30,
    phaseOffset: 0.33,
    colorIndex: 1,
  },
  {
    size: SCREEN_WIDTH * 0.35,
    startX: 0.35,
    startY: 0.75,
    driftX: 20,
    driftY: -35,
    phaseOffset: 0.66,
    colorIndex: 2,
  },
];

export const OrbsEffect = memo(function OrbsEffect({
  colors,
  intensity = 1,
}: OrbsEffectProps) {
  const baseOpacity = 0.2 * intensity;

  // Single progress drives all orb animations
  const progress = useSharedValue(0);

  // Pre-compute gradient color sets for each orb
  const colorSets = useMemo(() => {
    const sets = [
      [colors.primary, colors.glow],
      [colors.secondary, colors.primary],
      [colors.glow, colors.secondary],
    ];
    return sets.map((set) => [
      rgbToRgba(set[0], 0.6),
      rgbToRgba(set[1], 0.2),
      rgbToRgba(set[1], 0),
    ]);
  }, [colors]);

  const ambientColor = useMemo(
    () => rgbToRgba(colors.glow, baseOpacity * 0.1),
    [colors.glow, baseOpacity]
  );

  useEffect(() => {
    // Slow cycle over 12 seconds for smooth, dreamy movement
    progress.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true // Reverse for smooth back-and-forth
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  return (
    <Canvas style={styles.canvas}>
      {/* Central ambient glow */}
      <Circle
        cx={SCREEN_WIDTH * 0.5}
        cy={SCREEN_HEIGHT * 0.5}
        r={SCREEN_WIDTH * 0.3}
        color={ambientColor}
      >
        <Blur blur={40} />
      </Circle>

      {/* Floating orbs */}
      {ORB_CONFIGS.map((config, i) => (
        <Orb
          key={i}
          config={config}
          progress={progress}
          baseOpacity={baseOpacity}
          gradientColors={colorSets[config.colorIndex]}
        />
      ))}
    </Canvas>
  );
});

interface OrbProps {
  config: (typeof ORB_CONFIGS)[0];
  progress: { value: number };
  baseOpacity: number;
  gradientColors: string[];
}

const Orb = memo(function Orb({
  config,
  progress,
  baseOpacity,
  gradientColors,
}: OrbProps) {
  const baseX = SCREEN_WIDTH * config.startX;
  const baseY = SCREEN_HEIGHT * config.startY;
  const radius = config.size / 2;

  // Derive all transforms from single progress value
  const cx = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    // Smooth oscillation using sine wave
    const drift = Math.sin(phase * Math.PI * 2) * config.driftX;
    return baseX + drift;
  }, [progress]);

  const cy = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    // Slightly different phase for more organic movement
    const drift = Math.sin((phase + 0.25) * Math.PI * 2) * config.driftY;
    return baseY + drift;
  }, [progress]);

  const scale = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    // Gentle pulse: 0.95 to 1.1
    return 0.95 + 0.15 * Math.sin(phase * Math.PI * 2);
  }, [progress]);

  const opacity = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;
    // Subtle opacity variation: 0.7 to 1.3 of base
    return baseOpacity * (0.7 + 0.6 * Math.sin((phase + 0.5) * Math.PI * 2));
  }, [progress, baseOpacity]);

  const r = useDerivedValue(() => radius * scale.value, [scale]);

  return (
    <Circle cx={cx} cy={cy} r={r} opacity={opacity}>
      <RadialGradient
        c={vec(baseX, baseY)}
        r={radius}
        colors={gradientColors}
      />
      <Blur blur={20} />
    </Circle>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

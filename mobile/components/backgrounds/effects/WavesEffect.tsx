/**
 * WavesEffect - Horizontal flowing wave lines
 *
 * Used for: vocabulary (language, sound waves), moin (sea waves)
 * Creates a flowing, rhythmic feel with undulating horizontal lines.
 *
 * Mobile optimization: 3 wave lines (vs 5 on web).
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import type { ThemeColors } from '../../../../src/shared/theme-backgrounds/types';

interface WavesEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const WAVE_COUNT = 3;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Wave configurations - staggered positions and timings
const WAVE_CONFIGS = [
  { yPercent: 25, duration: 6000, amplitude: 15, delay: 0, thickness: 3 },
  { yPercent: 50, duration: 8000, amplitude: 20, delay: 500, thickness: 2 },
  { yPercent: 75, duration: 7000, amplitude: 12, delay: 1000, thickness: 2.5 },
];

export const WavesEffect = memo(function WavesEffect({
  colors,
  intensity = 1,
}: WavesEffectProps) {
  const baseOpacity = 0.25 * intensity;

  return (
    <View style={styles.container}>
      {WAVE_CONFIGS.map((config, index) => (
        <WaveLine
          key={index}
          config={config}
          colors={colors}
          baseOpacity={baseOpacity}
          index={index}
        />
      ))}

      {/* Ambient glow behind waves */}
      <View
        style={[
          styles.ambientGlow,
          { backgroundColor: `rgba(${colors.glow}, ${baseOpacity * 0.15})` },
        ]}
      />
    </View>
  );
});

interface WaveLineProps {
  config: (typeof WAVE_CONFIGS)[0];
  colors: ThemeColors;
  baseOpacity: number;
  index: number;
}

const WaveLine = memo(function WaveLine({
  config,
  colors,
  baseOpacity,
  index,
}: WaveLineProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(-SCREEN_WIDTH * 0.1);
  const opacity = useSharedValue(baseOpacity);

  // Alternate colors for visual interest - properly memoized
  const { backgroundColor, shadowColor } = useMemo(() => {
    const lineColor = index % 2 === 0 ? colors.primary : colors.secondary;
    return {
      backgroundColor: `rgba(${lineColor}, 1)`,
      shadowColor: `rgba(${colors.glow}, 1)`,
    };
  }, [colors.primary, colors.secondary, colors.glow, index]);

  useEffect(() => {
    // Vertical wave motion
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.amplitude, {
            duration: config.duration / 2,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-config.amplitude, {
            duration: config.duration / 2,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );

    // Subtle horizontal drift
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(SCREEN_WIDTH * 0.05, {
            duration: config.duration * 1.5,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(-SCREEN_WIDTH * 0.1, {
            duration: config.duration * 1.5,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    // Opacity pulse
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(baseOpacity * 1.2, { duration: config.duration / 2 }),
          withTiming(baseOpacity * 0.8, { duration: config.duration / 2 })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, baseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.waveLine,
        animatedStyle,
        {
          top: `${config.yPercent}%`,
          height: config.thickness,
          backgroundColor,
          shadowColor,
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  waveLine: {
    position: 'absolute',
    left: -SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 1.2,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  ambientGlow: {
    position: 'absolute',
    left: '10%',
    top: '30%',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 100,
  },
});

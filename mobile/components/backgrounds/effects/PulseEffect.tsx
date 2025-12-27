/**
 * PulseEffect - Concentric circles pulsing outward
 *
 * Used for: topics (information, data-viz)
 * Creates a data-visualization feel with expanding rings.
 *
 * Mobile optimization: 3 rings (vs 5 on web) for better performance.
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

interface PulseEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const RING_COUNT = 3;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = SCREEN_WIDTH * 1.4;

export const PulseEffect = memo(function PulseEffect({
  colors,
  intensity = 1,
}: PulseEffectProps) {
  const baseOpacity = 0.2 * intensity;

  const colorStyles = useMemo(
    () => ({
      centerGlow: `rgba(${colors.accent}, ${baseOpacity * 0.3})`,
      ringBorder: `rgba(${colors.primary}, ${baseOpacity})`,
    }),
    [colors, baseOpacity]
  );

  return (
    <View style={styles.container}>
      {/* Center glow - static */}
      <View style={[styles.centerGlow, { backgroundColor: colorStyles.centerGlow }]} />

      {/* Animated rings */}
      {Array.from({ length: RING_COUNT }).map((_, index) => (
        <PulseRing
          key={index}
          index={index}
          colors={colors}
          baseOpacity={baseOpacity}
        />
      ))}

      {/* Secondary pulse glow */}
      <SecondaryPulse colors={colors} baseOpacity={baseOpacity} />
    </View>
  );
});

interface PulseRingProps {
  index: number;
  colors: ThemeColors;
  baseOpacity: number;
}

const PulseRing = memo(function PulseRing({
  index,
  colors,
  baseOpacity,
}: PulseRingProps) {
  const scale = useSharedValue(0.05);
  const opacity = useSharedValue(baseOpacity);

  // Memoize border color
  const borderColor = useMemo(
    () => `rgba(${colors.primary}, 1)`,
    [colors.primary]
  );

  useEffect(() => {
    const delay = index * 2000; // 2s stagger between rings

    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(baseOpacity, { duration: 2000 }),
          withTiming(baseOpacity * 0.6, { duration: 3000 }),
          withTiming(0, { duration: 3000 })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, baseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.ring, animatedStyle, { borderColor }]} />;
});

interface SecondaryPulseProps {
  colors: ThemeColors;
  baseOpacity: number;
}

const SecondaryPulse = memo(function SecondaryPulse({
  colors,
  baseOpacity,
}: SecondaryPulseProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(baseOpacity * 0.5);

  // Memoize background color
  const backgroundColor = useMemo(
    () => `rgba(${colors.secondary}, ${baseOpacity * 0.3})`,
    [colors.secondary, baseOpacity]
  );

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(baseOpacity * 0.8, { duration: 3000 }),
        withTiming(baseOpacity * 0.5, { duration: 3000 })
      ),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.secondaryPulse, animatedStyle, { backgroundColor }]}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  centerGlow: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: SCREEN_WIDTH * 0.15,
    height: SCREEN_WIDTH * 0.15,
    marginLeft: -SCREEN_WIDTH * 0.075,
    marginTop: -SCREEN_WIDTH * 0.075,
    borderRadius: SCREEN_WIDTH * 0.075,
  },
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: RING_SIZE,
    height: RING_SIZE,
    marginLeft: -RING_SIZE / 2,
    marginTop: -RING_SIZE / 2,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  secondaryPulse: {
    position: 'absolute',
    left: '25%',
    top: '65%',
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.35,
    borderRadius: SCREEN_WIDTH * 0.175,
  },
});

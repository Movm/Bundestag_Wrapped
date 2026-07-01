/**
 * RaysEffect - Radiating sunburst lines
 *
 * Used for: finale (warmth, celebration)
 * Creates a warm, celebratory sunburst emanating from center.
 *
 * Mobile optimization: 10 rays (vs 32 on web).
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '../../../../src/shared/theme-backgrounds/types';

interface RaysEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const RAY_COUNT = 10;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const RaysEffect = memo(function RaysEffect({
  colors,
  intensity = 1,
}: RaysEffectProps) {
  const baseOpacity = 0.25 * intensity;

  // Generate ray angles evenly distributed
  const rayConfigs = useMemo(() => {
    return Array.from({ length: RAY_COUNT }).map((_, index) => ({
      angle: (360 / RAY_COUNT) * index,
      length: SCREEN_HEIGHT * (0.5 + Math.random() * 0.3),
      thickness: 2 + Math.random() * 2,
      duration: 4000 + Math.random() * 2000,
      delay: index * 150,
    }));
  }, []);

  return (
    <View style={styles.container}>
      {/* Center glow */}
      <CenterGlow colors={colors} baseOpacity={baseOpacity} />

      {/* Radiating rays */}
      {rayConfigs.map((config, index) => (
        <Ray
          key={index}
          config={config}
          colors={colors}
          baseOpacity={baseOpacity}
          index={index}
        />
      ))}

      {/* Outer ring pulse */}
      <RingPulse colors={colors} baseOpacity={baseOpacity} />
    </View>
  );
});

interface CenterGlowProps {
  colors: ThemeColors;
  baseOpacity: number;
}

const CenterGlow = memo(function CenterGlow({
  colors,
  baseOpacity,
}: CenterGlowProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(baseOpacity * 0.5);

  // Memoize background color
  const backgroundColor = useMemo(
    () => `rgba(${colors.accent}, 0.6)`,
    [colors.accent]
  );

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(baseOpacity * 0.7, { duration: 2000 }),
        withTiming(baseOpacity * 0.4, { duration: 2000 })
      ),
      -1,
      false
    );
  }, [baseOpacity, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.centerGlow, animatedStyle, { backgroundColor }]}
    />
  );
});

interface RayProps {
  config: {
    angle: number;
    length: number;
    thickness: number;
    duration: number;
    delay: number;
  };
  colors: ThemeColors;
  baseOpacity: number;
  index: number;
}

const Ray = memo(function Ray({
  config,
  colors,
  baseOpacity,
  index,
}: RayProps) {
  const scaleY = useSharedValue(0.8);
  const opacity = useSharedValue(baseOpacity * 0.5);

  // Memoize gradient colors
  const rayColor = index % 2 === 0 ? colors.primary : colors.glow;
  const gradientColors = useMemo(
    () =>
      [
        `rgba(${colors.accent}, 0.9)`,
        `rgba(${rayColor}, 0.4)`,
        `rgba(${rayColor}, 0)`,
      ] as const,
    [colors.accent, rayColor]
  );

  useEffect(() => {
    scaleY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(1.1, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.8, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(baseOpacity * 0.8, { duration: config.duration * 0.5 }),
          withTiming(baseOpacity * 0.3, { duration: config.duration * 0.5 })
        ),
        -1,
        false
      )
    );
  }, [config, baseOpacity, scaleY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${config.angle}deg` }, { scaleY: scaleY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ray,
        animatedStyle,
        { width: config.thickness, height: config.length },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
});

interface RingPulseProps {
  colors: ThemeColors;
  baseOpacity: number;
}

const RingPulse = memo(function RingPulse({
  colors,
  baseOpacity,
}: RingPulseProps) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(baseOpacity);

  // Memoize border color
  const borderColor = useMemo(
    () => `rgba(${colors.glow}, 1)`,
    [colors.glow]
  );

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
        withTiming(0.3, { duration: 0 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 3000 }),
        withTiming(baseOpacity, { duration: 0 })
      ),
      -1,
      false
    );
  }, [baseOpacity, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.ringPulse, animatedStyle, { borderColor }]} />
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_WIDTH * 0.25,
    borderRadius: SCREEN_WIDTH * 0.125,
  },
  ray: {
    position: 'absolute',
    borderRadius: 2,
    transformOrigin: 'center bottom',
    overflow: 'hidden',
  },
  ringPulse: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    borderWidth: 2,
  },
});

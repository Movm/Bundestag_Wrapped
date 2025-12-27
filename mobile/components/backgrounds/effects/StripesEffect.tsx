/**
 * StripesEffect - Horizontal bands
 *
 * Used for: moin (regional, friendly - northern sea horizon)
 * Creates a calm, coastal feel with horizontal stripes.
 *
 * Mobile optimization: 4 stripes (vs 6 on web).
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

interface StripesEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const STRIPE_COUNT = 4;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Stripe configurations - evenly spaced horizontal bands
const STRIPE_CONFIGS = [
  { yPercent: 20, height: 3, duration: 8000, delay: 0 },
  { yPercent: 40, height: 4, duration: 10000, delay: 500 },
  { yPercent: 60, height: 3, duration: 9000, delay: 1000 },
  { yPercent: 80, height: 2, duration: 11000, delay: 1500 },
];

export const StripesEffect = memo(function StripesEffect({
  colors,
  intensity = 1,
}: StripesEffectProps) {
  const baseOpacity = 0.2 * intensity;

  return (
    <View style={styles.container}>
      {/* Horizon glow */}
      <View
        style={[
          styles.horizonGlow,
          { backgroundColor: `rgba(${colors.glow}, ${baseOpacity * 0.15})` },
        ]}
      />

      {/* Stripe bands */}
      {STRIPE_CONFIGS.map((config, index) => (
        <Stripe
          key={index}
          config={config}
          colors={colors}
          baseOpacity={baseOpacity}
          index={index}
        />
      ))}

      {/* Corner accent */}
      <CornerAccent colors={colors} baseOpacity={baseOpacity} />
    </View>
  );
});

interface StripeProps {
  config: (typeof STRIPE_CONFIGS)[0];
  colors: ThemeColors;
  baseOpacity: number;
  index: number;
}

const Stripe = memo(function Stripe({
  config,
  colors,
  baseOpacity,
  index,
}: StripeProps) {
  const translateX = useSharedValue(-SCREEN_WIDTH * 0.2);
  const opacity = useSharedValue(baseOpacity);
  const scaleX = useSharedValue(1);

  // Memoize gradient colors
  const stripeColor = index % 2 === 0 ? colors.primary : colors.secondary;
  const gradientColors = useMemo(
    () =>
      [
        `rgba(${stripeColor}, 0)`,
        `rgba(${stripeColor}, 0.8)`,
        `rgba(${colors.glow}, 0.6)`,
        `rgba(${stripeColor}, 0.8)`,
        `rgba(${stripeColor}, 0)`,
      ] as const,
    [stripeColor, colors.glow]
  );

  useEffect(() => {
    // Slow horizontal drift (like ocean waves)
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(SCREEN_WIDTH * 0.1, {
            duration: config.duration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(-SCREEN_WIDTH * 0.2, {
            duration: config.duration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    // Gentle opacity pulse
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(baseOpacity * 1.3, { duration: config.duration * 0.5 }),
          withTiming(baseOpacity * 0.7, { duration: config.duration * 0.5 })
        ),
        -1,
        false
      )
    );

    // Subtle width pulse
    scaleX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: config.duration * 0.6 }),
          withTiming(0.98, { duration: config.duration * 0.4 })
        ),
        -1,
        false
      )
    );
  }, [config, baseOpacity, translateX, opacity, scaleX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scaleX: scaleX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.stripe,
        animatedStyle,
        { top: `${config.yPercent}%`, height: config.height },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
});

interface CornerAccentProps {
  colors: ThemeColors;
  baseOpacity: number;
}

const CornerAccent = memo(function CornerAccent({
  colors,
  baseOpacity,
}: CornerAccentProps) {
  const opacity = useSharedValue(baseOpacity * 0.5);

  const gradientColors = useMemo(
    () =>
      [
        `rgba(${colors.glow}, 0.4)`,
        `rgba(${colors.primary}, 0.2)`,
        `rgba(${colors.primary}, 0)`,
      ] as const,
    [colors.glow, colors.primary]
  );

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(baseOpacity * 0.7, {
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(baseOpacity * 0.3, {
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [baseOpacity, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.cornerAccent, animatedStyle]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  horizonGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '35%',
    height: SCREEN_HEIGHT * 0.3,
  },
  stripe: {
    position: 'absolute',
    left: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 1.4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_HEIGHT * 0.4,
    overflow: 'hidden',
  },
});

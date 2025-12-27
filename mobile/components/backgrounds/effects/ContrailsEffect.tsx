/**
 * ContrailsEffect - Diagonal streaks with parallax
 *
 * Used for: intro (welcome, celebration)
 * Creates a dynamic, celebratory feel with diagonal light streaks.
 *
 * Mobile optimization: 5 contrails (vs 8 on web).
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

interface ContrailsEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const CONTRAIL_COUNT = 5;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Contrail configurations - x values as fractions of screen width
const CONTRAIL_CONFIGS = [
  { angle: 38, length: SCREEN_HEIGHT * 0.8, thickness: 4, x: 0.10, y: -50, duration: 12000 },
  { angle: 42, length: SCREEN_HEIGHT * 0.6, thickness: 3, x: 0.30, y: -30, duration: 14000 },
  { angle: 35, length: SCREEN_HEIGHT * 0.9, thickness: 5, x: 0.55, y: -70, duration: 11000 },
  { angle: 40, length: SCREEN_HEIGHT * 0.7, thickness: 3, x: 0.75, y: -40, duration: 15000 },
  { angle: 45, length: SCREEN_HEIGHT * 0.5, thickness: 2, x: 0.90, y: -20, duration: 13000 },
];

export const ContrailsEffect = memo(function ContrailsEffect({
  colors,
  intensity = 1,
}: ContrailsEffectProps) {
  const baseOpacity = 0.3 * intensity;

  return (
    <View style={styles.container}>
      {CONTRAIL_CONFIGS.map((config, index) => (
        <Contrail
          key={index}
          config={config}
          colors={colors}
          baseOpacity={baseOpacity}
          index={index}
        />
      ))}

      {/* Central glow */}
      <View
        style={[
          styles.centerGlow,
          { backgroundColor: `rgba(${colors.glow}, ${baseOpacity * 0.15})` },
        ]}
      />
    </View>
  );
});

interface ContrailProps {
  config: (typeof CONTRAIL_CONFIGS)[0];
  colors: ThemeColors;
  baseOpacity: number;
  index: number;
}

const Contrail = memo(function Contrail({
  config,
  colors,
  baseOpacity,
  index,
}: ContrailProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(baseOpacity * (0.5 + index * 0.1));
  const scaleY = useSharedValue(1);

  // Memoize gradient colors to prevent re-renders
  const gradientColors = useMemo(() => {
    const contrailColor = index % 2 === 0 ? colors.primary : colors.secondary;
    return [
      `rgba(${colors.accent}, 0.8)`,
      `rgba(${contrailColor}, 0.5)`,
      `rgba(${colors.glow}, 0.3)`,
      `rgba(${contrailColor}, 0)`,
    ] as const;
  }, [colors.accent, colors.primary, colors.secondary, colors.glow, index]);

  useEffect(() => {
    const delay = index * 800;

    // Vertical floating motion
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(-30, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    // Opacity pulse
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(baseOpacity * 0.8, { duration: config.duration * 0.4 }),
          withTiming(baseOpacity * 0.3, { duration: config.duration * 0.6 })
        ),
        -1,
        false
      )
    );

    // Subtle length pulse
    scaleY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: config.duration * 0.5 }),
          withTiming(0.95, { duration: config.duration * 0.5 })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, baseOpacity, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${config.angle}deg` },
      { scaleY: scaleY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.contrail,
        animatedStyle,
        {
          left: SCREEN_WIDTH * config.x,
          top: config.y,
          width: config.thickness,
          height: config.length,
        },
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

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  contrail: {
    position: 'absolute',
    borderRadius: 4,
    overflow: 'hidden',
  },
  centerGlow: {
    position: 'absolute',
    left: '20%',
    top: '30%',
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 200,
  },
});

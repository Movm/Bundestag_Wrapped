/**
 * OrbsDecoration - Overlapping circles decoration (Skia)
 *
 * Used for: common-words section
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  ORB_CIRCLES,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  rgbToHex,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

/**
 * Single animated orb
 */
const AnimatedOrb = memo(function AnimatedOrb({
  orb,
  index,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
}: {
  orb: { cx: number; cy: number; r: number };
  index: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
}) {
  const animScale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 1000;

      animScale.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1, { duration: 350 })
      );
    } else {
      animScale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [animate, delay, index, animScale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: animScale.value }],
  }));

  const size = orb.r * 2;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: orb.cx - orb.r,
          top: orb.cy - orb.r,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: size, height: size }}>
        <Circle cx={orb.r} cy={orb.r} r={orb.r}>
          <RadialGradient
            c={vec(orb.r, orb.r)}
            r={orb.r}
            colors={[
              `${glowHex}CC`,
              `${primaryHex}66`,
              `${secondaryHex}00`,
            ]}
          />
        </Circle>
      </Canvas>
    </Animated.View>
  );
});

export const OrbsDecoration = memo(function OrbsDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.orbs;

  // Memoize hex color conversions
  const hexColors = useMemo(
    () => ({
      glow: rgbToHex(colors.glow),
      primary: rgbToHex(colors.primary),
      secondary: rgbToHex(colors.secondary),
    }),
    [colors.glow, colors.primary, colors.secondary]
  );

  return (
    <View style={[styles.container, { width, height, transform: [{ scale }] }]}>
      {ORB_CIRCLES.map((orb, index) => (
        <AnimatedOrb
          key={index}
          orb={orb}
          index={index}
          glowHex={hexColors.glow}
          primaryHex={hexColors.primary}
          secondaryHex={hexColors.secondary}
          delay={delay}
          animate={animate}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});

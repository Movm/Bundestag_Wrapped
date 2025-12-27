/**
 * OrbsDecoration - Overlapping circles SVG decoration
 *
 * Used for: common-words section
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <Defs>
          {ORB_CIRCLES.map((orb, index) => (
            <RadialGradient
              key={index}
              id={`orb-gradient-${side}-${index}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop offset="0%" stopColor={hexColors.glow} stopOpacity="0.8" />
              <Stop offset="60%" stopColor={hexColors.primary} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={hexColors.secondary} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>

        {ORB_CIRCLES.map((orb, index) => (
          <AnimatedOrb
            key={index}
            index={index}
            orb={orb}
            gradientId={`orb-gradient-${side}-${index}`}
            delay={delay}
            animate={animate}
          />
        ))}
      </Svg>
    </View>
  );
});

interface AnimatedOrbProps {
  index: number;
  orb: { cx: number; cy: number; r: number };
  gradientId: string;
  delay: number;
  animate: boolean;
}

const AnimatedOrb = memo(function AnimatedOrb({
  index,
  orb,
  gradientId,
  delay,
  animate,
}: AnimatedOrbProps) {
  const scaleVal = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 2000;

      scaleVal.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.drawDuration * 1000,
          easing: Easing.out(Easing.back(1.5)),
        })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.fadeInDuration * 1000,
        })
      );
    } else {
      scaleVal.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [animate, delay, index, scaleVal, opacity]);

  const animatedProps = useAnimatedProps(() => ({
    r: orb.r * scaleVal.value,
    opacity: opacity.value,
  }));

  return (
    <AnimatedCircle
      cx={orb.cx}
      cy={orb.cy}
      fill={`url(#${gradientId})`}
      animatedProps={animatedProps}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * PulseDecoration - Concentric circles SVG decoration
 *
 * Used for: topics, grid sections
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  PULSE_CIRCLES,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  createGradientStops,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const PulseDecoration = memo(function PulseDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.pulse;
  const gradientStops = useMemo(() => createGradientStops(colors), [colors]);
  const gradientId = `pulse-gradient-${side}`;

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {gradientStops.map((stop, i) => (
              <Stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>

        {PULSE_CIRCLES.map((circle, index) => (
          <AnimatedPulseCircle
            key={index}
            index={index}
            circle={circle}
            gradientId={gradientId}
            delay={delay}
            animate={animate}
          />
        ))}
      </Svg>
    </View>
  );
});

interface AnimatedCircleProps {
  index: number;
  circle: { cx: number; cy: number; r: number };
  gradientId: string;
  delay: number;
  animate: boolean;
}

const AnimatedPulseCircle = memo(function AnimatedPulseCircle({
  index,
  circle,
  gradientId,
  delay,
  animate,
}: AnimatedCircleProps) {
  const pathLength = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 1500;

      pathLength.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.drawDuration * 800,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1 - index * 0.2, {
          duration: DECORATION_TIMINGS.fadeInDuration * 1000,
        })
      );
    } else {
      pathLength.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [animate, delay, index, pathLength, opacity]);

  const circumference = 2 * Math.PI * circle.r;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - pathLength.value),
    opacity: opacity.value,
  }));

  return (
    <AnimatedCircle
      cx={circle.cx}
      cy={circle.cy}
      r={circle.r}
      stroke={`url(#${gradientId})`}
      strokeWidth={10 - index * 2}
      strokeLinecap="round"
      strokeDasharray={circumference}
      fill="none"
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

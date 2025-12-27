/**
 * GradientDecoration - Subtle horizontal lines SVG decoration
 *
 * Used for: discriminatory section (minimal, muted)
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  GRADIENT_LINES,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  createGradientStops,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

const AnimatedLine = Animated.createAnimatedComponent(Line);

export const GradientDecoration = memo(function GradientDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.gradient;
  const gradientStops = useMemo(() => createGradientStops(colors), [colors]);
  const gradientId = `gradient-lines-${side}`;

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientStops.map((stop, i) => (
              <Stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>

        {GRADIENT_LINES.map((line, index) => (
          <AnimatedGradientLine
            key={index}
            index={index}
            line={line}
            gradientId={gradientId}
            delay={delay}
            animate={animate}
            viewWidth={width}
          />
        ))}
      </Svg>
    </View>
  );
});

interface AnimatedLineProps {
  index: number;
  line: { y: number; width: number; opacity: number };
  gradientId: string;
  delay: number;
  animate: boolean;
  viewWidth: number;
}

const AnimatedGradientLine = memo(function AnimatedGradientLine({
  index,
  line,
  gradientId,
  delay,
  animate,
  viewWidth,
}: AnimatedLineProps) {
  const pathLength = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 1500;

      pathLength.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.drawDuration * 1200,
          easing: Easing.inOut(Easing.ease),
        })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(line.opacity, {
          duration: DECORATION_TIMINGS.fadeInDuration * 1000,
        })
      );
    } else {
      pathLength.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [animate, delay, index, line.opacity, pathLength, opacity]);

  const x1 = (viewWidth - line.width) / 2;
  const x2 = x1 + line.width;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: line.width * (1 - pathLength.value),
    opacity: opacity.value,
  }));

  return (
    <AnimatedLine
      x1={x1}
      y1={line.y}
      x2={x2}
      y2={line.y}
      stroke={`url(#${gradientId})`}
      strokeWidth={4}
      strokeLinecap="round"
      strokeDasharray={line.width}
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

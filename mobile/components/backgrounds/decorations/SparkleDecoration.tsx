/**
 * SparkleDecoration - Four-point star SVG decoration
 *
 * Used for: swiftie, rays sections
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  SPARKLE_PATH,
  SPARKLE_POSITIONS,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  createGradientStops,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

const AnimatedG = Animated.createAnimatedComponent(G);

export const SparkleDecoration = memo(function SparkleDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.sparkle;
  const gradientStops = useMemo(() => createGradientStops(colors), [colors]);
  const gradientId = `sparkle-gradient-${side}`;

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

        {SPARKLE_POSITIONS.map((sparkle, index) => (
          <AnimatedSparkle
            key={index}
            index={index}
            sparkle={sparkle}
            gradientId={gradientId}
            delay={delay}
            animate={animate}
          />
        ))}
      </Svg>
    </View>
  );
});

interface AnimatedSparkleProps {
  index: number;
  sparkle: { x: number; y: number; scale: number; rotation: number };
  gradientId: string;
  delay: number;
  animate: boolean;
}

const AnimatedSparkle = memo(function AnimatedSparkle({
  index,
  sparkle,
  gradientId,
  delay,
  animate,
}: AnimatedSparkleProps) {
  const scaleVal = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 1500;

      scaleVal.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.drawDuration * 600,
          easing: Easing.out(Easing.back(2)),
        })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.fadeInDuration * 800,
        })
      );
    } else {
      scaleVal.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [animate, delay, index, scaleVal, opacity]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: sparkle.x },
      { translateY: sparkle.y },
      { rotate: `${sparkle.rotation}deg` },
      { scale: sparkle.scale * scaleVal.value },
    ],
  }));

  return (
    <AnimatedG animatedProps={animatedProps}>
      <Path
        d={SPARKLE_PATH}
        fill={`url(#${gradientId})`}
      />
    </AnimatedG>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

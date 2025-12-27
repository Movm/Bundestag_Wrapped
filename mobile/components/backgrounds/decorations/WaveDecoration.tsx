/**
 * WaveDecoration - Horizontal wave lines SVG decoration
 *
 * Used for: vocabulary, moin, stripes sections
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  WAVE_PATHS,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  createGradientStops,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const WaveDecoration = memo(function WaveDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.wave;
  const gradientStops = useMemo(() => createGradientStops(colors), [colors]);
  const gradientId = `wave-gradient-${side}`;

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

        {WAVE_PATHS.map((path, index) => (
          <AnimatedWavePath
            key={index}
            index={index}
            d={path}
            gradientId={gradientId}
            delay={delay}
            animate={animate}
          />
        ))}
      </Svg>
    </View>
  );
});

interface AnimatedWavePathProps {
  index: number;
  d: string;
  gradientId: string;
  delay: number;
  animate: boolean;
}

const AnimatedWavePath = memo(function AnimatedWavePath({
  index,
  d,
  gradientId,
  delay,
  animate,
}: AnimatedWavePathProps) {
  const pathLength = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 1500;

      pathLength.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.drawDuration * 1000,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1 - index * 0.15, {
          duration: DECORATION_TIMINGS.fadeInDuration * 1000,
        })
      );
    } else {
      pathLength.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [animate, delay, index, pathLength, opacity]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 200 * (1 - pathLength.value),
    opacity: opacity.value,
  }));

  return (
    <AnimatedPath
      d={d}
      stroke={`url(#${gradientId})`}
      strokeWidth={6 - index}
      strokeLinecap="round"
      strokeDasharray={200}
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

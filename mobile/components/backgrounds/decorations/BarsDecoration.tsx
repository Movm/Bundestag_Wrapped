/**
 * BarsDecoration - Vertical equalizer bars SVG decoration
 *
 * Used for: speeches section
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  BAR_CONFIGS,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  createGradientStops,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const BarsDecoration = memo(function BarsDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.bars;
  const gradientStops = useMemo(() => createGradientStops(colors), [colors]);
  const gradientId = `bars-gradient-${side}`;

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            {gradientStops.map((stop, i) => (
              <Stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>

        {BAR_CONFIGS.map((bar, index) => (
          <AnimatedBar
            key={index}
            index={index}
            bar={bar}
            gradientId={gradientId}
            delay={delay}
            animate={animate}
            viewHeight={height}
          />
        ))}
      </Svg>
    </View>
  );
});

interface AnimatedBarProps {
  index: number;
  bar: { x: number; height: number; width?: number };
  gradientId: string;
  delay: number;
  animate: boolean;
  viewHeight: number;
}

const AnimatedBar = memo(function AnimatedBar({
  index,
  bar,
  gradientId,
  delay,
  animate,
  viewHeight,
}: AnimatedBarProps) {
  const scaleY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 1200;

      scaleY.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.drawDuration * 800,
          easing: Easing.out(Easing.back(1.2)),
        })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: DECORATION_TIMINGS.fadeInDuration * 1000,
        })
      );
    } else {
      scaleY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [animate, delay, index, scaleY, opacity]);

  const barWidth = bar.width || 16;
  const y = viewHeight - bar.height;

  const animatedProps = useAnimatedProps(() => ({
    height: bar.height * scaleY.value,
    y: viewHeight - bar.height * scaleY.value,
    opacity: opacity.value,
  }));

  return (
    <AnimatedRect
      x={bar.x}
      width={barWidth}
      rx={barWidth / 2}
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

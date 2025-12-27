/**
 * RibbonDecoration - Flowing S-curve SVG decoration
 *
 * Used for: tone, contrails, ribbons sections
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
  RIBBON_PATH,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  createGradientStops,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const RibbonDecoration = memo(function RibbonDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.ribbon;
  const pathLength = useSharedValue(0);
  const pathOpacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;

      pathLength.value = withDelay(
        delayMs,
        withTiming(1, {
          duration: DECORATION_TIMINGS.drawDuration * 1000,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        })
      );

      pathOpacity.value = withDelay(
        delayMs,
        withTiming(1, {
          duration: DECORATION_TIMINGS.fadeInDuration * 1000,
        })
      );
    } else {
      pathLength.value = withTiming(0, { duration: 300 });
      pathOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [animate, delay, pathLength, pathOpacity]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 500 * (1 - pathLength.value),
    opacity: pathOpacity.value,
  }));

  const gradientStops = useMemo(() => createGradientStops(colors), [colors]);
  const gradientId = `ribbon-gradient-${side}`;

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
        <AnimatedPath
          d={RIBBON_PATH}
          stroke={`url(#${gradientId})`}
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={500}
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * LightningDecoration - Zigzag bolt SVG decoration
 *
 * Used for: drama section
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
  LIGHTNING_PATH,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  createGradientStops,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const LightningDecoration = memo(function LightningDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.lightning;
  const pathLength = useSharedValue(0);
  const pathOpacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;

      pathLength.value = withDelay(
        delayMs,
        withTiming(1, {
          duration: DECORATION_TIMINGS.drawDuration * 600,
          easing: Easing.out(Easing.ease),
        })
      );

      pathOpacity.value = withDelay(
        delayMs,
        withTiming(1, {
          duration: DECORATION_TIMINGS.fadeInDuration * 800,
        })
      );
    } else {
      pathLength.value = withTiming(0, { duration: 300 });
      pathOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [animate, delay, pathLength, pathOpacity]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 400 * (1 - pathLength.value),
    opacity: pathOpacity.value,
  }));

  const gradientStops = useMemo(() => createGradientStops(colors), [colors]);
  const gradientId = `lightning-gradient-${side}`;

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
          d={LIGHTNING_PATH}
          stroke={`url(#${gradientId})`}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={400}
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

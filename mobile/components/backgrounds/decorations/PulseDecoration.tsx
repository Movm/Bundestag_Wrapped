/**
 * PulseDecoration - Concentric circles decoration (Skia)
 *
 * Used for: topics, grid sections
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, LinearGradient, vec, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  PULSE_CIRCLES,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  type DecorationProps,
} from '../../../../src/shared/decorations/paths';

/**
 * Convert RGB string "r, g, b" to hex "#rrggbb"
 */
function rgbToHex(rgb: string): string {
  const parts = rgb.split(',').map((n) => parseInt(n.trim(), 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    return '#888888';
  }
  const [r, g, b] = parts;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Single animated circle
 */
const AnimatedPulseCircle = memo(function AnimatedPulseCircle({
  circle,
  index,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
}: {
  circle: { cx: number; cy: number; r: number };
  index: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
}) {
  const opacity = useSharedValue(0);
  const animScale = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 800;

      animScale.value = withDelay(
        staggerDelay,
        withTiming(1, { duration: 400 })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1 - index * 0.2, { duration: 350 })
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

  const strokeWidth = 10 - index * 2;

  return (
    <Animated.View style={[styles.circleContainer, animatedStyle]}>
      <Canvas style={{ width: circle.r * 2 + 20, height: circle.r * 2 + 20 }}>
        <Circle
          cx={circle.r + 10}
          cy={circle.r + 10}
          r={circle.r}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(circle.r * 2, circle.r * 2)}
            colors={[glowHex, primaryHex, secondaryHex]}
          />
        </Circle>
      </Canvas>
    </Animated.View>
  );
});

export const PulseDecoration = memo(function PulseDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.pulse;

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  return (
    <View style={[styles.container, { width, height, transform: [{ scale }] }]}>
      {PULSE_CIRCLES.map((circle, index) => (
        <AnimatedPulseCircle
          key={index}
          circle={circle}
          index={index}
          glowHex={glowHex}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
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
  circleContainer: {
    position: 'absolute',
  },
});

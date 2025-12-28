/**
 * GradientDecoration - Subtle horizontal lines decoration (Skia)
 *
 * Used for: discriminatory section (minimal, muted)
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Line, LinearGradient, vec } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  GRADIENT_LINES,
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
 * Single animated gradient line
 */
const AnimatedGradientLine = memo(function AnimatedGradientLine({
  line,
  index,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
  viewWidth,
}: {
  line: { y: number; width: number; opacity: number };
  index: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
  viewWidth: number;
}) {
  const scaleX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 800;

      scaleX.value = withDelay(
        staggerDelay,
        withTiming(1, { duration: 400 })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(line.opacity, { duration: 350 })
      );
    } else {
      scaleX.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [animate, delay, index, line.opacity, scaleX, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: scaleX.value }],
  }));

  const x1 = (viewWidth - line.width) / 2;
  const x2 = x1 + line.width;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: line.y - 2,
          left: 0,
          width: viewWidth,
          height: 8,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: viewWidth, height: 8 }}>
        <Line
          p1={vec(x1, 4)}
          p2={vec(x2, 4)}
          strokeWidth={4}
          strokeCap="round"
        >
          <LinearGradient
            start={vec(x1, 4)}
            end={vec(x2, 4)}
            colors={[glowHex, primaryHex, secondaryHex]}
          />
        </Line>
      </Canvas>
    </Animated.View>
  );
});

export const GradientDecoration = memo(function GradientDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.gradient;

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  return (
    <View style={[styles.container, { width, height, transform: [{ scale }] }]}>
      {GRADIENT_LINES.map((line, index) => (
        <AnimatedGradientLine
          key={index}
          line={line}
          index={index}
          glowHex={glowHex}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
          delay={delay}
          animate={animate}
          viewWidth={width}
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

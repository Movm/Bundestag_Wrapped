/**
 * BarsDecoration - Vertical equalizer bars decoration (Skia)
 *
 * Used for: speeches section
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, LinearGradient, vec } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  BAR_CONFIGS,
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
 * Single animated bar
 */
const AnimatedBar = memo(function AnimatedBar({
  bar,
  index,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
  viewHeight,
}: {
  bar: { x: number; height: number; width?: number };
  index: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
  viewHeight: number;
}) {
  const scaleY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 800;

      scaleY.value = withDelay(
        staggerDelay,
        withTiming(1, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        })
      );

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1, { duration: 350 })
      );
    } else {
      scaleY.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [animate, delay, index, scaleY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scaleY.value }],
  }));

  const barWidth = bar.width || 16;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: bar.x - barWidth / 2,
          bottom: 0,
          width: barWidth,
          height: bar.height,
          transformOrigin: 'bottom',
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: barWidth, height: bar.height }}>
        <RoundedRect
          x={0}
          y={0}
          width={barWidth}
          height={bar.height}
          r={barWidth / 2}
        >
          <LinearGradient
            start={vec(0, bar.height)}
            end={vec(0, 0)}
            colors={[secondaryHex, primaryHex, glowHex]}
          />
        </RoundedRect>
      </Canvas>
    </Animated.View>
  );
});

export const BarsDecoration = memo(function BarsDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.bars;

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  return (
    <View style={[styles.container, { width, height, transform: [{ scale }] }]}>
      {BAR_CONFIGS.map((bar, index) => (
        <AnimatedBar
          key={index}
          bar={bar}
          index={index}
          glowHex={glowHex}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
          delay={delay}
          animate={animate}
          viewHeight={height}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
});

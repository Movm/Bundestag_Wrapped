/**
 * SparkleDecoration - Four-point star decoration (Skia)
 *
 * Used for: swiftie, rays sections
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  SPARKLE_PATH,
  SPARKLE_POSITIONS,
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
 * Single animated sparkle
 */
const AnimatedSparkle = memo(function AnimatedSparkle({
  sparkle,
  index,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
}: {
  sparkle: { x: number; y: number; scale: number; rotation: number };
  index: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
}) {
  const animScale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 1000;

      animScale.value = withDelay(
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
      animScale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [animate, delay, index, animScale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: sparkle.x },
      { translateY: sparkle.y },
      { rotate: `${sparkle.rotation}deg` },
      { scale: sparkle.scale * animScale.value },
    ],
  }));

  // Pre-compute path
  const path = useMemo(() => Skia.Path.MakeFromSVGString(SPARKLE_PATH), []);

  return (
    <Animated.View style={[styles.sparkleContainer, animatedStyle]}>
      <Canvas style={{ width: 24, height: 24 }}>
        {path && (
          <Path path={path}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(24, 24)}
              colors={[glowHex, primaryHex, secondaryHex]}
            />
          </Path>
        )}
      </Canvas>
    </Animated.View>
  );
});

export const SparkleDecoration = memo(function SparkleDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.sparkle;

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  return (
    <View style={[styles.container, { width, height, transform: [{ scale }] }]}>
      {SPARKLE_POSITIONS.map((sparkle, index) => (
        <AnimatedSparkle
          key={index}
          sparkle={sparkle}
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
  sparkleContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
});

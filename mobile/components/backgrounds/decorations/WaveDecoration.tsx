/**
 * WaveDecoration - Horizontal wave lines decoration (Skia)
 *
 * Used for: vocabulary, moin, stripes sections
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
  WAVE_PATHS,
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
 * Single animated wave path
 */
const AnimatedWavePath = memo(function AnimatedWavePath({
  d,
  index,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
  viewWidth,
  viewHeight,
}: {
  d: string;
  index: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
  viewWidth: number;
  viewHeight: number;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const staggerDelay = delay * 1000 + index * DECORATION_TIMINGS.staggerDelay * 800;

      opacity.value = withDelay(
        staggerDelay,
        withTiming(1 - index * 0.15, { duration: 350 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [animate, delay, index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Pre-compute path
  const path = useMemo(() => Skia.Path.MakeFromSVGString(d), [d]);

  const strokeWidth = 6 - index;

  return (
    <Animated.View style={[styles.waveContainer, animatedStyle]}>
      <Canvas style={{ width: viewWidth, height: viewHeight }}>
        {path && (
          <Path
            path={path}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(viewWidth, 0)}
              colors={[glowHex, primaryHex, secondaryHex]}
            />
          </Path>
        )}
      </Canvas>
    </Animated.View>
  );
});

export const WaveDecoration = memo(function WaveDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.wave;

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  return (
    <View style={[styles.container, { width, height, transform: [{ scale }] }]}>
      {WAVE_PATHS.map((pathD, index) => (
        <AnimatedWavePath
          key={index}
          d={pathD}
          index={index}
          glowHex={glowHex}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
          delay={delay}
          animate={animate}
          viewWidth={width}
          viewHeight={height}
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
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

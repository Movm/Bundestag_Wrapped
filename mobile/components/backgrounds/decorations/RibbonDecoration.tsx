/**
 * RibbonDecoration - Flowing S-curve decoration (Skia)
 *
 * Used for: tone, contrails, ribbons sections
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  RIBBON_PATH,
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

export const RibbonDecoration = memo(function RibbonDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
  scale = 1,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.ribbon;
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;
      opacity.value = withDelay(delayMs, withTiming(1, { duration: 400 }));
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [animate, delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Pre-compute path
  const path = useMemo(() => Skia.Path.MakeFromSVGString(RIBBON_PATH), []);

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <Animated.View style={animatedStyle}>
        <Canvas style={{ width, height }}>
          {path && (
            <Path
              path={path}
              style="stroke"
              strokeWidth={10}
              strokeCap="round"
              strokeJoin="round"
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={[glowHex, primaryHex, secondaryHex]}
              />
            </Path>
          )}
        </Canvas>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

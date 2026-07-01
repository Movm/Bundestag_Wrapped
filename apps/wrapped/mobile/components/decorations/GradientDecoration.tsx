/**
 * GradientDecoration - Subtle horizontal lines (Skia)
 *
 * Used for: Discriminatory section (somber, muted)
 * Animation: Slow fade-in with minimal movement
 */

import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, Line, LinearGradient, vec, Group } from '@shopify/react-native-skia';
import {
  GRADIENT_LINES,
  DECORATION_VIEWBOX,
  type DecorationProps,
} from '../../../src/shared/decorations/paths';

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

export const GradientDecoration = memo(function GradientDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.gradient;
  const containerWidth = 70;
  const containerHeight = 120;

  // Animation values - subtle fade only
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;
      opacity.value = withDelay(delayMs, withTiming(0.6, { duration: 400 }));
    } else {
      opacity.value = 0;
    }
  }, [animate, delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: side === 'right' ? -1 : 1 }],
  }));

  // Convert theme colors to hex - use muted colors
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  // Scale factor from viewbox to container
  const scaleX = containerWidth / width;
  const scaleY = containerHeight / height;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Canvas style={{ width: containerWidth, height: containerHeight }}>
        <Group transform={[{ scaleX }, { scaleY }]}>
          {GRADIENT_LINES.map((line, i) => (
            <Group key={i} opacity={line.opacity}>
              <Line
                p1={vec(10, line.y)}
                p2={vec(10 + line.width, line.y)}
                strokeWidth={3}
                strokeCap="round"
              >
                <LinearGradient
                  start={vec(10, line.y)}
                  end={vec(10 + line.width, line.y)}
                  colors={[
                    `${primaryHex}00`,
                    `${primaryHex}80`,
                    `${secondaryHex}00`,
                  ]}
                />
              </Line>
            </Group>
          ))}
        </Group>
      </Canvas>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 70,
    height: 120,
  },
});

/**
 * WaveDecoration - Horizontal flowing sine waves (Skia)
 *
 * Used for: Vocabulary, Moin sections
 * Animation: Staggered fade-in with slight horizontal movement
 */

import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, Path, Skia, LinearGradient, vec, Group } from '@shopify/react-native-skia';
import {
  WAVE_PATHS,
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

export const WaveDecoration = memo(function WaveDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.wave;
  const containerWidth = 90;
  const containerHeight = 120;

  // Animation values
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;
      opacity.value = withDelay(delayMs, withTiming(1, { duration: 400 }));
    } else {
      opacity.value = 0;
    }
  }, [animate, delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: side === 'right' ? -1 : 1 }],
  }));

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  // Pre-compute paths
  const paths = useMemo(() =>
    WAVE_PATHS.map(d => Skia.Path.MakeFromSVGString(d)),
    []
  );

  // Scale factor from viewbox to container
  const scaleX = containerWidth / width;
  const scaleY = containerHeight / height;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Canvas style={{ width: containerWidth, height: containerHeight }}>
        {paths.map((path, i) => (
          path && (
            <Group key={i} opacity={1 - i * 0.15} transform={[{ scaleX }, { scaleY }]}>
              <Path
                path={path}
                style="stroke"
                strokeWidth={6}
                strokeCap="round"
              >
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(width, 0)}
                  colors={[glowHex, primaryHex, secondaryHex]}
                />
              </Path>
            </Group>
          )
        ))}
      </Canvas>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 90,
    height: 120,
  },
});

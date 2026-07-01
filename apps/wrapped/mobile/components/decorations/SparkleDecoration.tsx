/**
 * SparkleDecoration - Four-point stars with rotation (Skia)
 *
 * Used for: Swiftie section intro slides
 * Animation: Staggered pop-in with rotation
 */

import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import {
  SPARKLE_PATH,
  SPARKLE_POSITIONS,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
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

/**
 * Single animated sparkle
 */
const AnimatedSparkle = memo(function AnimatedSparkle({
  x,
  y,
  sparkleScale,
  rotation,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
  containerWidth,
  containerHeight,
}: {
  x: number;
  y: number;
  sparkleScale: number;
  rotation: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
  containerWidth: number;
  containerHeight: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;
      opacity.value = withDelay(delayMs, withTiming(1, { duration: 300 }));
      scale.value = withDelay(
        delayMs,
        withTiming(sparkleScale, { duration: 400 })
      );
    } else {
      opacity.value = 0;
      scale.value = 0;
    }
  }, [animate, delay, opacity, scale, sparkleScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation}deg` },
    ],
  }));

  // Pre-compute path
  const path = useMemo(() => Skia.Path.MakeFromSVGString(SPARKLE_PATH), []);

  // Position within container (scale from viewbox to container size)
  const posX = (x / DECORATION_VIEWBOX.sparkle.width) * containerWidth;
  const posY = (y / DECORATION_VIEWBOX.sparkle.height) * containerHeight;

  const size = 24;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: posX - size / 2,
          top: posY - size / 2,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: size, height: size }}>
        {path && (
          <Path path={path} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(size, size)}
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
}: DecorationProps) {
  const containerWidth = 80;
  const containerHeight = 160;

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  // Container animation for mirror
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      containerOpacity.value = withDelay(delay * 1000, withTiming(1, { duration: 200 }));
    } else {
      containerOpacity.value = 0;
    }
  }, [animate, delay, containerOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scaleX: side === 'right' ? -1 : 1 }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Render sparkles with staggered animation */}
      {SPARKLE_POSITIONS.map((sparkle, i) => (
        <AnimatedSparkle
          key={i}
          x={sparkle.x}
          y={sparkle.y}
          sparkleScale={sparkle.scale}
          rotation={sparkle.rotation}
          glowHex={glowHex}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
          delay={delay + i * DECORATION_TIMINGS.staggerDelay}
          animate={animate}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 160,
    position: 'relative',
  },
});

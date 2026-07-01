/**
 * PulseDecoration - Concentric circles that expand (Skia)
 *
 * Used for: Topics section
 * Animation: Staggered scale-in of circles
 */

import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, Circle, LinearGradient, vec } from '@shopify/react-native-skia';
import {
  PULSE_CIRCLES,
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
 * Single animated circle
 */
const AnimatedCircle = memo(function AnimatedCircle({
  r,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
  index,
}: {
  r: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
  index: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;
      opacity.value = withDelay(delayMs, withTiming(1 - index * 0.2, { duration: 350 }));
      scale.value = withDelay(delayMs, withTiming(1, { duration: 400 }));
    } else {
      opacity.value = 0;
      scale.value = 0;
    }
  }, [animate, delay, opacity, scale, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const canvasSize = r * 2;
  const strokeWidth = 4;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -r,
          marginTop: -r,
          width: canvasSize,
          height: canvasSize,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: canvasSize, height: canvasSize }}>
        <Circle
          cx={r}
          cy={r}
          r={r - strokeWidth / 2}
          style="stroke"
          strokeWidth={strokeWidth}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(canvasSize, canvasSize)}
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
}: DecorationProps) {
  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  // Container animation
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
      {/* Render circles from largest to smallest for proper layering */}
      {[...PULSE_CIRCLES].reverse().map((circle, i) => (
        <AnimatedCircle
          key={i}
          r={circle.r}
          glowHex={glowHex}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
          delay={delay + i * DECORATION_TIMINGS.staggerDelay}
          animate={animate}
          index={i}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    position: 'relative',
  },
});

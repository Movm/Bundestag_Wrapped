/**
 * OrbsDecoration - Floating gradient circles (Skia)
 *
 * Used for: Common-words section
 * Animation: Staggered fade-in with gentle float
 */

import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import {
  ORB_CIRCLES,
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
 * Single animated orb
 */
const AnimatedOrb = memo(function AnimatedOrb({
  cx,
  cy,
  r,
  primaryHex,
  secondaryHex,
  delay,
  animate,
  index,
  containerWidth,
  containerHeight,
}: {
  cx: number;
  cy: number;
  r: number;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
  index: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;
      opacity.value = withDelay(delayMs, withTiming(0.8 - index * 0.1, { duration: 400 }));
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

  // Position within container
  const { width, height } = DECORATION_VIEWBOX.orbs;
  const posX = (cx / width) * containerWidth - r;
  const posY = (cy / height) * containerHeight - r;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: posX,
          top: posY,
          width: r * 2,
          height: r * 2,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: r * 2, height: r * 2 }}>
        <Circle cx={r} cy={r} r={r}>
          <RadialGradient
            c={vec(r * 0.6, r * 0.6)}
            r={r}
            colors={[primaryHex, `${secondaryHex}99`]}
          />
        </Circle>
      </Canvas>
    </Animated.View>
  );
});

export const OrbsDecoration = memo(function OrbsDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
}: DecorationProps) {
  const containerWidth = 80;
  const containerHeight = 120;

  // Convert theme colors to hex
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
      {ORB_CIRCLES.map((orb, i) => (
        <AnimatedOrb
          key={i}
          cx={orb.cx}
          cy={orb.cy}
          r={orb.r}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
          delay={delay + i * DECORATION_TIMINGS.staggerDelay}
          animate={animate}
          index={i}
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
    height: 120,
    position: 'relative',
  },
});

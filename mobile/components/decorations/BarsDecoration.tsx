/**
 * BarsDecoration - Vertical equalizer bars (Skia)
 *
 * Used for: Speeches section intro slides
 * Animation: Staggered spring scale-up from bottom
 */

import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, RoundedRect, LinearGradient, vec } from '@shopify/react-native-skia';
import {
  BAR_CONFIGS,
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
 * Single animated bar component
 */
const AnimatedBar = memo(function AnimatedBar({
  x,
  height,
  barWidth,
  totalHeight,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
}: {
  x: number;
  height: number;
  barWidth: number;
  totalHeight: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
}) {
  const scaleY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;
      opacity.value = withDelay(delayMs, withTiming(1, { duration: 300 }));
      scaleY.value = withDelay(delayMs, withTiming(1, { duration: 400 }));
    } else {
      opacity.value = 0;
      scaleY.value = 0;
    }
  }, [animate, delay, opacity, scaleY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scaleY.value }],
  }));

  const containerHeight = (height / totalHeight) * 160;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: (x / DECORATION_VIEWBOX.bars.width) * 80 - 6,
          bottom: 0,
          width: barWidth,
          height: containerHeight,
          transformOrigin: 'bottom',
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: barWidth, height: containerHeight }}>
        <RoundedRect x={0} y={0} width={barWidth} height={containerHeight} r={8}>
          <LinearGradient
            start={vec(0, containerHeight)}
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
}: DecorationProps) {
  const { height } = DECORATION_VIEWBOX.bars;

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  // Main container animation (for opacity and mirror)
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      containerOpacity.value = withDelay(delay * 1000, withTiming(1, { duration: 300 }));
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
      {/* Render bars with staggered animation */}
      {BAR_CONFIGS.map((bar, i) => (
        <AnimatedBar
          key={i}
          x={bar.x}
          height={bar.height}
          barWidth={bar.width || 16}
          totalHeight={height}
          glowHex={glowHex}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
          delay={delay + i * DECORATION_TIMINGS.staggerDelay}
          animate={animate}
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

/**
 * AuroraDecoration - Soft flowing horizontal bands (Skia)
 *
 * Used for: Tone, Intro sections (replaces ugly RibbonDecoration)
 * Animation: Staggered fade-in with gentle vertical float
 *
 * Visual: Curved horizontal bands like northern lights
 */

import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import {
  AURORA_BANDS,
  DECORATION_VIEWBOX,
  DECORATION_TIMINGS,
  createAuroraBandPath,
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
 * Single animated aurora band
 */
const AnimatedBand = memo(function AnimatedBand({
  y,
  height,
  curve,
  bandOpacity,
  glowHex,
  primaryHex,
  secondaryHex,
  delay,
  animate,
  index,
  viewboxWidth,
  viewboxHeight,
  containerWidth,
  containerHeight,
}: {
  y: number;
  height: number;
  curve: number;
  bandOpacity: number;
  glowHex: string;
  primaryHex: string;
  secondaryHex: string;
  delay: number;
  animate: boolean;
  index: number;
  viewboxWidth: number;
  viewboxHeight: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      const delayMs = delay * 1000;
      opacity.value = withDelay(
        delayMs,
        withTiming(bandOpacity, { duration: 400, easing: Easing.out(Easing.quad) })
      );
    } else {
      opacity.value = 0;
    }
  }, [animate, delay, opacity, bandOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Generate the curved band path and pre-compute
  const pathD = createAuroraBandPath(y, height, curve, viewboxWidth);
  const path = useMemo(() => Skia.Path.MakeFromSVGString(pathD), [pathD]);

  // Scale factors
  const scaleX = containerWidth / viewboxWidth;
  const scaleY = containerHeight / viewboxHeight;

  return (
    <Animated.View style={[styles.bandContainer, animatedStyle]}>
      <Canvas style={{ width: containerWidth, height: containerHeight }}>
        {path && (
          <Path path={path} style="fill" transform={[{ scaleX }, { scaleY }]}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(viewboxWidth, 0)}
              colors={[
                `${glowHex}00`,
                `${primaryHex}CC`,
                `${secondaryHex}CC`,
                `${secondaryHex}00`,
              ]}
            />
          </Path>
        )}
      </Canvas>
    </Animated.View>
  );
});

export const AuroraDecoration = memo(function AuroraDecoration({
  colors,
  delay = 0,
  animate = true,
  side,
}: DecorationProps) {
  const { width, height } = DECORATION_VIEWBOX.aurora;
  const containerWidth = 90;
  const containerHeight = 130;

  // Convert theme colors to hex
  const glowHex = rgbToHex(colors.glow);
  const primaryHex = rgbToHex(colors.primary);
  const secondaryHex = rgbToHex(colors.secondary);

  // Container animation (for mirror transform)
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      containerOpacity.value = withDelay(
        delay * 1000,
        withTiming(1, { duration: 200 })
      );
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
      {/* Render aurora bands with staggered animation */}
      {AURORA_BANDS.map((band, i) => (
        <AnimatedBand
          key={i}
          y={band.y}
          height={band.height}
          curve={band.curve}
          bandOpacity={band.opacity}
          glowHex={glowHex}
          primaryHex={primaryHex}
          secondaryHex={secondaryHex}
          delay={delay + i * DECORATION_TIMINGS.staggerDelay}
          animate={animate}
          index={i}
          viewboxWidth={width}
          viewboxHeight={height}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 90,
    height: 130,
    position: 'relative',
  },
  bandContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

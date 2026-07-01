import React, { useMemo } from 'react';
import {
  Canvas,
  Path,
  Circle,
  Skia,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import type { IntroIconProps } from './types';

// Base size the icon was designed for
const BASE_SIZE = 96;

/**
 * Swiftie Icon - Sparkle Burst (Skia)
 * Central star with radiating sparkles
 */
export function SwiftieIcon({
  width = 96,
  height = 96,
  primaryColor = '#EC4899',
  secondaryColor = '#F472B6',
}: IntroIconProps) {
  const colors = [primaryColor, secondaryColor];
  const scale = Math.min(width, height) / BASE_SIZE;

  // Pre-compute paths
  const paths = useMemo(() => ({
    // Central 4-point star
    central: Skia.Path.MakeFromSVGString('M48 16 L52 40 L76 48 L52 56 L48 80 L44 56 L20 48 L44 40 Z'),
    // Surrounding 4-point stars
    topLeft: Skia.Path.MakeFromSVGString('M20 20 L22 28 L30 30 L22 32 L20 40 L18 32 L10 30 L18 28 Z'),
    topRight: Skia.Path.MakeFromSVGString('M76 20 L78 28 L86 30 L78 32 L76 40 L74 32 L66 30 L74 28 Z'),
    bottomLeft: Skia.Path.MakeFromSVGString('M20 60 L22 68 L30 70 L22 72 L20 80 L18 72 L10 70 L18 68 Z'),
    bottomRight: Skia.Path.MakeFromSVGString('M76 60 L78 68 L86 70 L78 72 L76 80 L74 72 L66 70 L74 68 Z'),
    // Tiny diamond sparkles
    diamondTop: Skia.Path.MakeFromSVGString('M48 4 L50 8 L48 12 L46 8 Z'),
    diamondBottom: Skia.Path.MakeFromSVGString('M48 84 L50 88 L48 92 L46 88 Z'),
    diamondLeft: Skia.Path.MakeFromSVGString('M4 48 L8 50 L12 48 L8 46 Z'),
    diamondRight: Skia.Path.MakeFromSVGString('M84 48 L88 50 L92 48 L88 46 Z'),
  }), []);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Central 4-point star */}
        {paths.central && (
          <Path path={paths.central}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Path>
        )}

        {/* Inner highlight */}
        <Circle cx={48} cy={48} r={8} color="rgba(255, 255, 255, 0.9)" />

        {/* Surrounding 4-point stars */}
        {paths.topLeft && (
          <Group opacity={0.8}>
            <Path path={paths.topLeft}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}
        {paths.topRight && (
          <Group opacity={0.7}>
            <Path path={paths.topRight}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}
        {paths.bottomLeft && (
          <Group opacity={0.7}>
            <Path path={paths.bottomLeft}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}
        {paths.bottomRight && (
          <Group opacity={0.8}>
            <Path path={paths.bottomRight}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}

        {/* Tiny diamond sparkles */}
        {paths.diamondTop && (
          <Group opacity={0.6}>
            <Path path={paths.diamondTop}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}
        {paths.diamondBottom && (
          <Group opacity={0.6}>
            <Path path={paths.diamondBottom}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}
        {paths.diamondLeft && (
          <Group opacity={0.6}>
            <Path path={paths.diamondLeft}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}
        {paths.diamondRight && (
          <Group opacity={0.6}>
            <Path path={paths.diamondRight}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}

        {/* Accent dots */}
        <Circle cx={36} cy={24} r={2} color="rgba(255, 255, 255, 0.7)" />
        <Circle cx={60} cy={24} r={2} color="rgba(255, 255, 255, 0.7)" />
        <Circle cx={36} cy={72} r={2} color="rgba(255, 255, 255, 0.7)" />
        <Circle cx={60} cy={72} r={2} color="rgba(255, 255, 255, 0.7)" />
      </Group>
    </Canvas>
  );
}

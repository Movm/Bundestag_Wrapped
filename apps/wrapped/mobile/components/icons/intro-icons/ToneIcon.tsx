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
 * Tone Icon - Flowing Ribbon (Skia)
 * Elegant S-curve ribbon shape
 */
export function ToneIcon({
  width = 96,
  height = 96,
  primaryColor = '#A855F7',
  secondaryColor = '#7C3AED',
}: IntroIconProps) {
  const colors = [primaryColor, secondaryColor];
  const colorsReverse = [secondaryColor, primaryColor];
  const scale = Math.min(width, height) / BASE_SIZE;

  // Pre-compute paths
  const paths = useMemo(() => ({
    mainRibbon: Skia.Path.MakeFromSVGString(
      'M16 20 C 40 20, 56 40, 56 48 C 56 56, 40 76, 80 76 L 80 84 C 32 84, 48 60, 48 48 C 48 36, 32 28, 16 28 Z'
    ),
    secondaryRibbon: Skia.Path.MakeFromSVGString(
      'M80 12 C 56 12, 40 32, 40 40 C 40 48, 56 68, 16 68 L 16 60 C 64 60, 48 44, 48 40 C 48 36, 64 20, 80 20 Z'
    ),
    accentStroke: Skia.Path.MakeFromSVGString(
      'M16 20 C 40 20, 56 40, 56 48 C 56 56, 40 76, 80 76'
    ),
  }), []);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Main ribbon - S-curve */}
        {paths.mainRibbon && (
          <Path path={paths.mainRibbon}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Path>
        )}

        {/* Secondary ribbon - parallel */}
        {paths.secondaryRibbon && (
          <Group opacity={0.6}>
            <Path path={paths.secondaryRibbon}>
              <LinearGradient start={vec(96, 96)} end={vec(0, 0)} colors={colorsReverse} />
            </Path>
          </Group>
        )}

        {/* Accent stroke */}
        {paths.accentStroke && (
          <Group opacity={0.4}>
            <Path
              path={paths.accentStroke}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
              color="white"
            />
          </Group>
        )}

        {/* Highlight dots */}
        <Circle cx={36} cy={34} r={4} color="rgba(255, 255, 255, 0.85)" />
        <Circle cx={60} cy={62} r={3} color="rgba(255, 255, 255, 0.7)" />
        <Circle cx={60} cy={26} r={3} color="rgba(255, 255, 255, 0.6)" />
      </Group>
    </Canvas>
  );
}

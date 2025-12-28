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
 * Drama Icon - Lightning Clash (Skia)
 * Two angular lightning bolts crossing
 */
export function DramaIcon({
  width = 96,
  height = 96,
  primaryColor = '#EF4444',
  secondaryColor = '#DC2626',
}: IntroIconProps) {
  const colors = [primaryColor, secondaryColor];
  const scale = Math.min(width, height) / BASE_SIZE;

  // Pre-compute paths
  const paths = useMemo(() => ({
    leftBolt: Skia.Path.MakeFromSVGString('M24 8 L32 36 L20 40 L40 88 L34 52 L46 48 L24 8'),
    rightBolt: Skia.Path.MakeFromSVGString('M72 8 L64 36 L76 40 L56 88 L62 52 L50 48 L72 8'),
    leftOutline: Skia.Path.MakeFromSVGString('M24 8 L32 36 L20 40 L40 88'),
    rightOutline: Skia.Path.MakeFromSVGString('M72 8 L64 36 L76 40 L56 88'),
  }), []);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Left lightning bolt */}
        {paths.leftBolt && (
          <Path path={paths.leftBolt}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Path>
        )}

        {/* Right lightning bolt */}
        {paths.rightBolt && (
          <Group opacity={0.85}>
            <Path path={paths.rightBolt}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}

        {/* Central clash spark */}
        <Circle cx={48} cy={44} r={6} color="rgba(255, 255, 255, 0.95)" />

        {/* Spark accents */}
        <Circle cx={48} cy={36} r={2} color="rgba(255, 255, 255, 0.7)" />
        <Circle cx={42} cy={44} r={2} color="rgba(255, 255, 255, 0.7)" />
        <Circle cx={54} cy={44} r={2} color="rgba(255, 255, 255, 0.7)" />
        <Circle cx={48} cy={52} r={2} color="rgba(255, 255, 255, 0.7)" />

        {/* Outline accents */}
        {paths.leftOutline && (
          <Group opacity={0.3}>
            <Path
              path={paths.leftOutline}
              style="stroke"
              strokeWidth={1}
              color="white"
            />
          </Group>
        )}
        {paths.rightOutline && (
          <Group opacity={0.3}>
            <Path
              path={paths.rightOutline}
              style="stroke"
              strokeWidth={1}
              color="white"
            />
          </Group>
        )}
      </Group>
    </Canvas>
  );
}

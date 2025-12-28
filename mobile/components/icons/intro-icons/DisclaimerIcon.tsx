import React, { useMemo } from 'react';
import {
  Canvas,
  Path,
  Circle,
  RoundedRect,
  Skia,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import type { IntroIconProps } from './types';

// Base size the icon was designed for
const BASE_SIZE = 96;

/**
 * Disclaimer Icon - Laboratory Flask (Skia)
 * Represents experimental/prototype nature of the data
 * Amber/orange gradient conveys caution without alarm
 */
export function DisclaimerIcon({
  width = 96,
  height = 96,
  primaryColor = '#F59E0B',
  secondaryColor = '#D97706',
}: IntroIconProps) {
  const colors = [primaryColor, secondaryColor];
  const scale = Math.min(width, height) / BASE_SIZE;

  // Pre-compute paths
  const paths = useMemo(() => ({
    flaskBody: Skia.Path.MakeFromSVGString(
      'M40 32 L28 60 Q24 68 28 76 Q32 84 48 84 Q64 84 68 76 Q72 68 68 60 L56 32 Z'
    ),
    liquid: Skia.Path.MakeFromSVGString(
      'M32 64 Q28 72 32 78 Q36 82 48 82 Q60 82 64 78 Q68 72 64 64 Z'
    ),
    flaskStroke: Skia.Path.MakeFromSVGString(
      'M40 32 L28 60 Q24 68 28 76 Q32 84 48 84 Q64 84 68 76 Q72 68 68 60 L56 32'
    ),
  }), []);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Flask neck */}
        <Group opacity={0.6}>
          <RoundedRect x={40} y={12} width={16} height={20} r={2}>
            <LinearGradient start={vec(48, 0)} end={vec(48, 96)} colors={colors} />
          </RoundedRect>
        </Group>

        {/* Flask neck rim */}
        <Group opacity={0.9}>
          <RoundedRect x={36} y={8} width={24} height={6} r={2}>
            <LinearGradient start={vec(48, 0)} end={vec(48, 96)} colors={colors} />
          </RoundedRect>
        </Group>

        {/* Flask body */}
        {paths.flaskBody && (
          <Group opacity={0.8}>
            <Path path={paths.flaskBody}>
              <LinearGradient start={vec(48, 0)} end={vec(48, 96)} colors={colors} />
            </Path>
          </Group>
        )}

        {/* Liquid inside flask */}
        {paths.liquid && (
          <Group opacity={0.5}>
            <Path path={paths.liquid} color={primaryColor} />
          </Group>
        )}

        {/* Bubbles in liquid */}
        <Circle cx={40} cy={70} r={3} color="rgba(255, 255, 255, 0.6)" />
        <Circle cx={52} cy={74} r={2} color="rgba(255, 255, 255, 0.5)" />
        <Circle cx={46} cy={66} r={2} color="rgba(255, 255, 255, 0.4)" />

        {/* Outer stroke */}
        {paths.flaskStroke && (
          <Group opacity={0.4}>
            <Path
              path={paths.flaskStroke}
              style="stroke"
              strokeWidth={2}
              color={primaryColor}
            />
          </Group>
        )}
      </Group>
    </Canvas>
  );
}

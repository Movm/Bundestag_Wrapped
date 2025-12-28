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
 * Discriminatory Icon - Muted Triangle (Skia)
 * Minimalist warning triangle, understated for serious topic
 */
export function DiscriminatoryIcon({
  width = 96,
  height = 96,
  primaryColor = '#64748B',
  secondaryColor = '#475569',
}: IntroIconProps) {
  const colors = [primaryColor, secondaryColor];
  const scale = Math.min(width, height) / BASE_SIZE;

  // Pre-compute paths
  const paths = useMemo(() => ({
    outerTriangle: Skia.Path.MakeFromSVGString('M48 12 L88 80 L8 80 Z'),
    innerTriangle: Skia.Path.MakeFromSVGString('M48 28 L72 68 L24 68 Z'),
  }), []);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Outer triangle - filled */}
        {paths.outerTriangle && (
          <Group opacity={0.8}>
            <Path path={paths.outerTriangle}>
              <LinearGradient start={vec(48, 0)} end={vec(48, 96)} colors={colors} />
            </Path>
          </Group>
        )}

        {/* Inner triangle cutout effect */}
        {paths.innerTriangle && (
          <Group opacity={0.3}>
            <Path path={paths.innerTriangle} color="black" />
          </Group>
        )}

        {/* Exclamation mark - bar */}
        <Group opacity={0.9}>
          <RoundedRect x={45} y={38} width={6} height={18} r={3} color="white" />
        </Group>

        {/* Exclamation mark - dot */}
        <Circle cx={48} cy={64} r={4} color="rgba(255, 255, 255, 0.9)" />

        {/* Subtle outer stroke */}
        {paths.outerTriangle && (
          <Group opacity={0.4}>
            <Path
              path={paths.outerTriangle}
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

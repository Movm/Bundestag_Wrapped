import React, { useMemo } from 'react';
import {
  Canvas,
  Path,
  Circle,
  Line,
  RoundedRect,
  Skia,
  LinearGradient,
  vec,
  Group,
  DashPathEffect,
} from '@shopify/react-native-skia';
import type { IntroIconProps } from './types';

// Base size the icon was designed for
const BASE_SIZE = 96;

/**
 * Gender Icon - Balanced Grid/Scales (Skia)
 * Abstract balanced figures representing equality
 */
export function GenderIcon({
  width = 96,
  height = 96,
  primaryColor = '#0EA5E9',
  secondaryColor = '#06B6D4',
}: IntroIconProps) {
  const colors = [primaryColor, secondaryColor];
  const scale = Math.min(width, height) / BASE_SIZE;

  // Pre-compute path for fulcrum triangle
  const fulcrumPath = useMemo(
    () => Skia.Path.MakeFromSVGString('M48 50 L56 80 L40 80 Z'),
    []
  );

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Balance beam */}
        <RoundedRect x={8} y={46} width={80} height={4} r={2}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </RoundedRect>

        {/* Center fulcrum/pivot - triangle */}
        {fulcrumPath && (
          <Group opacity={0.8}>
            <Path path={fulcrumPath}>
              <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            </Path>
          </Group>
        )}

        {/* Center fulcrum - circles */}
        <Circle cx={48} cy={48} r={6}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        <Circle cx={48} cy={48} r={3} color="rgba(255, 255, 255, 0.9)" />

        {/* Left figure - head */}
        <Circle cx={24} cy={24} r={12}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        <Circle cx={24} cy={24} r={5} color="rgba(255, 255, 255, 0.8)" />

        {/* Left figure - body */}
        <Group opacity={0.7}>
          <RoundedRect x={22} y={36} width={4} height={10} r={2}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </RoundedRect>
        </Group>

        {/* Right figure - head */}
        <Circle cx={72} cy={24} r={12}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        <Circle cx={72} cy={24} r={5} color="rgba(255, 255, 255, 0.8)" />

        {/* Right figure - body */}
        <Group opacity={0.7}>
          <RoundedRect x={70} y={36} width={4} height={10} r={2}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </RoundedRect>
        </Group>

        {/* Grid lines - dashed */}
        <Group opacity={0.3}>
          <Line p1={vec(24, 12)} p2={vec(24, 46)} strokeWidth={1.5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            <DashPathEffect intervals={[4, 4]} />
          </Line>
          <Line p1={vec(72, 12)} p2={vec(72, 46)} strokeWidth={1.5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
            <DashPathEffect intervals={[4, 4]} />
          </Line>
        </Group>

        {/* Base stability line */}
        <Group opacity={0.6}>
          <RoundedRect x={36} y={80} width={24} height={4} r={2}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </RoundedRect>
        </Group>
      </Group>
    </Canvas>
  );
}

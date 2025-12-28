import React from 'react';
import {
  Canvas,
  Circle,
  LinearGradient,
  RadialGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import type { IntroIconProps } from './types';

// Base size the icon was designed for
const BASE_SIZE = 96;

/**
 * Common Words Icon - Floating Bubbles Cluster (Skia)
 * Overlapping circles like a word cloud or bubble chart
 */
export function CommonWordsIcon({
  width = 96,
  height = 96,
  primaryColor = '#14B8A6',
  secondaryColor = '#0D9488',
}: IntroIconProps) {
  const colors = [primaryColor, secondaryColor];
  const scale = Math.min(width, height) / BASE_SIZE;

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Main large bubble */}
        <Circle cx={48} cy={48} r={24}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        {/* Radial highlight on main bubble */}
        <Circle cx={48} cy={48} r={24}>
          <RadialGradient
            c={vec(38, 38)}
            r={24}
            colors={['rgba(255, 255, 255, 0.3)', 'transparent']}
          />
        </Circle>

        {/* Medium bubble - top right */}
        <Group opacity={0.85}>
          <Circle cx={72} cy={32} r={16}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Medium bubble - bottom left */}
        <Group opacity={0.8}>
          <Circle cx={28} cy={68} r={14}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Small bubble - top left */}
        <Group opacity={0.7}>
          <Circle cx={24} cy={28} r={10}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Small bubble - bottom right */}
        <Group opacity={0.75}>
          <Circle cx={76} cy={64} r={12}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Tiny accent bubbles */}
        <Group opacity={0.6}>
          <Circle cx={56} cy={20} r={6}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>
        <Group opacity={0.5}>
          <Circle cx={16} cy={48} r={5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>
        <Group opacity={0.5}>
          <Circle cx={84} cy={48} r={4}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Highlight dots */}
        <Circle cx={40} cy={40} r={4} color="rgba(255, 255, 255, 0.8)" />
        <Circle cx={66} cy={26} r={3} color="rgba(255, 255, 255, 0.7)" />
        <Circle cx={22} cy={62} r={2.5} color="rgba(255, 255, 255, 0.6)" />

        {/* Stroke accent on main bubble */}
        <Group opacity={0.3}>
          <Circle cx={48} cy={48} r={24} style="stroke" strokeWidth={1.5} color="white" />
        </Group>
      </Group>
    </Canvas>
  );
}

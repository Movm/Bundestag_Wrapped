import React from 'react';
import {
  Canvas,
  Circle,
  Line,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import type { IntroIconProps } from './types';

// Base size the icon was designed for
const BASE_SIZE = 96;

/**
 * Topics Icon - Radial Data Burst (Skia)
 * Concentric circles with data-point dots radiating outward
 */
export function TopicsIcon({
  width = 96,
  height = 96,
  primaryColor = '#3B82F6',
  secondaryColor = '#06B6D4',
}: IntroIconProps) {
  const colors = [primaryColor, secondaryColor];
  const scale = Math.min(width, height) / BASE_SIZE;

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Outer ring */}
        <Group opacity={0.3}>
          <Circle cx={48} cy={48} r={42} style="stroke" strokeWidth={2}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Middle ring */}
        <Group opacity={0.5}>
          <Circle cx={48} cy={48} r={30} style="stroke" strokeWidth={2}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Inner filled circle */}
        <Group opacity={0.9}>
          <Circle cx={48} cy={48} r={18}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Center dot */}
        <Circle cx={48} cy={48} r={6} color="rgba(255, 255, 255, 0.95)" />

        {/* Data point dots on outer ring */}
        <Circle cx={48} cy={6} r={4}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        <Circle cx={84} cy={30} r={4}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        <Circle cx={84} cy={66} r={4}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        <Circle cx={48} cy={90} r={4}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        <Circle cx={12} cy={66} r={4}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>
        <Circle cx={12} cy={30} r={4}>
          <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
        </Circle>

        {/* Data point dots on middle ring */}
        <Group opacity={0.8}>
          <Circle cx={48} cy={18} r={3}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
          <Circle cx={74} cy={48} r={3}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
          <Circle cx={48} cy={78} r={3}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
          <Circle cx={22} cy={48} r={3}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Circle>
        </Group>

        {/* Connecting lines */}
        <Group opacity={0.4}>
          <Line p1={vec(48, 30)} p2={vec(48, 6)} strokeWidth={1.5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Line>
          <Line p1={vec(63, 39)} p2={vec(84, 30)} strokeWidth={1.5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Line>
          <Line p1={vec(63, 57)} p2={vec(84, 66)} strokeWidth={1.5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Line>
          <Line p1={vec(48, 66)} p2={vec(48, 90)} strokeWidth={1.5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Line>
          <Line p1={vec(33, 57)} p2={vec(12, 66)} strokeWidth={1.5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Line>
          <Line p1={vec(33, 39)} p2={vec(12, 30)} strokeWidth={1.5}>
            <LinearGradient start={vec(0, 0)} end={vec(96, 96)} colors={colors} />
          </Line>
        </Group>
      </Group>
    </Canvas>
  );
}

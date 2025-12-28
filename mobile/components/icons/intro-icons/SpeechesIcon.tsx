import React from 'react';
import {
  Canvas,
  Circle,
  Line,
  RoundedRect,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import type { IntroIconProps } from './types';

// Base size the icon was designed for
const BASE_SIZE = 96;

/**
 * Speeches Icon - Rising Bars / Voice Meter (Skia)
 * Audio equalizer style vertical bars
 */
export function SpeechesIcon({
  width = 96,
  height = 96,
  primaryColor = '#F97316',
  secondaryColor = '#EAB308',
}: IntroIconProps) {
  const scale = Math.min(width, height) / BASE_SIZE;

  const bars = [
    { x: 12, height: 32 },
    { x: 24, height: 48 },
    { x: 36, height: 64 },
    { x: 48, height: 56 },
    { x: 60, height: 72 },
    { x: 72, height: 40 },
    { x: 84, height: 24 },
  ];

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Bars */}
        {bars.map(({ x, height: h }, i) => (
          <Group key={i} opacity={0.7 + (h / 72) * 0.3}>
            <RoundedRect
              x={x - 4}
              y={88 - h}
              width={8}
              height={h}
              r={4}
            >
              <LinearGradient
                start={vec(0, 88)}
                end={vec(0, 16)}
                colors={[secondaryColor, primaryColor]}
              />
            </RoundedRect>
          </Group>
        ))}

        {/* Accent highlights */}
        <Circle cx={60} cy={20} r={3} color="rgba(255, 255, 255, 0.9)" />
        <Circle cx={36} cy={28} r={2.5} color="rgba(255, 255, 255, 0.8)" />
        <Circle cx={48} cy={36} r={2} color="rgba(255, 255, 255, 0.7)" />

        {/* Base line */}
        <Group opacity={0.3}>
          <Line p1={vec(4, 88)} p2={vec(92, 88)} strokeWidth={2} strokeCap="round">
            <LinearGradient
              start={vec(0, 88)}
              end={vec(0, 16)}
              colors={[secondaryColor, primaryColor]}
            />
          </Line>
        </Group>
      </Group>
    </Canvas>
  );
}

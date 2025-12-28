import React, { useMemo } from 'react';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import type { IntroIconProps } from './types';

// Base size the icon was designed for
const BASE_SIZE = 96;

/**
 * Moin Icon - Minimalistic Horizontal Waves (Skia)
 * Clean, flowing sine waves representing water/ocean
 * Light blue color scheme for a fresh, water-ish feel
 */
export function MoinIcon({
  width = 96,
  height = 96,
  primaryColor = '#38BDF8',
  secondaryColor = '#0EA5E9',
}: IntroIconProps) {
  const scale = Math.min(width, height) / BASE_SIZE;

  // Pre-compute paths (memoized for performance)
  const paths = useMemo(() => ({
    top: Skia.Path.MakeFromSVGString('M8 36 C24 24, 40 48, 56 36 S88 24, 88 36'),
    middle: Skia.Path.MakeFromSVGString('M8 52 C24 40, 40 64, 56 52 S88 40, 88 52'),
    bottom: Skia.Path.MakeFromSVGString('M8 68 C24 56, 40 80, 56 68 S88 56, 88 68'),
  }), []);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Top wave - full opacity */}
        {paths.top && (
          <Path
            path={paths.top}
            style="stroke"
            strokeWidth={5}
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, 36)}
              end={vec(96, 36)}
              colors={[primaryColor, secondaryColor]}
            />
          </Path>
        )}

        {/* Middle wave - medium opacity */}
        {paths.middle && (
          <Group opacity={0.6}>
            <Path
              path={paths.middle}
              style="stroke"
              strokeWidth={4}
              strokeCap="round"
            >
              <LinearGradient
                start={vec(0, 52)}
                end={vec(96, 52)}
                colors={[primaryColor, secondaryColor]}
              />
            </Path>
          </Group>
        )}

        {/* Bottom wave - lighter opacity */}
        {paths.bottom && (
          <Group opacity={0.35}>
            <Path
              path={paths.bottom}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
            >
              <LinearGradient
                start={vec(0, 68)}
                end={vec(96, 68)}
                colors={[primaryColor, secondaryColor]}
              />
            </Path>
          </Group>
        )}
      </Group>
    </Canvas>
  );
}

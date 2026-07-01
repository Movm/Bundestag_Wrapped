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
 * Vocabulary Icon - Stacked Wave Lines (Skia)
 * Horizontal wavy lines representing sound/speech waves
 */
export function VocabularyIcon({
  width = 96,
  height = 96,
  primaryColor = '#8B5CF6',
  secondaryColor = '#6366F1',
}: IntroIconProps) {
  const scale = Math.min(width, height) / BASE_SIZE;

  // Pre-compute paths (memoized for performance)
  const paths = useMemo(() => ({
    wave1: Skia.Path.MakeFromSVGString('M8 24 Q24 16 40 24 T72 24 T88 24'),
    wave2: Skia.Path.MakeFromSVGString('M8 38 Q24 28 40 38 T72 38 T88 38'),
    wave3: Skia.Path.MakeFromSVGString('M4 48 Q20 36 40 48 T76 48 T92 48'),
    wave4: Skia.Path.MakeFromSVGString('M8 58 Q24 68 40 58 T72 58 T88 58'),
    wave5: Skia.Path.MakeFromSVGString('M8 72 Q24 80 40 72 T72 72 T88 72'),
  }), []);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Wave line 1 - top */}
        {paths.wave1 && (
          <Group opacity={0.5}>
            <Path
              path={paths.wave1}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(96, 96)}
                colors={[primaryColor, secondaryColor]}
              />
            </Path>
          </Group>
        )}

        {/* Wave line 2 */}
        {paths.wave2 && (
          <Group opacity={0.7}>
            <Path
              path={paths.wave2}
              style="stroke"
              strokeWidth={4}
              strokeCap="round"
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(96, 96)}
                colors={[primaryColor, secondaryColor]}
              />
            </Path>
          </Group>
        )}

        {/* Wave line 3 - center, thickest */}
        {paths.wave3 && (
          <Path
            path={paths.wave3}
            style="stroke"
            strokeWidth={6}
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(96, 96)}
              colors={[primaryColor, secondaryColor]}
            />
          </Path>
        )}

        {/* Wave line 4 */}
        {paths.wave4 && (
          <Group opacity={0.7}>
            <Path
              path={paths.wave4}
              style="stroke"
              strokeWidth={4}
              strokeCap="round"
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(96, 96)}
                colors={[primaryColor, secondaryColor]}
              />
            </Path>
          </Group>
        )}

        {/* Wave line 5 - bottom */}
        {paths.wave5 && (
          <Group opacity={0.5}>
            <Path
              path={paths.wave5}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(96, 96)}
                colors={[primaryColor, secondaryColor]}
              />
            </Path>
          </Group>
        )}

        {/* Accent dots */}
        <Circle cx={40} cy={48} r={4} color="rgba(255, 255, 255, 0.9)" />
        <Circle cx={76} cy={48} r={3} color="rgba(255, 255, 255, 0.7)" />
      </Group>
    </Canvas>
  );
}

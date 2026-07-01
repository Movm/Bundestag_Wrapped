/**
 * GradientEffect - Static gradient background (no animation)
 *
 * Used for:
 * - 'discriminatory' section (serious, somber tone)
 * - Fallback when reduced motion is enabled
 * - Loading state while other effects initialize
 *
 * Creates subtle radial-like gradients using expo-linear-gradient.
 * Since React Native doesn't support radial gradients natively,
 * we simulate them with overlapping linear gradients.
 */

import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '../../../../src/shared/theme-backgrounds/types';

interface GradientEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GradientEffect = memo(function GradientEffect({
  colors,
  intensity = 1,
}: GradientEffectProps) {
  const baseOpacity = 0.15 * intensity;

  // Memoize color calculations
  const gradientColors = useMemo(
    () => ({
      primary: `rgba(${colors.primary}, ${baseOpacity})`,
      primaryFade: `rgba(${colors.primary}, 0)`,
      secondary: `rgba(${colors.secondary}, ${baseOpacity * 0.7})`,
      secondaryFade: `rgba(${colors.secondary}, 0)`,
      glow: `rgba(${colors.glow}, ${baseOpacity * 0.3})`,
      glowFade: `rgba(${colors.glow}, 0)`,
    }),
    [colors, baseOpacity]
  );

  return (
    <View style={styles.container}>
      {/* Primary gradient from top-left */}
      <LinearGradient
        colors={[gradientColors.primary, gradientColors.primaryFade]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={styles.primaryGradient}
      />

      {/* Secondary gradient from bottom-right */}
      <LinearGradient
        colors={[gradientColors.secondaryFade, gradientColors.secondary]}
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={styles.secondaryGradient}
      />

      {/* Subtle glow accent in center */}
      <LinearGradient
        colors={[
          gradientColors.glowFade,
          gradientColors.glow,
          gradientColors.glowFade,
        ]}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 1, y: 0.6 }}
        style={styles.glowGradient}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  primaryGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.6,
  },
  secondaryGradient: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.5,
  },
  glowGradient: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    left: SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.4,
    opacity: 0.5,
  },
});

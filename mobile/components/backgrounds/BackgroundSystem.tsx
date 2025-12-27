/**
 * BackgroundSystem - Main orchestrator for themed backgrounds
 *
 * Renders dynamic background effects based on the current slide's theme.
 * Each section has a unique visual effect with its own color palette.
 *
 * Features:
 * - Crossfade transitions between themes (800ms)
 * - Reduced motion support (falls back to static gradient)
 * - Performance-optimized with memoization
 */

import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffectsEnabled } from '../../stores/slideStore';
import { useBackgroundTheme } from '../../stores/appStore';
import { SLIDES } from '../SlideRenderer';
import {
  BACKGROUND_CROSSFADE_DURATION,
  type ThemeColors,
  type EffectType,
} from '../../../src/shared/theme-backgrounds/types';

// Effects
import { GradientEffect } from './effects/GradientEffect';
import { PulseEffect } from './effects/PulseEffect';
import { WavesEffect } from './effects/WavesEffect';
import { BarsEffect } from './effects/BarsEffect';
import { OrbsEffect } from './effects/OrbsEffect';
import { ContrailsEffect } from './effects/ContrailsEffect';
import { RaysEffect } from './effects/RaysEffect';
import { LightningEffect } from './effects/LightningEffect';
import { SparklesEffect } from './effects/SparklesEffect';
import { GridEffect } from './effects/GridEffect';
import { StripesEffect } from './effects/StripesEffect';
import { RibbonsEffect } from './effects/RibbonsEffect';

interface BackgroundSystemProps {
  slideId: string;
}

export const BackgroundSystem = memo(function BackgroundSystem({
  slideId,
}: BackgroundSystemProps) {
  // Use Zustand-based hook instead of context
  const { themeConfig, reducedMotion, currentTheme } = useBackgroundTheme(slideId);
  const opacity = useSharedValue(0);

  // Get slide index from slideId for visibility checking
  // This enables us to stop animations when the slide scrolls off-screen
  const slideIndex = useMemo(() => SLIDES.indexOf(slideId as typeof SLIDES[number]), [slideId]);

  // Combined check: effects globally ready AND this slide is visible
  // This is the key performance optimization - animations only run when visible
  const shouldRenderEffects = useEffectsEnabled(slideIndex);

  // Crossfade on theme change
  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, {
      duration: BACKGROUND_CROSSFADE_DURATION,
      easing: Easing.inOut(Easing.ease),
    });
  }, [currentTheme, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base dark gradient - always visible IMMEDIATELY */}
      <LinearGradient
        colors={['#0a0a0f', '#12121a']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Effect layer - only rendered when slide is visible AND effects are ready */}
      {shouldRenderEffects && (
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
          {reducedMotion ? (
            <GradientEffect
              colors={themeConfig.colors}
              intensity={themeConfig.intensity * 0.5}
            />
          ) : (
            <ThemedEffect
              effectType={themeConfig.effectType}
              colors={themeConfig.colors}
              intensity={themeConfig.intensity}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
});

interface ThemedEffectProps {
  effectType: EffectType;
  colors: ThemeColors;
  intensity: number;
}

/**
 * Renders the appropriate effect component based on theme.
 */
const ThemedEffect = memo(function ThemedEffect({
  effectType,
  colors,
  intensity,
}: ThemedEffectProps) {
  switch (effectType) {
    case 'pulse':
      return <PulseEffect colors={colors} intensity={intensity} />;

    case 'waves':
      return <WavesEffect colors={colors} intensity={intensity} />;

    case 'bars':
      return <BarsEffect colors={colors} intensity={intensity} />;

    case 'lightning':
      return <LightningEffect colors={colors} intensity={intensity} />;

    case 'orbs':
      return <OrbsEffect colors={colors} intensity={intensity} />;

    case 'stripes':
      return <StripesEffect colors={colors} intensity={intensity} />;

    case 'sparkles':
      return <SparklesEffect colors={colors} intensity={intensity} />;

    case 'ribbons':
      return <RibbonsEffect colors={colors} intensity={intensity} />;

    case 'grid':
      return <GridEffect colors={colors} intensity={intensity} />;

    case 'rays':
      return <RaysEffect colors={colors} intensity={intensity} />;

    case 'contrails':
      return <ContrailsEffect colors={colors} intensity={intensity} />;

    case 'gradient':
    default:
      return <GradientEffect colors={colors} intensity={intensity} />;
  }
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});

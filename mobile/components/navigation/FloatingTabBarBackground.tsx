/**
 * FloatingTabBarBackground - Platform-specific glass effect background
 *
 * Renders the appropriate glass/blur effect based on platform:
 * - iOS 26+: Liquid glass via expo-glass-effect
 * - iOS < 26: BlurView via expo-blur
 * - Android: Simple semi-transparent dark background
 */

import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

type BackgroundVariant = 'liquid-glass' | 'blur-view' | 'simple';

function getBackgroundVariant(): BackgroundVariant {
  if (Platform.OS === 'ios') {
    if (isLiquidGlassAvailable()) {
      return 'liquid-glass';
    }
    return 'blur-view';
  }
  return 'simple';
}

interface FloatingTabBarBackgroundProps {
  children: React.ReactNode;
}

export function FloatingTabBarBackground({
  children,
}: FloatingTabBarBackgroundProps) {
  const variant = getBackgroundVariant();
  const borderRadius = 28;

  // iOS 26+ with liquid glass
  if (variant === 'liquid-glass') {
    return (
      <GlassView style={[styles.pill, { borderRadius }]} glassEffectStyle="clear">
        {children}
      </GlassView>
    );
  }

  // iOS < 26 with expo-blur
  if (variant === 'blur-view') {
    return (
      <View style={[styles.pill, { borderRadius }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.overlay]} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  // Android - simple semi-transparent background
  return (
    <View style={[styles.pill, styles.simplePill, { borderRadius }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    overflow: 'hidden',
  },
  simplePill: {
    backgroundColor: 'rgba(10, 10, 15, 0.75)',
  },
  overlay: {
    backgroundColor: 'rgba(10, 10, 15, 0.4)',
  },
  content: {
    flex: 1,
  },
});

/**
 * DecorativeAccents - Theme-specific SVG decorations at viewport edges
 *
 * Renders left and right decorations based on the current theme's effect type.
 * Each decoration type corresponds to a background effect (e.g., pulse → PulseDecoration).
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useBackgroundTheme } from '../../../stores/appStore';
import { getThemeConfig, type EffectType } from '../../../../src/shared/theme-backgrounds/types';

// Decoration imports
import { RibbonDecoration } from './RibbonDecoration';
import { PulseDecoration } from './PulseDecoration';
import { WaveDecoration } from './WaveDecoration';
import { BarsDecoration } from './BarsDecoration';
import { LightningDecoration } from './LightningDecoration';
import { OrbsDecoration } from './OrbsDecoration';
import { SparkleDecoration } from './SparkleDecoration';
import { GradientDecoration } from './GradientDecoration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DecorativeAccentsProps {
  /** Slide ID for theme selection */
  slideId: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Scale multiplier (default: 1) */
  scale?: number;
  /** Whether decorations are visible */
  visible?: boolean;
}

/**
 * Maps effect types to their corresponding decoration components.
 */
function getDecorationForEffect(effectType: EffectType) {
  const mapping: Record<EffectType, React.ComponentType<any>> = {
    contrails: RibbonDecoration,
    pulse: PulseDecoration,
    waves: WaveDecoration,
    bars: BarsDecoration,
    lightning: LightningDecoration,
    gradient: GradientDecoration,
    orbs: OrbsDecoration,
    stripes: WaveDecoration,
    sparkles: SparkleDecoration,
    ribbons: RibbonDecoration,
    grid: PulseDecoration,
    rays: SparkleDecoration,
  };
  return mapping[effectType] || RibbonDecoration;
}

export const DecorativeAccents = memo(function DecorativeAccents({
  slideId,
  delay = 0,
  scale = 1,
  visible = true,
}: DecorativeAccentsProps) {
  const { themeConfig, reducedMotion } = useBackgroundTheme(slideId);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && !reducedMotion) {
      opacity.value = withDelay(
        delay * 1000,
        withTiming(0.8, { duration: 500, easing: Easing.out(Easing.ease) })
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, delay, reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Don't render if reduced motion is enabled
  if (reducedMotion) {
    return null;
  }

  const DecorationComponent = getDecorationForEffect(themeConfig.effectType);

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      {/* Left decoration */}
      <View style={styles.leftDecoration}>
        <DecorationComponent
          colors={themeConfig.colors}
          side="left"
          delay={delay}
          animate={visible}
          scale={scale}
        />
      </View>

      {/* Right decoration */}
      <View style={styles.rightDecoration}>
        <DecorationComponent
          colors={themeConfig.colors}
          side="right"
          delay={delay + 0.15}
          animate={visible}
          scale={scale}
        />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    pointerEvents: 'none',
  },
  leftDecoration: {
    position: 'absolute',
    left: -SCREEN_WIDTH * 0.15,
    top: '40%',
    transform: [{ translateY: -80 }],
  },
  rightDecoration: {
    position: 'absolute',
    right: -SCREEN_WIDTH * 0.15,
    top: '40%',
    transform: [{ translateY: -80 }, { scaleX: -1 }],
  },
});

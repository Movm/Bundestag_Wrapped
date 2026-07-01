/**
 * DecorativeAccents - Themed side decorations for intro slides
 *
 * Displays themed decorations on left and right sides of the viewport.
 * The decoration type and colors are determined by the slideId.
 */

import { memo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { getThemeConfig, type EffectType, type ThemeColors } from '../../../src/shared/theme-backgrounds/types';

// Import decoration components
import { AuroraDecoration } from './AuroraDecoration';
import { BarsDecoration } from './BarsDecoration';
import { SparkleDecoration } from './SparkleDecoration';
import { WaveDecoration } from './WaveDecoration';
import { LightningDecoration } from './LightningDecoration';
import { PulseDecoration } from './PulseDecoration';
import { OrbsDecoration } from './OrbsDecoration';
import { GradientDecoration } from './GradientDecoration';

interface DecorationComponentProps {
  colors: ThemeColors;
  delay?: number;
  animate?: boolean;
  side: 'left' | 'right';
  scale?: number;
}

// Map effect types to decoration components
const EFFECT_TO_DECORATION: Record<EffectType, React.ComponentType<DecorationComponentProps>> = {
  contrails: AuroraDecoration,   // Intro
  pulse: PulseDecoration,        // Topics
  waves: WaveDecoration,         // Vocabulary
  bars: BarsDecoration,          // Speeches
  lightning: LightningDecoration, // Drama
  gradient: GradientDecoration,  // Discriminatory
  orbs: OrbsDecoration,          // Common-words
  stripes: WaveDecoration,       // Moin - use waves
  sparkles: SparkleDecoration,   // Swiftie
  ribbons: AuroraDecoration,     // Tone
  grid: PulseDecoration,         // Gender - use pulse
  rays: SparkleDecoration,       // Finale - use sparkles
};

interface DecorativeAccentsProps {
  /** Slide ID for themed decoration selection */
  slideId?: string;
  /** Delay before animations start (seconds) */
  delay?: number;
  /** Whether the slide is in view (controls animation) */
  isInView?: boolean;
}

/**
 * Decorative accent elements for section intro slides.
 *
 * Displays theme-appropriate decorations on both sides of the viewport.
 * The decoration type and colors are determined by the slideId.
 */
export const DecorativeAccents = memo(function DecorativeAccents({
  slideId,
  delay = 0,
  isInView = true,
}: DecorativeAccentsProps) {
  const { height } = useWindowDimensions();

  // Get theme configuration for the slide
  const config = getThemeConfig(slideId || 'intro');
  const DecorationComponent = EFFECT_TO_DECORATION[config.effectType] || AuroraDecoration;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Left decoration - at viewport edge, vertically centered */}
      <View style={[styles.left, { top: height * 0.35 }]}>
        <DecorationComponent
          colors={config.colors}
          side="left"
          delay={delay}
          animate={isInView}
        />
      </View>

      {/* Right decoration - at viewport edge, vertically centered */}
      <View style={[styles.right, { top: height * 0.35 }]}>
        <DecorationComponent
          colors={config.colors}
          side="right"
          delay={delay + 0.15}
          animate={isInView}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  left: {
    position: 'absolute',
    left: -25,
    opacity: 0.8,
  },
  right: {
    position: 'absolute',
    right: -25,
    opacity: 0.8,
  },
});

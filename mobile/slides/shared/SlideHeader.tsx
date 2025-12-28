import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { emojiPopEntering, fadeUpEntering } from './animations';
import { getSlideIconConfig } from '../../lib/slide-icons';

interface SlideHeaderProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  /** Size variant */
  size?: 'default' | 'large';
  /** Slide ID for custom icon lookup (e.g., 'reveal-common-words') */
  slideId?: string;
}

/**
 * SlideHeader - Reusable header component for slides
 *
 * Shows icon/emoji, title, and optional subtitle with staggered animations.
 * Used in result views and feature slides.
 * Supports custom SVG icons when slideId is provided.
 */
export function SlideHeader({ emoji, title, subtitle, size = 'default', slideId }: SlideHeaderProps) {
  const isLarge = size === 'large';

  // Get icon config from centralized source
  const iconConfig = slideId ? getSlideIconConfig(slideId) : undefined;
  const IconComponent = iconConfig?.Icon;
  const iconSize = isLarge ? 64 : 48;

  return (
    <View style={styles.container}>
      {IconComponent ? (
        <Animated.View entering={emojiPopEntering(0)} style={styles.iconContainer}>
          <IconComponent width={iconSize} height={iconSize} />
        </Animated.View>
      ) : emoji ? (
        <Animated.Text
          entering={emojiPopEntering(0)}
          style={[styles.emoji, isLarge && styles.emojiLarge]}
        >
          {emoji}
        </Animated.Text>
      ) : null}

      <Animated.Text
        entering={fadeUpEntering(100)}
        style={[styles.title, isLarge && styles.titleLarge]}
      >
        {title}
      </Animated.Text>

      {subtitle && (
        <Animated.Text entering={fadeUpEntering(200)} style={styles.subtitle}>
          {subtitle}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emojiLarge: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleLarge: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

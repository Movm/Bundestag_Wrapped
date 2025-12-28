import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SlideContainer } from './SlideContainer';
import { introAnimations } from './animations';
import { useDeferredRender } from '../../hooks/useDeferredRender';
import { getSlideIconConfig } from '../../lib/slide-icons';
import { DecorativeAccents } from '../../components/decorations';

interface SlideIntroProps {
  emoji: string;
  title?: string;
  subtitle?: string;
  /** Slide ID for themed background (e.g., 'intro-topics') */
  slideId?: string;
  /** Slide index for visibility-based animation trigger */
  slideIndex: number;
}

/**
 * SlideIntro - Native intro phase for a slide
 *
 * Shows emoji with one sentence. Title optional.
 * Animations: emoji pops in, title slides up, subtitle fades in later.
 */
export function SlideIntro({ emoji, title, subtitle, slideId, slideIndex }: SlideIntroProps) {
  // Wait for slide to be visible before mounting animated content
  const showContent = useDeferredRender(slideIndex, 0);

  // Get icon config from centralized source
  const iconConfig = slideId ? getSlideIconConfig(slideId) : undefined;
  const IconComponent = iconConfig?.Icon;

  return (
    <SlideContainer slideId={slideId}>
      {/* Decorative side accents - themed by slideId */}
      {showContent && <DecorativeAccents slideId={slideId} isInView={showContent} />}

      <View style={styles.content}>
        {showContent && (
          <>
            {/* Icon or Emoji with zoom pop effect */}
            {IconComponent ? (
              <Animated.View entering={introAnimations.emoji()} style={styles.iconContainer}>
                <IconComponent width={80} height={80} />
              </Animated.View>
            ) : (
              <Animated.Text
                entering={introAnimations.emoji()}
                style={styles.emoji}
              >
                {emoji}
              </Animated.Text>
            )}

            {/* Title with slide-up animation (matches web) */}
            {title && (
              <Animated.Text
                entering={introAnimations.title()}
                style={styles.title}
              >
                {title}
              </Animated.Text>
            )}

            {/* Subtitle with slide-up animation (matches web) */}
            {subtitle && (
              <Animated.Text
                entering={introAnimations.subtitle()}
                style={styles.subtitle}
              >
                {subtitle}
              </Animated.Text>
            )}
          </>
        )}
      </View>
    </SlideContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

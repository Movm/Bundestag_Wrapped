import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SlideContainer } from './SlideContainer';
import { infoAnimations } from './animations';
import { useDeferredRender } from '../../hooks/useDeferredRender';
import { getSlideIconConfig } from '../../lib/slide-icons';

interface SlideInfoProps {
  emoji: string;
  title: string;
  body: string;
  /** Slide ID for themed background (e.g., 'info-topics') */
  slideId?: string;
  /** Slide index for visibility-based animation trigger */
  slideIndex: number;
}

/**
 * SlideInfo - Native educational info slide
 *
 * Appears between quiz and reveal slides.
 * Shows emoji, title, and 1-2 sentences explaining the topic.
 * Animations: emoji pops in, title slides up, body fades in later.
 */
export function SlideInfo({ emoji, title, body, slideId, slideIndex }: SlideInfoProps) {
  // Wait for slide to be visible before mounting animated content
  const showContent = useDeferredRender(slideIndex, 0);

  // Get icon config from centralized source
  const iconConfig = slideId ? getSlideIconConfig(slideId) : undefined;
  const IconComponent = iconConfig?.Icon;

  return (
    <SlideContainer slideId={slideId}>
      <View style={styles.content}>
        {showContent && (
          <>
            {/* Icon or Emoji with zoom pop effect */}
            {IconComponent ? (
              <Animated.View entering={infoAnimations.emoji()} style={styles.iconContainer}>
                <IconComponent width={64} height={64} />
              </Animated.View>
            ) : (
              <Animated.Text
                entering={infoAnimations.emoji()}
                style={styles.emoji}
              >
                {emoji}
              </Animated.Text>
            )}

            {/* Title with slide-up animation */}
            <Animated.Text
              entering={infoAnimations.title()}
              style={styles.title}
            >
              {title}
            </Animated.Text>

            {/* Body with delayed fade-in */}
            <Animated.Text
              entering={infoAnimations.body()}
              style={styles.body}
            >
              {body}
            </Animated.Text>
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
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  body: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
});

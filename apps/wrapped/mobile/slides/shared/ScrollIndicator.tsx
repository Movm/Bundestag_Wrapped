import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useBottomSafeZone } from '~/stores/appStore';

interface ScrollIndicatorProps {
  visible: boolean;
}

/**
 * ScrollIndicator - Animated bouncing arrow to indicate scrolling
 *
 * Shows a bouncing chevron down arrow with hint text.
 * Appears on the first slide to guide users to scroll.
 * Fades out when user scrolls past the first slide.
 */
export function ScrollIndicator({ visible }: ScrollIndicatorProps) {
  const bottomSafeZone = useBottomSafeZone();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Start bounce animation with initial delay
  useEffect(() => {
    translateY.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Fade in after initial delay
    opacity.value = withDelay(500, withTiming(1, { duration: 400 }));
  }, []);

  // Fade out when visibility changes
  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { bottom: bottomSafeZone + 8 }, animatedStyle]}
      pointerEvents="none"
    >
      <Text style={styles.arrow}>↓</Text>
      <Text style={styles.hint}>Nach unten scrollen</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  arrow: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

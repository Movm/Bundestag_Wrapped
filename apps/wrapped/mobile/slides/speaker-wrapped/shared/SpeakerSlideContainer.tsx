import { View, StyleSheet, type ViewStyle } from 'react-native';
import {
  useAvailableHeight,
  useTopInset,
  useBottomSafeZone,
} from '~/stores/appStore';

interface SpeakerSlideContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

/**
 * SpeakerSlideContainer - Height-aware container for speaker-wrapped sections
 *
 * Mirrors the layout behavior of main slides' SlideContainer but simpler:
 * - Uses reactive height from Zustand store
 * - Handles safe areas (notch, home indicator)
 * - Accounts for floating tab bar
 * - No background theming system (speaker uses solid backgrounds)
 */
export function SpeakerSlideContainer({
  children,
  style,
  backgroundColor = '#0a0a0a',
}: SpeakerSlideContainerProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();
  const bottomSafeZone = useBottomSafeZone();

  return (
    <View
      style={[
        styles.container,
        {
          minHeight: availableHeight,
          paddingTop: topInset + 16,
          paddingBottom: bottomSafeZone,
          backgroundColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});

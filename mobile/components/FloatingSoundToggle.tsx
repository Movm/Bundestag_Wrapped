/**
 * FloatingSoundToggle - Floating sound control in top-right corner
 *
 * Positioned with absolute positioning, accounting for safe area.
 * Shows mute toggle and animated track info when music changes.
 * Semi-transparent background for visibility over any slide content.
 */

import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SoundToggleButton } from './SoundToggleButton';

export function FloatingSoundToggle() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <SoundToggleButton size={22} trackInfoPosition="left" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    zIndex: 1000,
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});

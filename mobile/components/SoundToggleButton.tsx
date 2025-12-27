import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, Text, Animated } from 'react-native';
import { Volume2, VolumeX, Music } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTrackInfo, useAccentColor, useMuted, useAppStore } from '../stores/appStore';
import { themeMusic } from '../lib/theme-music';
import { TRACK_INFO_DISPLAY_DURATION } from '@/shared/theme-music';

interface SoundToggleButtonProps {
  size?: number;
  style?: object;
  /** Position of track info relative to button. Default: 'right' (info on left of button) */
  trackInfoPosition?: 'left' | 'right';
}

/**
 * Sound mute/unmute toggle button with track info display.
 * Shows currently playing theme music info next to the button.
 * Colors adapt to current slide section for cohesive theming.
 *
 * Uses Zustand selectors for optimal re-render performance:
 * - Only re-renders when trackInfo or accentColor actually changes
 * - Not when other app state changes
 */
export function SoundToggleButton({
  size = 24,
  style,
  trackInfoPosition = 'right',
}: SoundToggleButtonProps) {
  // Zustand selectors - only re-render when these specific values change
  const muted = useMuted();
  const trackInfo = useTrackInfo();
  const accentColor = useAccentColor();
  const [showInfo, setShowInfo] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastTrackRef = useRef<string | null>(null);

  // Show track info when track changes
  useEffect(() => {
    if (!trackInfo) {
      setShowInfo(false);
      return;
    }

    const trackKey = `${trackInfo.title}-${trackInfo.artist}`;
    if (trackKey !== lastTrackRef.current) {
      lastTrackRef.current = trackKey;
      setShowInfo(true);

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setShowInfo(false));
      }, TRACK_INFO_DISPLAY_DURATION);

      return () => clearTimeout(timer);
    }
  }, [trackInfo, fadeAnim]);

  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMuted = await useAppStore.getState().toggleMute();

    // Control theme music based on new mute state
    if (newMuted) {
      themeMusic.pause();
    } else {
      themeMusic.resume();
    }
  }, []);

  // Convert hex to rgba for background tint
  const accentRgba = hexToRgba(accentColor, 0.15);

  // Track info on left = normal row, track info on right = reversed
  const containerDirection =
    trackInfoPosition === 'left' ? 'row' : 'row-reverse';

  return (
    <View style={[styles.container, { flexDirection: containerDirection }, style]}>
      {showInfo && trackInfo && (
        <Animated.View
          style={[
            styles.trackInfo,
            { opacity: fadeAnim, backgroundColor: accentRgba },
          ]}
        >
          <Music color={accentColor} size={12} />
          <Text style={[styles.trackText, { color: accentColor }]} numberOfLines={1}>
            {trackInfo.title} – {trackInfo.artist}
          </Text>
        </Animated.View>
      )}
      <Pressable
        onPress={handlePress}
        style={styles.button}
        accessibilityLabel={muted ? 'Ton einschalten' : 'Ton ausschalten'}
        accessibilityRole="button"
      >
        {muted ? (
          <VolumeX color={accentColor} size={size} style={{ opacity: 0.7 }} />
        ) : (
          <Volume2 color={accentColor} size={size} />
        )}
      </Pressable>
    </View>
  );
}

/**
 * Convert hex color to rgba string
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  button: {
    padding: 8,
    borderRadius: 8,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 200,
  },
  trackText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

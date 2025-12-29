/**
 * FloatingTabBar - Floating pill-shaped bottom navigation
 *
 * A custom tab bar component for Expo Router that renders as a
 * centered floating pill with platform-specific glass effects.
 *
 * Features:
 * - Dynamic accent color from slide theme via useAccentColor()
 * - Platform-specific glass/blur backgrounds
 * - Positioned above safe area
 * - Double-tap home to restart wrapped experience
 */

import { useState, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Users } from 'lucide-react-native';
import { useAccentColor, useAppStore } from '../../stores/appStore';
import { useScrollStore } from '../../stores/scrollStore';
import { useQuizStore } from '../../stores/quizStore';
import { themeMusic } from '../../lib/theme-music';
import { FloatingTabBarBackground } from './FloatingTabBarBackground';
import { RestartConfirmationModal } from './RestartConfirmationModal';

// Icon mapping for routes
const ROUTE_ICONS: Record<string, typeof Home> = {
  index: Home,
  abgeordnete: Users,
};

interface TabButtonProps {
  routeName: string;
  isFocused: boolean;
  accentColor: string;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  routeName,
  isFocused,
  accentColor,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const Icon = ROUTE_ICONS[routeName] ?? Home;
  const iconColor = isFocused ? accentColor : '#71717a';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.button}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
    >
      <Icon color={iconColor} size={22} strokeWidth={2.5} />
    </Pressable>
  );
}

interface HomeTabButtonProps {
  isFocused: boolean;
  accentColor: string;
  onPress: () => void;
  onDoubleTap: () => void;
}

/**
 * Home tab button with double-tap detection for restart
 * Uses Gesture.Exclusive to distinguish single vs double tap
 */
function HomeTabButton({
  isFocused,
  accentColor,
  onPress,
  onDoubleTap,
}: HomeTabButtonProps) {
  const iconColor = isFocused ? accentColor : '#71717a';

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (isFocused) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onDoubleTap)();
      }
    });

  const singleTap = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)();
  });

  const gesture = Gesture.Exclusive(doubleTap, singleTap);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.button}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityHint={isFocused ? 'Doppeltippen zum Neustart' : undefined}
      >
        <Home color={iconColor} size={22} strokeWidth={2.5} />
      </View>
    </GestureDetector>
  );
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const accentColor = useAccentColor();
  const [showRestartModal, setShowRestartModal] = useState(false);

  // Position above safe area with some margin
  const bottomOffset = Math.max(insets.bottom, 16) + 8;

  const handleRestart = useCallback(() => {
    setShowRestartModal(false);

    // Full reset sequence:
    // 1. Reset quiz progress
    useQuizStore.getState().reset();

    // 2. Stop theme music
    themeMusic.stop();

    // 3. Reset app store (theme, slide)
    useAppStore.getState().setCurrentTheme(null);
    useAppStore.getState().setCurrentSlide(null);

    // 4. Trigger scroll reset (WrappedExperience will handle FlatList scroll)
    useScrollStore.getState().requestReset();
  }, []);

  const handleShowRestartModal = useCallback(() => {
    setShowRestartModal(true);
  }, []);

  const handleCancelRestart = useCallback(() => {
    setShowRestartModal(false);
  }, []);

  return (
    <>
      <View
        style={[styles.container, { bottom: bottomOffset }]}
        pointerEvents="box-none"
      >
        <FloatingTabBarBackground>
          <View style={styles.buttonContainer}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              // Use HomeTabButton for home tab (with double-tap detection)
              if (route.name === 'index') {
                return (
                  <HomeTabButton
                    key={route.key}
                    isFocused={isFocused}
                    accentColor={accentColor}
                    onPress={onPress}
                    onDoubleTap={handleShowRestartModal}
                  />
                );
              }

              return (
                <TabButton
                  key={route.key}
                  routeName={route.name}
                  isFocused={isFocused}
                  accentColor={accentColor}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            })}
          </View>
        </FloatingTabBarBackground>
      </View>

      <RestartConfirmationModal
        visible={showRestartModal}
        onConfirm={handleRestart}
        onCancel={handleCancelRestart}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

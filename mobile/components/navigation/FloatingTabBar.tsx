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
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Users } from 'lucide-react-native';
import { useAccentColor } from '../../stores/appStore';
import { FloatingTabBarBackground } from './FloatingTabBarBackground';

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

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const accentColor = useAccentColor();

  // Position above safe area with some margin
  const bottomOffset = Math.max(insets.bottom, 16) + 8;

  return (
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

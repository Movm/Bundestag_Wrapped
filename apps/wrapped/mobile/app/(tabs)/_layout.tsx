import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../components/navigation/FloatingTabBar';

/**
 * Tab Layout
 *
 * Bottom navigation with 2 tabs:
 * - Wrapped: Main 44-slide wrapped experience
 * - Abgeordnete: Speaker search/list
 *
 * Uses a floating pill-shaped tab bar with platform-specific glass effects:
 * - iOS 26+: Liquid glass via expo-glass-effect
 * - iOS < 26: BlurView fallback
 * - Android: Skia-based frosted glass
 *
 * Accent color adapts dynamically to current slide section.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: false, // Keep screens mounted to preserve state and audio
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Wrapped' }} />
      <Tabs.Screen name="abgeordnete" options={{ title: 'Abgeordnete' }} />
    </Tabs>
  );
}

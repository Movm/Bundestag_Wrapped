import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient, restoreQueryCache } from '../lib/queryClient';
import { initSounds } from '../lib/sounds';
import { useNotifications } from '../hooks/useNotifications';
import { useAppStore } from '../stores/appStore';
import '../global.css';

/**
 * LayoutInitializer - Syncs safe area insets to Zustand store
 *
 * This component populates the store's topInset/bottomInset values
 * so all slides can use useTopInset() for consistent positioning.
 */
function LayoutInitializer() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    useAppStore.getState().updateLayout(width, height, insets.top, insets.bottom);
  }, [width, height, insets.top, insets.bottom]);

  return null;
}

export default function RootLayout() {
  // Initialize push notifications
  const { expoPushToken } = useNotifications();

  // Initialize app state on startup (non-blocking)
  useEffect(() => {
    // Load mute state from AsyncStorage FIRST (before any sounds can play)
    useAppStore.getState().initMuteState();
    // Restore query cache and preload sound effects
    restoreQueryCache().catch(e => console.warn('Cache restore skipped:', e));
    initSounds().catch(e => console.warn('Sound init skipped:', e));
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <SafeAreaProvider>
        <LayoutInitializer />
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor="#0a0a0f" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0a0a0f' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="(tabs)"
              options={{
                animation: 'fade',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="speaker/[slug]"
              options={{
                animation: 'slide_from_bottom',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="wrapped/[slug]"
              options={{
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

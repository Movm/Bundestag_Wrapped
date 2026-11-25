import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { MENU_FONTS } from '../src/menu/menuFonts';

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({ ...MENU_FONTS });
  // Render without the fonts if loading fails: the menu falls back to the system font.
  if (!fontsLoaded && !fontError) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}

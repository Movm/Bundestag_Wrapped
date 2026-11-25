import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { OpenSans_800ExtraBold } from '@expo-google-fonts/open-sans/800ExtraBold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { MENU_FONTS } from '../src/menu/menuFonts';

// The splash stays until the fonts are in; NativeCover hides it on its first layout.
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** The cover's faces, under the family names of cover.css. Deep imports bundle only the 800 weight. */
const COVER_FONTS = { 'Cover Display': OpenSans_800ExtraBold, 'Cover Action': Archivo_800ExtraBold };

export default function Layout() {
  const [loaded, error] = useFonts({ ...COVER_FONTS, ...MENU_FONTS });
  // Render without the fonts if loading fails: cover and menu fall back to the system font.
  if (!loaded && !error) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}

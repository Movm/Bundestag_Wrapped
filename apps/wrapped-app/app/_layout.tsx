import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { OpenSans_800ExtraBold } from '@expo-google-fonts/open-sans/800ExtraBold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';

// The splash stays until the fonts are in; NativeCover hides it on its first layout.
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** The cover's faces, under the family names of cover.css. Deep imports bundle only the 800 weight. */
const COVER_FONTS = { 'Cover Display': OpenSans_800ExtraBold, 'Cover Action': Archivo_800ExtraBold };

export default function Layout() {
  const [loaded, error] = useFonts({ ...COVER_FONTS });
  if (!loaded && !error) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLinkingURL } from 'expo-linking';
import WrappedDom, { type WrappedDomHandle } from '../src/dom/WrappedDom';
import { type NativeToWeb, type WebToNative } from '../../wrapped/src/shared/native-bridge/protocol';
import { createWebMessageHandler } from '../src/native/onWebMessage';
import { createPreviewCodeDelivery } from '../src/native/previewCodeDelivery';
import { VIEWPORT_FIT_SCRIPT } from '../src/dom/viewportFitScript';
import { NativeCover } from '../src/cover/NativeCover';
import { useCoverBridge } from '../src/cover/useCoverBridge';
import { NativeMenu } from '../src/menu/NativeMenu';
import { useMenuBridge } from '../src/menu/useMenuBridge';

export default function Index() {
  const dom = useRef<WrappedDomHandle>(null);
  const insets = useSafeAreaInsets();
  const receive = useCallback((message: NativeToWeb) => dom.current?.receive(message), []);
  const cover = useCoverBridge(receive);
  const menu = useMenuBridge(receive);
  const { onWebCover } = cover;
  const { open: openMenu } = menu;
  const delivery = useMemo(() => createPreviewCodeDelivery(receive), [receive]);
  const onWebMessage = useMemo(() => {
    const handle = createWebMessageHandler(receive, openMenu, onWebCover);
    // Any web message proves the bridge is up: only then does a held preview code go out.
    return (message: WebToNative) => { delivery.webAlive(); return handle(message); };
  }, [receive, openMenu, onWebCover, delivery]);
  // Tester link `bundestag-wrapped://zugang?code=…`: hand the code to the web, which keeps it and reloads.
  const url = useLinkingURL();
  useEffect(() => { delivery.link(url); }, [url, delivery]);
  // The cover and the menu re-render this screen; the web view must not re-render (and re-send its props) with it.
  const web = useMemo(() => (
    <WrappedDom
      ref={dom}
      initialPath="/"
      platform={Platform.OS === 'android' ? 'android' : 'ios'}
      appVersion={Constants.expoConfig?.version ?? '0'}
      onWebMessage={onWebMessage}
      dom={{ style: { flex: 1 }, contentInsetAdjustmentBehavior: 'never', injectedJavaScriptBeforeContentLoaded: VIEWPORT_FIT_SCRIPT, webviewDebuggingEnabled: __DEV__ }}
    />
  ), [onWebMessage]);
  return (
    <View style={{ flex: 1, backgroundColor: '#0e0a14' }}>
      {/* accessibilityViewIsModal on the cover is iOS-only; TalkBack must not reach the web under it either. */}
      {/* Android draws edge to edge and its WebView reports no safe-area insets, so the web is laid out inside them. iOS gets them from the web's env(). */}
      <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? insets.top : 0, paddingBottom: Platform.OS === 'android' ? insets.bottom : 0 }} importantForAccessibility={cover.state.phase.name === 'hidden' ? 'auto' : 'no-hide-descendants'}>
        {web}
      </View>
      <NativeCover {...cover} />
      <NativeMenu {...menu} />
    </View>
  );
}

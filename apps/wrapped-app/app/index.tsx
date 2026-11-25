import { useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { useLinkingURL } from 'expo-linking';
import WrappedDom, { type WrappedDomHandle } from '../src/dom/WrappedDom';
import { type NativeToWeb, type WebToNative } from '../../wrapped/src/shared/native-bridge/protocol';
import { createWebMessageHandler } from '../src/native/onWebMessage';
import { createPreviewCodeDelivery } from '../src/native/previewCodeDelivery';
import { VIEWPORT_FIT_SCRIPT } from '../src/dom/viewportFitScript';

export default function Index() {
  const dom = useRef<WrappedDomHandle>(null);
  const receive = useMemo(() => (message: NativeToWeb) => dom.current?.receive(message), []);
  const delivery = useMemo(() => createPreviewCodeDelivery(receive), [receive]);
  const onWebMessage = useMemo(() => {
    const handle = createWebMessageHandler(receive);
    // Any web message proves the bridge is up: only then does a held preview code go out.
    return (message: WebToNative) => { delivery.webAlive(); return handle(message); };
  }, [receive, delivery]);
  // Tester link `bundestag-wrapped://zugang?code=…`: hand the code to the web, which keeps it and reloads.
  const url = useLinkingURL();
  useEffect(() => { delivery.link(url); }, [url, delivery]);
  return (
    <View style={{ flex: 1, backgroundColor: '#0e0a14' }}>
      <WrappedDom
        ref={dom}
        initialPath="/"
        platform={Platform.OS === 'android' ? 'android' : 'ios'}
        appVersion={Constants.expoConfig?.version ?? '0'}
        onWebMessage={onWebMessage}
        dom={{ style: { flex: 1 }, contentInsetAdjustmentBehavior: 'never', injectedJavaScriptBeforeContentLoaded: VIEWPORT_FIT_SCRIPT, webviewDebuggingEnabled: __DEV__ }}
      />
    </View>
  );
}

import { useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import WrappedDom, { type WrappedDomHandle } from '../src/dom/WrappedDom';
import { createWebMessageHandler } from '../src/native/onWebMessage';
import { VIEWPORT_FIT_SCRIPT } from '../src/dom/viewportFitScript';
import { NativeMenu } from '../src/menu/NativeMenu';
import { useMenuBridge } from '../src/menu/useMenuBridge';

export default function Index() {
  const dom = useRef<WrappedDomHandle>(null);
  const menu = useMenuBridge(message => dom.current?.receive(message));
  const { open: openMenu } = menu;
  const onWebMessage = useMemo(() => createWebMessageHandler(message => dom.current?.receive(message), openMenu), [openMenu]);
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
      <NativeMenu {...menu} />
    </View>
  );
}

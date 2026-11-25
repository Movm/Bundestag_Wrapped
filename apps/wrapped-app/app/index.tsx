import { useCallback, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import WrappedDom, { type WrappedDomHandle } from '../src/dom/WrappedDom';
import { createWebMessageHandler } from '../src/native/onWebMessage';
import { VIEWPORT_FIT_SCRIPT } from '../src/dom/viewportFitScript';
import { NativeMenu } from '../src/menu/NativeMenu';
import { useMenuBridge } from '../src/menu/useMenuBridge';
import { type NativeToWeb } from '../../wrapped/src/shared/native-bridge/protocol';

export default function Index() {
  const dom = useRef<WrappedDomHandle>(null);
  const receive = useCallback((message: NativeToWeb) => dom.current?.receive(message), []);
  const menu = useMenuBridge(receive);
  const { open: openMenu } = menu;
  const onWebMessage = useMemo(() => createWebMessageHandler(receive, openMenu), [receive, openMenu]);
  // Opening the menu re-renders this screen; the web view must not re-render (and re-send its props) with it.
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
      {web}
      <NativeMenu {...menu} />
    </View>
  );
}

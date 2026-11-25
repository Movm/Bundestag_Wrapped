import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import WrappedDom, { type WrappedDomHandle } from '../src/dom/WrappedDom';
import { createWebMessageHandler } from '../src/native/onWebMessage';

export default function Index() {
  const dom = useRef<WrappedDomHandle>(null);
  const onWebMessage = useMemo(() => createWebMessageHandler(message => dom.current?.receive(message)), []);
  return (
    <View style={{ flex: 1, backgroundColor: '#0e0a14' }}>
      <WrappedDom
        ref={dom}
        initialPath="/"
        onWebMessage={onWebMessage}
        // Task 6 replaces 'never' with the safe-area handling it settles on.
        dom={{ style: { flex: 1 }, contentInsetAdjustmentBehavior: 'never', webviewDebuggingEnabled: __DEV__ }}
      />
    </View>
  );
}

import { Platform } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { type MenuEntry, type MenuFooterLink, type NativeToWeb, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';

export interface MenuState { entries: MenuEntry[]; footer: MenuFooterLink[]; canRestart: boolean }

export interface MenuBridge {
  open(m: Extract<WebToNative, { type: 'menu.open' }>): void;
  choose(href: string): void;
  restart(): void;
  close(): void;
  /** Modal `onDismiss` (iOS): opens the link that was waiting for the modal to go away. */
  dismissed(): void;
}

/** Plain logic behind the hook: `onState(null)` means closed. */
export function createMenuBridge(
  send: (m: NativeToWeb) => void,
  onState: (state: MenuState | null) => void,
  deferExternal = false,
): MenuBridge {
  let chosen = false;
  let pendingUrl: string | null = null;
  const close = () => onState(null);
  return {
    open(m) {
      chosen = false;
      onState({ entries: m.entries, footer: m.footer, canRestart: m.canRestart });
    },
    choose(href) {
      if (chosen) return;
      chosen = true;
      if (href.startsWith('https://')) {
        // iOS can refuse to present a browser while the Modal is still dismissing: close first, open on dismiss.
        if (deferExternal) pendingUrl = href;
        close();
        if (!deferExternal) void WebBrowser.openBrowserAsync(href);
        return;
      }
      send({ type: 'navigate', href });
      close();
    },
    restart() {
      if (chosen) return;
      chosen = true;
      send({ type: 'restart' });
      close();
    },
    close,
    dismissed() {
      const url = pendingUrl;
      pendingUrl = null;
      if (url) void WebBrowser.openBrowserAsync(url);
    },
  };
}

export function useMenuBridge(send: (m: NativeToWeb) => void) {
  const [state, setState] = useState<MenuState | null>(null);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  const forward = useCallback((m: NativeToWeb) => sendRef.current(m), []);
  const bridge = useMemo(() => createMenuBridge(forward, setState, Platform.OS === 'ios'), [forward]);
  return { state, ...bridge };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { type MenuEntry, type MenuFooterLink, type NativeToWeb, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';

export interface MenuState { entries: MenuEntry[]; footer: MenuFooterLink[]; canRestart: boolean }

export interface MenuBridge {
  open(m: Extract<WebToNative, { type: 'menu.open' }>): void;
  choose(href: string): void;
  restart(): void;
  close(): void;
}

/** Plain logic behind the hook: `onState(null)` means closed. */
export function createMenuBridge(send: (m: NativeToWeb) => void, onState: (state: MenuState | null) => void): MenuBridge {
  let chosen = false;
  const close = () => onState(null);
  return {
    open(m) {
      chosen = false;
      onState({ entries: m.entries, footer: m.footer, canRestart: m.canRestart });
    },
    choose(href) {
      if (chosen) return;
      chosen = true;
      if (href.startsWith('https://')) void WebBrowser.openBrowserAsync(href);
      else send({ type: 'navigate', href });
      close();
    },
    restart() {
      send({ type: 'restart' });
      close();
    },
    close,
  };
}

export function useMenuBridge(send: (m: NativeToWeb) => void) {
  const [state, setState] = useState<MenuState | null>(null);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  const forward = useCallback((m: NativeToWeb) => sendRef.current(m), []);
  const bridge = useMemo(() => createMenuBridge(forward, setState), [forward]);
  return { state, ...bridge };
}

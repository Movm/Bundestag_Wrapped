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

const COLORS: readonly string[] = ['pink', 'violet', 'white', 'mint'];
const str = (v: unknown): v is string => typeof v === 'string';

/** The payload comes from the web view: drop malformed entries, fall back to white for an unknown colour; null = nothing usable. */
export function parseMenuOpen(m: unknown): MenuState | null {
  if (typeof m !== 'object' || m === null) return null;
  const { entries, footer, canRestart } = m as Record<string, unknown>;
  if (!Array.isArray(entries)) return null;
  const valid: MenuEntry[] = [];
  for (const e of entries) {
    if (typeof e !== 'object' || e === null) continue;
    const r = e as Record<string, unknown>;
    if (!str(r.href) || !str(r.label) || !str(r.title)) continue;
    valid.push({
      href: r.href,
      label: r.label,
      title: r.title,
      color: COLORS.includes(r.color as string) ? (r.color as MenuEntry['color']) : 'white',
      rotate: typeof r.rotate === 'number' && Number.isFinite(r.rotate) ? r.rotate : 0,
      tile: r.tile === true,
      active: r.active === true,
    });
  }
  if (valid.length === 0) return null;
  const links = (Array.isArray(footer) ? footer : []).flatMap((f): MenuFooterLink[] => {
    const r = f as Record<string, unknown> | null;
    return r && str(r.href) && str(r.label) ? [{ href: r.href, label: r.label, external: r.external === true }] : [];
  });
  return { entries: valid, footer: links, canRestart: canRestart === true };
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
      const next = parseMenuOpen(m);
      if (!next) return;
      chosen = false;
      onState(next);
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

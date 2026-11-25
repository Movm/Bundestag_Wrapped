import * as WebBrowser from 'expo-web-browser';
import { type NativeToWeb, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';
import { shareFromWeb } from './shareFromWeb';

function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Handles messages from the web app. Unknown types are ignored: the protocol is additive,
 * so a newer web build may send what this binary does not know yet.
 */
export function createWebMessageHandler(
  receive: (message: NativeToWeb) => void,
  openMenu: (message: Extract<WebToNative, { type: 'menu.open' }>) => void = () => {},
) {
  return async (message: WebToNative): Promise<void> => {
    if (typeof message !== 'object' || message === null) return;
    switch (message.type) {
      case 'share': {
        const ok = await shareFromWeb(message);
        receive({ type: 'share.result', id: message.id, ok });
        return;
      }
      case 'openUrl':
        // The URL comes from the page and ultimately from remote JSON: web links only.
        if (isWebUrl(message.url)) await WebBrowser.openBrowserAsync(message.url);
        return;
      case 'log':
        console.error(`[wrapped-web] ${message.text}`);
        return;
      case 'menu.open':
        openMenu(message);
        return;
      case 'cover': // Plan 03
      case 'music': // Plan 04
        return;
      default:
        return;
    }
  };
}

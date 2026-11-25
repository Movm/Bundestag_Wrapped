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
  // Plan 02 fills this slot with the menu; positional so both plans merge without reshaping the call.
  _openMenu?: (message: Extract<WebToNative, { type: 'menu.open' }>) => void,
  onCover?: (message: Extract<WebToNative, { type: 'cover' }>) => void,
) {
  return async (message: WebToNative): Promise<void> => {
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
      case 'cover':
        onCover?.(message);
        return;
      case 'menu.open': // Plan 02
      case 'music': // Plan 04
        return;
      default:
        return;
    }
  };
}

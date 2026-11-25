import * as WebBrowser from 'expo-web-browser';
import { type NativeToWeb, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';
import { shareFromWeb } from './shareFromWeb';

/**
 * Handles messages from the web app. Unknown types are ignored: the protocol is additive,
 * so a newer web build may send what this binary does not know yet.
 */
export function createWebMessageHandler(receive: (message: NativeToWeb) => void) {
  return async (message: WebToNative): Promise<void> => {
    switch (message.type) {
      case 'share': {
        const ok = await shareFromWeb(message);
        receive({ type: 'share.result', id: message.id, ok });
        return;
      }
      case 'openUrl':
        await WebBrowser.openBrowserAsync(message.url);
        return;
      case 'log':
        console.error(`[wrapped-web] ${message.text}`);
        return;
      case 'menu.open': // Plan 02
      case 'cover': // Plan 03
      case 'music': // Plan 04
        return;
      default:
        return;
    }
  };
}

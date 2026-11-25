import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';

type ShareMessage = Extract<WebToNative, { type: 'share' }>;

/** Shares a web `navigator.share` request. Resolves false when nothing could be shared. */
export async function shareFromWeb(message: ShareMessage): Promise<boolean> {
  try {
    const first = message.files?.[0];
    if (first) {
      // Cache names come from the page; keep only the base name so a file cannot leave the cache dir.
      const name = first.name.split(/[\\/]/).pop() || 'share';
      const file = new File(Paths.cache, name);
      file.write(first.base64, { encoding: 'base64' });
      await Sharing.shareAsync(file.uri, { mimeType: first.type });
      return true;
    }
    const text = [message.text, message.url].filter(Boolean).join('\n');
    const result = await Share.share(message.url && !message.text ? { url: message.url, message: message.url, title: message.title } : { message: text, title: message.title });
    return result.action !== Share.dismissedAction;
  } catch (error) {
    // Native console: the web side only learns `ok: false`, so without this a failed share leaves no trace.
    console.error('[wrapped-share] share failed', error);
    return false;
  }
}

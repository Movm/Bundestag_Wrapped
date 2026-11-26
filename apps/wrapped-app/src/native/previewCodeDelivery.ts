import { type NativeToWeb } from '../../../wrapped/src/shared/native-bridge/protocol';
import { previewCodeMessage } from './previewCodeLink';

/**
 * Hands a preview code from a deep link to the web, but only once the web has proven it is
 * alive (its first message). A link that arrives earlier is kept and delivered exactly once.
 */
export function createPreviewCodeDelivery(receive: (message: NativeToWeb) => void) {
  let alive = false;
  let pending: NativeToWeb | null = null;
  return {
    /** A deep link arrived (cold start or later). */
    link(url: string | null | undefined): void {
      const message = previewCodeMessage(url);
      if (!message) return;
      if (alive) receive(message);
      else pending = message;
    },
    /** The web sent a message: it is up. Call for every web message, whatever its type. */
    webAlive(): void {
      alive = true;
      const message = pending;
      pending = null;
      if (message) receive(message);
    },
  };
}

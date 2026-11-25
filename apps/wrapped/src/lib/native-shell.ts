import { type NativeToWeb, type WebToNative } from '@/shared/native-bridge/protocol';

type Handler = (message: NativeToWeb) => void;

let send: ((message: WebToNative) => void) | null = null;
const handlers = new Map<NativeToWeb['type'], Set<Handler>>();
const pending: NativeToWeb[] = [];

/** False in the browser. The app entry calls `installNativeShell` once; nothing else flips it. */
export function isNativeShell(): boolean {
  return send !== null;
}

/** No-op outside the native shell. */
export function postToNative(message: WebToNative): void {
  send?.(message);
}

function deliver(message: NativeToWeb): boolean {
  const set = handlers.get(message.type);
  if (!set || set.size === 0) return false;
  for (const handler of [...set]) handler(message);
  return true;
}

/** Subscribes to one native message type; messages that arrived earlier are delivered now. */
export function onNativeMessage<T extends NativeToWeb['type']>(
  type: T,
  handler: (message: Extract<NativeToWeb, { type: T }>) => void,
): () => void {
  const set = handlers.get(type) ?? new Set<Handler>();
  handlers.set(type, set);
  set.add(handler as Handler);
  for (let i = 0; i < pending.length; ) {
    if (pending[i].type === type) {
      const [message] = pending.splice(i, 1);
      deliver(message);
    } else i++;
  }
  return () => { set.delete(handler as Handler); };
}

export function installNativeShell(post: (message: WebToNative) => void): { receive(message: NativeToWeb): void } {
  send = post;
  return {
    receive(message) {
      if (!deliver(message)) pending.push(message);
    },
  };
}

/** Tests only. */
export function _resetNativeShellForTesting(): void {
  send = null;
  handlers.clear();
  pending.length = 0;
}

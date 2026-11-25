'use dom';

import { Component, type ReactNode, type Ref } from 'react';
import { useDOMImperativeHandle, type DOMImperativeFactory, type DOMProps } from 'expo/dom';
import './dom-shell.css';
import '../../../wrapped/src/index.css';
import '../../../wrapped/src/cover/cover.css';
import './dom-fonts.css';
import WrappedAppRoot from '../../../wrapped/src/app-entry/WrappedAppRoot';
import { isAppRoute } from '../../../wrapped/src/app-entry/app-routes';
import { createCover } from '../../../wrapped/src/cover/cover';
import { installNativeShell, onNativeMessage } from '../../../wrapped/src/lib/native-shell';
import { type NativeToWeb, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';
import { interceptLinks, polyfillShare, reportCrashes } from './domShell';

export type WrappedDomHandle = { receive: (message: NativeToWeb) => void };

interface Props {
  initialPath: string;
  onWebMessage: (message: WebToNative) => Promise<void>;
  ref: Ref<WrappedDomHandle>;
  dom?: DOMProps;
}

// H12: the cover boot script is inlined by Vite in the browser; here the entry provides the factory.
// Goes away once Plan 03 renders the cover natively.
window.__btCreateCover = createCover;

let post: (message: WebToNative) => void = () => {};
const send = (message: WebToNative) => post(message);

// Once per module load, not per render.
const shell = installNativeShell(send);
const waiting = new Map<number, (ok: boolean) => void>();
onNativeMessage('share.result', message => {
  waiting.get(message.id)?.(message.ok);
  waiting.delete(message.id);
});
polyfillShare(send, id => new Promise<boolean>(resolve => { waiting.set(id, resolve); }));
interceptLinks(send, isAppRoute);
reportCrashes(send);

class CrashBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    send({ type: 'log', level: 'error', text: `render crash: ${String(error?.stack ?? error)}\n${String(info.componentStack ?? '')}`.slice(0, 2000) });
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function WrappedDom({ initialPath, onWebMessage, ref }: Props) {
  post = m => { void onWebMessage(m).catch(() => {}); };
  // Boundary cast: Expo types handle methods as taking JSON values; the native caller is typed by WrappedDomHandle.
  useDOMImperativeHandle(ref as unknown as Ref<DOMImperativeFactory>, () => ({ receive: (message: NativeToWeb) => shell.receive(message) }) as unknown as DOMImperativeFactory, []);
  return (
    <CrashBoundary>
      <WrappedAppRoot initialPath={initialPath} />
    </CrashBoundary>
  );
}

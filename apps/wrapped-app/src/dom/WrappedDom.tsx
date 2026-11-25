'use dom';

import { Component, useEffect, type ReactNode, type Ref } from 'react';
import { useDOMImperativeHandle, type DOMImperativeFactory, type DOMProps } from 'expo/dom';
import './dom-shell.css';
import '../../../wrapped/src/index.css';
import './dom-fonts.css';
import WrappedAppRoot from '../../../wrapped/src/app-entry/WrappedAppRoot';
import { isAppRoute } from '../../../wrapped/src/app-entry/app-routes';
import { installNativeShell, onNativeMessage, setNativeShellInfo } from '../../../wrapped/src/lib/native-shell';
import { NATIVE_PROTOCOL, type NativeToWeb, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';
import { interceptLinks, polyfillShare, reportCrashes, setDocumentLanguage } from './domShell';

export type WrappedDomHandle = { receive: (message: NativeToWeb) => void };

interface Props {
  initialPath: string;
  platform: 'ios' | 'android';
  appVersion: string;
  onWebMessage: (message: WebToNative) => Promise<void>;
  ref: Ref<WrappedDomHandle>;
  dom?: DOMProps;
}

let post: (message: WebToNative) => void = () => {};
const send = (message: WebToNative) => post(message);

// Once per module load, not per render.
const shell = installNativeShell(send);
const waiting = new Map<number, (ok: boolean) => void>();
onNativeMessage('share.result', message => {
  waiting.get(message.id)?.(message.ok);
  waiting.delete(message.id);
});
setDocumentLanguage();
polyfillShare(send, id => new Promise<boolean>(resolve => { waiting.set(id, resolve); }));
interceptLinks(send, isAppRoute);
reportCrashes(send);

const fallbackStyle = { minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24, background: '#0e0a14', color: '#fff', font: '600 18px system-ui, sans-serif', textAlign: 'center' } as const;
const buttonStyle = { padding: '12px 24px', borderRadius: 999, border: 0, background: '#ff4fa0', color: '#0e0a14', font: '800 16px system-ui, sans-serif' } as const;

class CrashBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    send({ type: 'log', level: 'error', text: `render crash: ${String(error?.stack ?? error)}\n${String(info.componentStack ?? '')}`.slice(0, 2000) });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={fallbackStyle}>
        <p>Da ist etwas schiefgelaufen.</p>
        <button type="button" style={buttonStyle} onClick={() => location.reload()}>Neu laden</button>
      </div>
    );
  }
}

export default function WrappedDom({ initialPath, platform, appVersion, onWebMessage, ref }: Props) {
  // Constant for the life of the app, so set during render (before any child reads it).
  setNativeShellInfo({ protocol: NATIVE_PROTOCOL, platform, appVersion });
  post = m => { void onWebMessage(m).catch(() => {}); };
  // Boundary cast: Expo types handle methods as taking JSON values; the native caller is typed by WrappedDomHandle.
  useDOMImperativeHandle(ref as unknown as Ref<DOMImperativeFactory>, () => ({ receive: (message: NativeToWeb) => shell.receive(message) }) as unknown as DOMImperativeFactory, []);
  // Proves the bridge is alive, so native may deliver anything it held back (deep-link preview code).
  useEffect(() => { send({ type: 'ready' }); }, []);
  return (
    <CrashBoundary>
      <WrappedAppRoot initialPath={initialPath} />
    </CrashBoundary>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { dismissBootCover } from '@/cover/shell';
import { checkPreviewCode, normalizePreviewCode, setPreviewCode } from '@/lib/preview-code';

/**
 * In-app counterpart of /zugang/: the unpublished edition answered 401, so ask for
 * the preview code, check it against the server, keep it, and load again.
 */
export function PreviewCodeGate({ probePath, onUnlocked }: { probePath: string | null; onUnlocked: () => void }) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(dismissBootCover, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!normalizePreviewCode(value)) { setMessage('Bitte gib den Zugangscode ein.'); return; }
    setBusy(true);
    setMessage('');
    const result = probePath ? await checkPreviewCode(probePath, value) : 'ok';
    setBusy(false);
    if (result === 'wrong') { setMessage('Der Code stimmt nicht.'); return; }
    if (result === 'unreachable') { setMessage('Keine Verbindung. Bitte prüfe dein Internet und versuche es erneut.'); return; }
    if (!setPreviewCode(value)) { setMessage('Der Code konnte nicht gespeichert werden.'); return; }
    onUnlocked();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6" style={{ background: '#0e0a14', color: '#fff' }}>
      <form onSubmit={submit} noValidate className="w-full max-w-md flex flex-col gap-4 rounded-3xl p-6" style={{ background: '#1c1030' }}>
        <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ color: '#0e0a14' }}>Vorschau</span>
        <h1 className="text-4xl font-black uppercase leading-none">Wrapped <span style={{ color: '#ff4fa0' }}>2026</span></h1>
        <p style={{ color: '#e6def2' }}>Die neue Ausgabe ist noch nicht öffentlich. Mit dem Zugangscode kommst du schon jetzt rein.</p>
        <label htmlFor="preview-code" className="text-xs font-bold uppercase tracking-widest" style={{ color: '#cbbde3' }}>Zugangscode</label>
        <input
          id="preview-code" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} value={value}
          onChange={event => setValue(event.target.value)} aria-describedby="preview-code-message"
          className="min-h-14 rounded-full px-5 text-xl font-extrabold"
          style={{ background: '#0e0a14', color: '#fff', border: '2px solid #4a3a66' }}
        />
        <div id="preview-code-message" role="alert" className="min-h-6 font-extrabold" style={{ color: '#ff4fa0' }}>{message}</div>
        <button type="submit" disabled={busy} className="min-h-14 rounded-full px-7 text-lg font-black" style={{ background: '#ff4fa0', color: '#0e0a14' }}>
          Freischalten
        </button>
        <span className="text-sm" style={{ color: '#a99bc4' }}>Groß- und Kleinschreibung ist egal.</span>
      </form>
    </main>
  );
}

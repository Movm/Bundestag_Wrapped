import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface AccessibleDialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label?: string;
  labelledBy?: string;
  /** Keeps the dialog mounted this long after `open` turns false, so it can animate out (`data-closing`). */
  exitMs?: number;
}

/** Native modality also makes background content inert for assistive technology. */
export function AccessibleDialog({ open, onClose, children, label, labelledBy, exitMs = 0 }: AccessibleDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [exiting, setExiting] = useState(false);
  const leaving = useRef<(() => void) | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    // Reopened during the exit: finish the old close first so showModal() is valid.
    leaving.current?.();
    setExiting(false);
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      const finish = () => {
        leaving.current = null;
        delete dialog.dataset.closing;
        dialog.close();
        document.body.style.overflow = overflow;
        if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({ preventScroll: true });
        setExiting(false);
      };
      if (exitMs > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // The dialog stays modal (focus trap, Escape) until the exit has played.
        dialog.dataset.closing = 'true';
        setExiting(true);
        const timer = setTimeout(finish, exitMs);
        leaving.current = () => { clearTimeout(timer); finish(); };
      } else finish();
    };
  }, [open, exitMs]);

  return createPortal(
    <dialog
      ref={ref}
      className="accessible-dialog"
      aria-label={label}
      aria-labelledby={labelledBy}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]'))
          .filter(element => !element.closest('[inert]') && element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      {(open || exiting) && children}
    </dialog>,
    document.body,
  );
}

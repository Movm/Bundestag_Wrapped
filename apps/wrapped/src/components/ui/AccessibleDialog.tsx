import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface AccessibleDialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label?: string;
  labelledBy?: string;
}

/** Native modality also makes background content inert for assistive technology. */
export function AccessibleDialog({ open, onClose, children, label, labelledBy }: AccessibleDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({ preventScroll: true });
    };
  }, [open]);

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
      {open && children}
    </dialog>,
    document.body,
  );
}

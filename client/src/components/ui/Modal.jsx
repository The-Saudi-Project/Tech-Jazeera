/**
 * Modal — overlay dialog rendered in a portal (so ancestor overflow/z-index
 * can never clip it). Closes on backdrop click and Escape. Deliberately
 * minimal: for the ERP's confirm dialogs and small forms, a full focus-trap
 * library isn't warranted.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body
  );
}

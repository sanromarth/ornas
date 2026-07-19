/** Modal — overlay dialog. */
import React from 'react';

interface Props { open: boolean; onClose: () => void; children: React.ReactNode; }

export function Modal({ open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

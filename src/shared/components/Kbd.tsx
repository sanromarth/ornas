/** Kbd — keyboard shortcut display. */
import React from 'react';

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border px-1.5 py-0.5 text-xs font-mono">{children}</kbd>;
}

/** SearchWindowLayout — minimal layout for the global search popup. */
import React from 'react';

interface Props { children: React.ReactNode; }

export function SearchWindowLayout({ children }: Props) {
  return (
    <div data-testid="search-window" className="w-full max-w-2xl mx-auto">
      {children}
    </div>
  );
}

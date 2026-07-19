/** MainLayout — primary three-panel layout: sidebar + list + preview. */
import React from 'react';

interface Props { children: React.ReactNode; }

/** Main application layout shell. */
export function MainLayout({ children }: Props) {
  return (
    <div data-testid="main-layout" className="flex h-screen bg-background text-foreground">
      {children}
    </div>
  );
}

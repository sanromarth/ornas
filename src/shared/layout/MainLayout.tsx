import React from 'react';
import { ToastContainer } from '../components/Toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div data-testid="main-layout" className="flex flex-col h-screen w-screen bg-background text-text-primary overflow-hidden">
      {children}
      <ToastContainer />
    </div>
  );
}

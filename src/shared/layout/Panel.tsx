import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface PanelProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Panel({ children, className, elevated = false }: PanelProps) {
  return (
    <section 
      className={cn(
        "flex flex-col w-full h-full bg-background overflow-hidden",
        elevated && "bg-surface shadow-md border border-border rounded-lg",
        className
      )}
    >
      {children}
    </section>
  );
}

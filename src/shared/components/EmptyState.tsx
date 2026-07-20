import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center h-full gap-3", className)}>
      <Icon size={48} className="text-text-secondary opacity-50" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h3 className="text-[18px] font-semibold text-text-primary font-['Outfit'] tracking-[-0.01em]">{title}</h3>
        <p className="text-sm text-text-primary/70 max-w-sm font-['Inter']">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

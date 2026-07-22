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
    <div className={cn("flex flex-col items-center justify-center p-8 text-center h-full gap-4", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border shadow-sm">
        <Icon size={24} className="text-text-secondary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[16px] font-semibold text-text-primary tracking-tight">{title}</h3>
        <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

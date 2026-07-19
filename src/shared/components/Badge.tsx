/** Badge — small label for categories and tags. */
import React from 'react';
import { cn } from '../lib/cn';

interface Props { children: React.ReactNode; className?: string; }

export function Badge({ children, className }: Props) {
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs', className)}>{children}</span>;
}

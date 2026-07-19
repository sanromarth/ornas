/** Button — base button component with variants. */
import React from 'react';
import { cn } from '../lib/cn';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'default', size = 'md', className, children, ...props }: Props) {
  return (
    <button className={cn('inline-flex items-center justify-center rounded-md font-medium', className)} {...props}>
      {children}
    </button>
  );
}

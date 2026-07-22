import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';
import { cva } from 'class-variance-authority';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 text-text-secondary hover:bg-hover hover:text-text-primary',
  {
    variants: {
      active: {
        true: 'bg-selection text-primary',
        false: 'bg-transparent',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, active, ...props }, ref) => {
    return (
      <button
        type="button"
        className={cn(iconButtonVariants({ active }), 'h-8 w-8 min-w-[32px] min-h-[32px] p-2', className)}
        ref={ref}
        aria-pressed={active}
        {...props}
      />
    );
  }
);
IconButton.displayName = 'IconButton';

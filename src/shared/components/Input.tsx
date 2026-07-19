/** Input — base input component. */
import React from 'react';
import { cn } from '../lib/cn';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('w-full rounded-md border bg-transparent px-3 py-2', className)} {...props} />
));
Input.displayName = 'Input';

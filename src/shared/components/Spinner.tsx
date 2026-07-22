import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 14 }: SpinnerProps) {
  return (
    <Loader2 
      size={size} 
      className={cn('animate-spin [animation-duration:750ms]', className)} 
      aria-hidden="true" 
    />
  );
}

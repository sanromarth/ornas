import { cn } from '../lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      className={cn("w-6 h-6", className)} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path 
        fillRule="evenodd" 
      />
    </svg>
  );
}

import { cn } from '../lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="ORNAS"
      aria-hidden="true"
      className={cn("w-6 h-6", className)}
    />
  );
}

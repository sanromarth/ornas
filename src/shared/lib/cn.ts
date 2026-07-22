/** Class name utility — merges Tailwind classes without conflicts. */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combines class names and resolves Tailwind conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

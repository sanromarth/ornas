import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges tailwind classes correctly', () => {
      expect(cn('p-4', 'm-4')).toBe('p-4 m-4');
    });

    it('handles conditional classes', () => {
      const isFlex = true;
      const isHidden = false;
      expect(cn('p-4', isFlex && 'flex', isHidden && 'hidden')).toBe('p-4 flex');
    });

    it('resolves tailwind conflicts', () => {
      expect(cn('p-4 p-8')).toBe('p-8');
      expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
    });
  });
});

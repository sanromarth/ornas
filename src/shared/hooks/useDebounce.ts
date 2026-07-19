/** Debounce hook — delays a value update by the specified milliseconds. */

import { useState, useEffect } from 'react';

/** Returns a debounced version of the input value. */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

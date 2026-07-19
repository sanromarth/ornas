/** Theme hook — tracks and applies the current color theme. */

import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

/** Manages the application theme. Applies class to document root. */
export function useTheme(initialTheme: Theme = 'system') {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
  }, [theme]);

  return { theme, setTheme } as const;
}

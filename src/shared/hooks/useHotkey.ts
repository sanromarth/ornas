/** Keyboard hotkey hook — registers keyboard shortcuts within the app window. */

import { useEffect } from 'react';

/** Registers a keyboard shortcut handler. Cleans up on unmount. */
export function useHotkey(key: string, handler: () => void, modifier?: 'ctrl' | 'meta'): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const modMatch = modifier
        ? modifier === 'ctrl' ? e.ctrlKey : e.metaKey
        : true;

      if (e.key === key && modMatch) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, modifier]);
}

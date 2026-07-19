/** Tauri event listener hook — subscribes to backend events and cleans up on unmount. */

import { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

/** Subscribes to a Tauri event. Automatically unsubscribes on unmount. */
export function useTauriEvent<T>(event: string, handler: (payload: T) => void): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    listen<T>(event, (e) => handler(e.payload)).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [event, handler]);
}

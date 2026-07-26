/** Tauri event listener hook — subscribes to backend events and cleans up on unmount.
 *
 * Uses a ref to store the handler so it can be updated without re-subscribing
 * to the event listener. This prevents event loss during re-renders.
 */

import { useEffect, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

/** Subscribes to a Tauri event. Automatically unsubscribes on unmount. */
export function useTauriEvent<T>(event: string, handler: (payload: T) => void): void {
  // Use a ref so the handler can be updated without re-subscribing
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let mounted = true;

    listen<T>(event, (e) => {
      handlerRef.current(e.payload);
    }).then((fn) => {
      if (mounted) {
        unlisten = fn;
      } else {
        // Component unmounted before listen resolved
        fn();
      }
    });

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, [event]); // Only re-subscribe when event name changes
}

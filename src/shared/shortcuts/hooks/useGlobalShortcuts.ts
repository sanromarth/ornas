import { useEffect } from 'react';
import { shortcutRegistry } from '../registry';
import { actionRegistry } from '../../actions/registry';

/** Checks if an element is a text input where normal typing should not trigger single-key shortcuts. */
function isTextInput(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || el.hasAttribute('contenteditable')) {
    if (tag === 'input') {
      const type = (el as HTMLInputElement).type.toLowerCase();
      return ['text', 'search', 'password', 'email', 'url', 'number', 'tel'].includes(type);
    }
    return true;
  }
  return false;
}

/**
 * Global keyboard dispatcher.
 * Listens for keydown events on window, matches them against the shortcut registry,
 * and executes the corresponding action in the action registry.
 */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If another component already handled and prevented the event, respect it
      if (e.defaultPrevented) return;

      // Match event against registered shortcuts
      const actionId = shortcutRegistry.matchEvent(e);
      if (!actionId) return;

      // If typing in an input field, only allow shortcuts with modifier keys (Ctrl/Cmd/Alt) or Escape
      if (isTextInput(document.activeElement)) {
        const hasMod = e.ctrlKey || e.metaKey || e.altKey;
        const isEsc = e.key.toLowerCase() === 'escape';
        if (!hasMod && !isEsc) {
          return;
        }
      }

      // Execute the matched action if enabled
      if (actionRegistry.isEnabled(actionId)) {
        e.preventDefault();
        actionRegistry.execute(actionId).catch((err) => {
          console.error(`[GlobalShortcuts] Failed to execute action "${actionId}":`, err);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

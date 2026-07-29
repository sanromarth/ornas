import type { KeyCombo } from './types';

let _isMac: boolean | null = null;
export function isMac(): boolean {
  if (_isMac === null) {
    _isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  }
  return _isMac;
}

export function modLabel(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

export function altLabel(): string {
  return isMac() ? '⌥' : 'Alt';
}

export const DISPLAY_KEY_MAP: Record<string, string> = {
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  escape: 'Esc',
  delete: 'Del',
  backspace: 'Backspace',
  enter: 'Enter',
  space: 'Space',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  tab: 'Tab'
};

export function comboToParts(combo: KeyCombo): string[] {
  const parts: string[] = [];
  if (combo.mod) parts.push(modLabel());
  if (combo.alt) parts.push(altLabel());
  if (combo.shift) parts.push('Shift');
  
  const keyUpper = combo.key.toLowerCase();
  const display = DISPLAY_KEY_MAP[keyUpper] || (combo.key.length === 1 ? combo.key.toUpperCase() : keyUpper);
  parts.push(display);
  return parts;
}

export function formatCombo(combo: KeyCombo): string {
  return comboToParts(combo).join(isMac() ? '' : '+');
}

export function combosEqual(a: KeyCombo, b: KeyCombo): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    !!a.mod === !!b.mod &&
    !!a.shift === !!b.shift &&
    !!a.alt === !!b.alt
  );
}

export function eventToCombo(event: KeyboardEvent): KeyCombo | null {
  const key = event.key.toLowerCase();
  if (key === 'control' || key === 'meta' || key === 'shift' || key === 'alt') {
    return null; // modifier only
  }
  return {
    key: key === ' ' ? 'space' : key,
    mod: isMac() ? event.metaKey : event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey
  };
}

export function matchEvent(event: KeyboardEvent, combo: KeyCombo): boolean {
  const eventMod = isMac() ? event.metaKey : event.ctrlKey;
  const keyMatch = event.key.toLowerCase() === combo.key.toLowerCase() || 
                  (event.key === ' ' && combo.key.toLowerCase() === 'space');
                  
  return (
    keyMatch &&
    !!combo.mod === eventMod &&
    !!combo.shift === event.shiftKey &&
    !!combo.alt === event.altKey
  );
}

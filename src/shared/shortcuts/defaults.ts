import type { ShortcutBinding } from './types';

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  // ── General ──
  { actionId: 'general.settings',         primary: { key: ',', mod: true } },
  { actionId: 'general.command_palette',  primary: { key: 'p', mod: true, shift: true } },
  { actionId: 'general.cheat_sheet',      primary: { key: '/', mod: true } },
  { actionId: 'general.toggle_theme',     primary: { key: 't', mod: true, shift: true } },
  { actionId: 'general.toggle_sidebar',   primary: { key: 'b', mod: true } },

  // ── Navigation ──
  { actionId: 'nav.sidebar',  primary: { key: '1', alt: true }, locked: true },
  { actionId: 'nav.list',     primary: { key: '2', alt: true }, locked: true },
  { actionId: 'nav.preview',  primary: { key: '3', alt: true }, locked: true },
  { actionId: 'nav.search',   primary: { key: '4', alt: true }, locked: true },

  // ── Search ──
  { actionId: 'search.focus', primary: { key: 'k', mod: true }, secondary: { key: '/' } },
  { actionId: 'search.clear', primary: { key: 'escape' }, locked: true },

  // ── Clipboard ──
  { actionId: 'clip.copy',     primary: { key: ' ' },         locked: true },
  { actionId: 'clip.delete',   primary: { key: 'delete' },    secondary: { key: 'backspace' } },
  { actionId: 'clip.favorite', primary: { key: 'f' } },
  { actionId: 'clip.pin',      primary: { key: 'p' } },
  { actionId: 'clip.prev',     primary: { key: 'arrowup' },   locked: true },
  { actionId: 'clip.next',     primary: { key: 'arrowdown' }, locked: true },
  { actionId: 'clip.first',    primary: { key: 'home' },      locked: true },
  { actionId: 'clip.last',     primary: { key: 'end' },       locked: true },

  // ── Preview ──
  { actionId: 'preview.focus',       primary: { key: 'enter' }, locked: true },
  { actionId: 'preview.collections', primary: { key: 'c', mod: true, shift: true } },
  { actionId: 'preview.tags',        primary: { key: 'g', mod: true, shift: true } },

  // ── Filters ──
  { actionId: 'filter.all',       primary: { key: '1', mod: true } },
  { actionId: 'filter.favorites', primary: { key: '2', mod: true } },
  { actionId: 'filter.pinned',    primary: { key: '3', mod: true } },
  { actionId: 'filter.images',    primary: { key: '4', mod: true } },
  { actionId: 'filter.code',      primary: { key: '5', mod: true } },
  { actionId: 'filter.links',     primary: { key: '6', mod: true } },
  { actionId: 'filter.files',     primary: { key: '7', mod: true } },

  // ── System ──
  { actionId: 'system.export', primary: { key: 'e', mod: true, shift: true } },
  { actionId: 'system.import', primary: { key: 'i', mod: true, shift: true } },
];

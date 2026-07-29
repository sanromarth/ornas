import { ActionDefinition } from './types';

export const ACTION_DEFINITIONS: ActionDefinition[] = [
  // General
  { id: 'general.settings', label: 'Open Settings', category: 'general', iconName: 'settings' },
  { id: 'general.command_palette', label: 'Command Palette', category: 'general', iconName: 'command' },
  { id: 'general.cheat_sheet', label: 'Keyboard Shortcuts', category: 'general', iconName: 'keyboard' },
  { id: 'general.toggle_theme', label: 'Toggle Theme', category: 'general', iconName: 'sun-moon' },
  { id: 'general.toggle_sidebar', label: 'Toggle Sidebar', category: 'general', iconName: 'panel-left' },

  // Navigation
  { id: 'nav.sidebar', label: 'Focus Sidebar', category: 'navigation', iconName: 'panel-left' },
  { id: 'nav.list', label: 'Focus Clipboard List', category: 'navigation', iconName: 'list' },
  { id: 'nav.preview', label: 'Focus Preview', category: 'navigation', iconName: 'eye' },
  { id: 'nav.search', label: 'Focus Search', category: 'navigation', iconName: 'search' },

  // Search
  { id: 'search.focus', label: 'Focus Search', category: 'search', iconName: 'search' },
  { id: 'search.clear', label: 'Clear Search', category: 'search', iconName: 'x' },

  // Clipboard
  { id: 'clip.copy', label: 'Copy to Clipboard', category: 'clipboard', iconName: 'copy', requiresSelection: true, requiresListFocus: true },
  { id: 'clip.delete', label: 'Delete Item', category: 'clipboard', iconName: 'trash-2', requiresSelection: true },
  { id: 'clip.favorite', label: 'Toggle Favorite', category: 'clipboard', iconName: 'star', requiresSelection: true, requiresListFocus: true },
  { id: 'clip.pin', label: 'Toggle Pin', category: 'clipboard', iconName: 'pin', requiresSelection: true, requiresListFocus: true },
  { id: 'clip.prev', label: 'Previous Item', category: 'clipboard', iconName: 'chevron-up', requiresListFocus: true },
  { id: 'clip.next', label: 'Next Item', category: 'clipboard', iconName: 'chevron-down', requiresListFocus: true },
  { id: 'clip.first', label: 'First Item', category: 'clipboard', iconName: 'chevrons-up', requiresListFocus: true },
  { id: 'clip.last', label: 'Last Item', category: 'clipboard', iconName: 'chevrons-down', requiresListFocus: true },

  // Preview
  { id: 'preview.focus', label: 'Focus Preview', category: 'preview', iconName: 'eye' },
  { id: 'preview.collections', label: 'Assign Collections', category: 'preview', iconName: 'folder-plus', requiresSelection: true },
  { id: 'preview.tags', label: 'Manage Tags', category: 'preview', iconName: 'tag', requiresSelection: true },
  { id: 'preview.encrypt', label: 'Encrypt Item', category: 'preview', iconName: 'lock', requiresSelection: true },

  // Collections (Smart Filters)
  { id: 'filter.all', label: 'All Clips', category: 'collections', iconName: 'clipboard' },
  { id: 'filter.favorites', label: 'Favorites', category: 'collections', iconName: 'star' },
  { id: 'filter.pinned', label: 'Pinned', category: 'collections', iconName: 'pin' },
  { id: 'filter.images', label: 'Images', category: 'collections', iconName: 'image' },
  { id: 'filter.code', label: 'Code', category: 'collections', iconName: 'code' },
  { id: 'filter.links', label: 'Links', category: 'collections', iconName: 'link' },
  { id: 'filter.files', label: 'Files', category: 'collections', iconName: 'file' },

  // System
  { id: 'system.export', label: 'Export Backup', category: 'system', iconName: 'download' },
  { id: 'system.import', label: 'Import Backup', category: 'system', iconName: 'upload' },
  { id: 'system.vault_lock', label: 'Lock Vault', category: 'system', iconName: 'lock' },
  { id: 'system.vault_unlock', label: 'Unlock Vault', category: 'system', iconName: 'unlock' },
];

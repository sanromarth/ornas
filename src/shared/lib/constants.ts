/** Application constants — no magic numbers in the codebase. */

export const DEFAULTS = {
  SEARCH_DEBOUNCE_MS: 150,
  PREVIEW_LENGTH: 200,
  SEARCH_RESULT_LIMIT: 50,
  ITEMS_PER_PAGE: 50,
  VIRTUAL_LIST_OVERSCAN: 5,
} as const;

/** Tauri event names emitted by the Rust backend. */
export const TAURI_EVENTS = {
  CLIP_CREATED: 'clip-created',
  CLIP_DELETED: 'clip-deleted',
  CLIP_UPDATED: 'clip-updated',
  SETTINGS_CHANGED: 'settings-changed',
} as const;

/** Tauri IPC command names. */
export const COMMANDS = {
  LIST_CLIPS: 'list_clips',
  GET_CLIP: 'get_clip',
  DELETE_CLIP: 'delete_clip',
  TOGGLE_FAVORITE: 'toggle_favorite',
  TOGGLE_PIN: 'toggle_pin',
  SET_CLIP_LANGUAGE: 'set_clip_language',
  SEARCH_CLIPS: 'search_clips',
  GET_SETTINGS: 'get_settings',
  UPDATE_SETTING: 'update_setting',
} as const;

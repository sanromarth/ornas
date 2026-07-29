/** A keyboard combination. */
export interface KeyCombo {
  /** The primary key in lowercase: 'k', 'delete', 'space', 'arrowup', '1', '/', etc. */
  key: string;
  /** Platform-agnostic modifier: Ctrl on Windows/Linux, ⌘ on macOS. */
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
}

/** Maps an action ID to its keyboard binding(s). */
export interface ShortcutBinding {
  actionId: string;
  primary: KeyCombo;
  secondary?: KeyCombo;
  /** When true, this binding cannot be customized by the user. */
  locked?: boolean;
}

/** A user override for a single shortcut. */
export interface ShortcutOverride {
  actionId: string;
  primary?: KeyCombo;
  secondary?: KeyCombo | null;  // null = remove secondary
}

/** Conflict result when attempting to bind a combo. */
export interface ConflictResult {
  hasConflict: boolean;
  conflictingActionId?: string;
  conflictingLabel?: string;
}

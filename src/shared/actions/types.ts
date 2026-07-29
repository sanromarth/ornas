/** Categories for grouping actions in the command palette and settings. */
export type ActionCategory =
  | 'general'
  | 'navigation'
  | 'clipboard'
  | 'search'
  | 'preview'
  | 'collections'
  | 'editing'
  | 'developer'
  | 'system';

/**
 * Static metadata for an application action.
 *
 * Definitions are kept serializable — no React components, no callbacks.
 * Handlers are bound separately via the ActionRegistry.
 */
export interface ActionDefinition {
  /** Stable, dot-separated identifier: 'search.focus', 'clip.delete'. */
  id: string;
  /** Human-readable label shown in the command palette and settings. */
  label: string;
  /** Grouping category for UI organization. */
  category: ActionCategory;
  /** Optional description for search and cheat sheet. */
  description?: string;
  /** Lucide icon name string (resolved to a component at render time). */
  iconName?: string;
  /** When true, action only executes when a clip is selected. */
  requiresSelection?: boolean;
  /** When true, action only fires when clipboard list panel has focus. */
  requiresListFocus?: boolean;
}

/** Callback that executes an action's business logic. */
export type ActionHandler = () => void | Promise<void>;

/** Optional predicate that determines whether an action is currently executable. */
export type ActionEnabledCheck = () => boolean;

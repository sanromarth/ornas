/** UI state store — manages global UI state like selected clip, sidebar visibility, etc. */

import { create } from 'zustand';

/** Built-in smart filters for the sidebar. */
export type SmartFilter = 'all' | 'favorites' | 'pinned' | 'images' | 'code' | 'links' | 'files';

interface UIState {
  /** Currently selected clip ID. */
  selectedClipId: number | null;
  /** Set of selected clip IDs for bulk operations. */
  selectedClipIds: Set<number>;
  /** Whether the sidebar is visible. */
  sidebarOpen: boolean;
  /** Whether the command palette is open. */
  commandPaletteOpen: boolean;
  /** Whether the keyboard shortcut cheat sheet is open. */
  cheatSheetOpen: boolean;
  /** The current search query string. */
  searchQuery: string;
  /** Whether the settings panel is open. */
  settingsOpen: boolean;
  /** The active tab in the settings panel. */
  settingsCategory: string;
  /** Currently selected collection filter. */
  selectedCollectionId: number | null;
  /** Currently selected tag filter. */
  selectedTagId: number | null;
  /** Currently active smart filter. */
  smartFilter: SmartFilter;

  // Actions
  selectClip: (id: number | null) => void;
  setSelectedClipIds: (ids: Set<number>) => void;
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
  toggleCheatSheet: () => void;
  setSearchQuery: (query: string) => void;
  toggleSettings: () => void;
  openSettings: (category?: string) => void;
  setSettingsCategory: (category: string) => void;
  selectCollection: (id: number | null) => void;
  selectTag: (id: number | null) => void;
  selectSmartFilter: (filter: SmartFilter) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedClipId: null,
  selectedClipIds: new Set<number>(),
  sidebarOpen: true,
  commandPaletteOpen: false,
  cheatSheetOpen: false,
  searchQuery: '',
  settingsOpen: false,
  settingsCategory: 'appearance',
  selectedCollectionId: null,
  selectedTagId: null,
  smartFilter: 'all',

  selectClip: (id) => set(() => ({ 
    selectedClipId: id,
    // Whenever a primary selection is made without modifiers, reset multi-selection entirely
    selectedClipIds: new Set()
  })),
  setSelectedClipIds: (ids) => set({ selectedClipIds: ids }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  toggleCheatSheet: () => set((s) => ({ cheatSheetOpen: !s.cheatSheetOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  openSettings: (category = 'appearance') => set({ settingsOpen: true, settingsCategory: category }),
  setSettingsCategory: (category) => set({ settingsCategory: category }),
  selectCollection: (id) => set({ selectedCollectionId: id, selectedTagId: null, smartFilter: 'all', selectedClipIds: new Set(), selectedClipId: null }),
  selectTag: (id) => set({ selectedTagId: id, selectedCollectionId: null, smartFilter: 'all', selectedClipIds: new Set(), selectedClipId: null }),
  selectSmartFilter: (filter) => set({ smartFilter: filter, selectedCollectionId: null, selectedTagId: null, selectedClipIds: new Set(), selectedClipId: null }),
}));

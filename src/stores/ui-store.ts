/** UI state store — manages global UI state like selected clip, sidebar visibility, etc. */

import { create } from 'zustand';

interface UIState {
  /** Currently selected clip ID. */
  selectedClipId: number | null;
  /** Whether the sidebar is visible. */
  sidebarOpen: boolean;
  /** Whether the command palette is open. */
  commandPaletteOpen: boolean;
  /** The current search query string. */
  searchQuery: string;
  /** Whether the settings panel is open. */
  settingsOpen: boolean;
  /** Currently selected collection filter. */
  selectedCollectionId: number | null;
  /** Currently selected tag filter. */
  selectedTagId: number | null;

  // Actions
  selectClip: (id: number | null) => void;
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
  setSearchQuery: (query: string) => void;
  toggleSettings: () => void;
  selectCollection: (id: number | null) => void;
  selectTag: (id: number | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedClipId: null,
  sidebarOpen: true,
  commandPaletteOpen: false,
  searchQuery: '',
  settingsOpen: false,
  selectedCollectionId: null,
  selectedTagId: null,

  selectClip: (id) => set({ selectedClipId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  selectCollection: (id) => set({ selectedCollectionId: id }),
  selectTag: (id) => set({ selectedTagId: id }),
}));

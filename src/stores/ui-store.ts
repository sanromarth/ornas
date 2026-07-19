/** UI state store — manages global UI state like selected clip, sidebar visibility, etc. */

import { create } from 'zustand';

interface UIState {
  /** Currently selected clip ID. */
  selectedClipId: number | null;
  /** Whether the sidebar is visible. */
  sidebarOpen: boolean;
  /** Whether the command palette is open. */
  commandPaletteOpen: boolean;

  // Actions
  selectClip: (id: number | null) => void;
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedClipId: null,
  sidebarOpen: true,
  commandPaletteOpen: false,

  selectClip: (id) => set({ selectedClipId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));

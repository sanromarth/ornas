/** Navigation state store — manages keyboard navigation and focus. */

import { create } from 'zustand';

interface NavigationState {
  /** Index of the focused item in the current list. */
  focusedIndex: number;
  /** Active view filter. */
  activeFilter: 'all' | 'favorites' | 'pinned';

  // Actions
  setFocusedIndex: (index: number) => void;
  setActiveFilter: (filter: NavigationState['activeFilter']) => void;
  moveFocus: (delta: number) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  focusedIndex: 0,
  activeFilter: 'all',

  setFocusedIndex: (index) => set({ focusedIndex: index }),
  setActiveFilter: (filter) => set({ activeFilter: filter, focusedIndex: 0 }),
  moveFocus: (delta) => set((s) => ({ focusedIndex: Math.max(0, s.focusedIndex + delta) })),
}));

import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './ui-store';

describe('ui-store', () => {
  beforeEach(() => {
    // Reset store state
    const store = useUIStore.getState();
    store.selectClip(null);
    if (store.settingsOpen) {
      store.toggleSettings();
    }
    store.setSearchQuery('');
  });

  it('toggles settings panel', () => {
    const store = useUIStore.getState();
    expect(store.settingsOpen).toBe(false);
    
    store.toggleSettings();
    expect(useUIStore.getState().settingsOpen).toBe(true);
    
    store.toggleSettings();
    expect(useUIStore.getState().settingsOpen).toBe(false);
  });

  it('manages selected clip id', () => {
    const store = useUIStore.getState();
    expect(store.selectedClipId).toBe(null);
    
    store.selectClip(123);
    expect(useUIStore.getState().selectedClipId).toBe(123);
  });

  it('manages search query', () => {
    const store = useUIStore.getState();
    expect(store.searchQuery).toBe('');
    
    store.setSearchQuery('test');
    expect(useUIStore.getState().searchQuery).toBe('test');
  });
});

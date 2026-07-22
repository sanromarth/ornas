import { create } from 'zustand';
import { Collection, CollectionService, CollectionUpdate } from '../services/collection-service';
import { useToast } from '../shared/components/useToast';

interface CollectionState {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  
  loadCollections: () => Promise<void>;
  createCollection: (name: string, icon?: string | null, color?: string | null) => Promise<Collection | null>;
  updateCollection: (id: number, update: CollectionUpdate) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  isLoading: false,
  error: null,

  loadCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const collections = await CollectionService.listCollections();
      set({ collections, isLoading: false });
    } catch (err: any) {
      console.error('Failed to load collections:', err);
      set({ error: err.toString(), isLoading: false });
    }
  },

  createCollection: async (name, icon = null, color = null) => {
    try {
      const col = await CollectionService.createCollection(name, icon, color);
      set((state) => ({ collections: [col, ...state.collections] }));
      return col;
    } catch (err: any) {
      useToast.getState().addToast({ title: 'Failed to create collection', description: err.toString(), variant: 'error' });
      return null;
    }
  },

  updateCollection: async (id, update) => {
    try {
      const updated = await CollectionService.updateCollection(id, update);
      set((state) => ({
        collections: state.collections.map((c) => (c.id === id ? updated : c)),
      }));
    } catch (err: any) {
      useToast.getState().addToast({ title: 'Failed to update collection', description: err.toString(), variant: 'error' });
    }
  },

  deleteCollection: async (id) => {
    try {
      await CollectionService.deleteCollection(id);
      set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
      }));
    } catch (err: any) {
      useToast.getState().addToast({ title: 'Failed to delete collection', description: err.toString(), variant: 'error' });
    }
  },
}));

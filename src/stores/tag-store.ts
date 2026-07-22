import { create } from 'zustand';
import { Tag, TagService, TagUpdate } from '../services/tag-service';
import { useToast } from '../shared/components/useToast';

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  
  loadTags: () => Promise<void>;
  createTag: (name: string, color?: string | null) => Promise<Tag | null>;
  updateTag: (id: number, update: TagUpdate) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  isLoading: false,
  error: null,

  loadTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await TagService.listTags();
      set({ tags, isLoading: false });
    } catch (err: unknown) {
      console.error('Failed to load tags:', err);
      set({ error: (err instanceof Error ? err.message : String(err)), isLoading: false });
    }
  },

  createTag: async (name, color = null) => {
    try {
      const tag = await TagService.createTag(name, color);
      set((state) => ({ tags: [...state.tags, tag].sort((a, b) => a.name.localeCompare(b.name)) }));
      return tag;
    } catch (err: unknown) {
      useToast.getState().addToast({ title: 'Failed to create tag', description: (err instanceof Error ? err.message : String(err)), variant: 'error' });
      return null;
    }
  },

  updateTag: async (id, update) => {
    try {
      const updated = await TagService.updateTag(id, update);
      set((state) => ({
        tags: state.tags.map((t) => (t.id === id ? updated : t)).sort((a, b) => a.name.localeCompare(b.name)),
      }));
    } catch (err: unknown) {
      useToast.getState().addToast({ title: 'Failed to update tag', description: (err instanceof Error ? err.message : String(err)), variant: 'error' });
    }
  },

  deleteTag: async (id) => {
    try {
      await TagService.deleteTag(id);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
      }));
    } catch (err: unknown) {
      useToast.getState().addToast({ title: 'Failed to delete tag', description: (err instanceof Error ? err.message : String(err)), variant: 'error' });
    }
  },
}));

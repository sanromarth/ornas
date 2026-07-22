import { invoke } from '@tauri-apps/api/core';

export interface Collection {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: number;
}

export interface CollectionUpdate {
  name?: string;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
}

export const CollectionService = {
  async createCollection(name: string, icon: string | null = null, color: string | null = null): Promise<Collection> {
    return invoke<Collection>('create_collection', { name, icon, color });
  },

  async listCollections(): Promise<Collection[]> {
    return invoke<Collection[]>('list_collections');
  },

  async updateCollection(id: number, update: CollectionUpdate): Promise<Collection> {
    return invoke<Collection>('update_collection', { id, update });
  },

  async deleteCollection(id: number): Promise<void> {
    return invoke<void>('delete_collection', { id });
  },

  async assignClipToCollection(clipId: number, collectionId: number): Promise<void> {
    return invoke<void>('assign_clip_to_collection', { clipId, collectionId });
  },

  async removeClipFromCollection(clipId: number, collectionId: number): Promise<void> {
    return invoke<void>('remove_clip_from_collection', { clipId, collectionId });
  },

  async getCollectionsForClip(clipId: number): Promise<Collection[]> {
    return invoke<Collection[]>('get_collections_for_clip', { clipId });
  }
};

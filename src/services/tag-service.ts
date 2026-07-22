import { invoke } from '@tauri-apps/api/core';

export interface Tag {
  id: number;
  name: string;
  color: string | null;
}

export interface TagUpdate {
  name?: string;
  color?: string | null;
}

export const TagService = {
  async createTag(name: string, color: string | null = null): Promise<Tag> {
    return invoke<Tag>('create_tag', { name, color });
  },

  async listTags(): Promise<Tag[]> {
    return invoke<Tag[]>('list_tags');
  },

  async updateTag(id: number, update: TagUpdate): Promise<Tag> {
    return invoke<Tag>('update_tag', { id, update });
  },

  async deleteTag(id: number): Promise<void> {
    return invoke<void>('delete_tag', { id });
  },

  async assignClipToTag(clipId: number, tagId: number): Promise<void> {
    return invoke<void>('assign_clip_to_tag', { clipId, tagId });
  },

  async removeClipFromTag(clipId: number, tagId: number): Promise<void> {
    return invoke<void>('remove_clip_from_tag', { clipId, tagId });
  },

  async getTagsForClip(clipId: number): Promise<Tag[]> {
    return invoke<Tag[]>('get_tags_for_clip', { clipId });
  }
};

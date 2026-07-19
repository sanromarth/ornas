/** Clipboard IPC service — wraps Tauri commands for clip operations. */

import { tauriInvoke } from './invoke';
import { COMMANDS } from '../shared/lib/constants';
import type { Clip, ListParams } from '../shared/types';

export async function listClips(params?: ListParams): Promise<Clip[]> {
  return tauriInvoke<Clip[]>(COMMANDS.LIST_CLIPS, params ? { ...params } : undefined);
}

export async function getClip(id: number): Promise<Clip | null> {
  return tauriInvoke<Clip | null>(COMMANDS.GET_CLIP, { id });
}

export async function deleteClip(id: number): Promise<void> {
  return tauriInvoke<void>(COMMANDS.DELETE_CLIP, { id });
}

export async function toggleFavorite(id: number): Promise<void> {
  return tauriInvoke<void>(COMMANDS.TOGGLE_FAVORITE, { id });
}

export async function togglePin(id: number): Promise<void> {
  return tauriInvoke<void>(COMMANDS.TOGGLE_PIN, { id });
}

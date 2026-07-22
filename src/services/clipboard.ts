/** Clipboard IPC service — wraps Tauri commands for clip operations. */

import { tauriInvoke } from './invoke';
import { COMMANDS } from '../shared/lib/constants';
import type { ClipDto, ListParams } from '../shared/types';

export async function listClips(params?: ListParams): Promise<ClipDto[]> {
  return tauriInvoke<ClipDto[]>(COMMANDS.LIST_CLIPS, params ? { ...params } : undefined);
}

export async function getClip(id: number): Promise<ClipDto | null> {
  return tauriInvoke<ClipDto | null>(COMMANDS.GET_CLIP, { id });
}

export async function deleteClip(id: number): Promise<void> {
  return tauriInvoke<void>(COMMANDS.DELETE_CLIP, { id });
}

export async function toggleFavorite(id: number): Promise<ClipDto> {
  return tauriInvoke<ClipDto>(COMMANDS.TOGGLE_FAVORITE, { id });
}

export async function togglePin(id: number): Promise<ClipDto> {
  return tauriInvoke<ClipDto>(COMMANDS.TOGGLE_PIN, { id });
}

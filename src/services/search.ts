/** Search IPC service — wraps Tauri commands for search operations. */

import { tauriInvoke } from './invoke';
import { COMMANDS } from '../shared/lib/constants';
import type { ClipDto } from '../shared/types';

export async function searchClips(query: string, limit?: number): Promise<ClipDto[]> {
  return tauriInvoke<ClipDto[]>(COMMANDS.SEARCH_CLIPS, { query, limit });
}

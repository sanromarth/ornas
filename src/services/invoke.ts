/** Type-safe Tauri IPC invoke wrapper. */

import { invoke } from '@tauri-apps/api/core';

/** Invokes a Tauri command with type safety. */
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(command, args);
}

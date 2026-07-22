/** Type-safe Tauri IPC invoke wrapper. */

import { invoke } from '@tauri-apps/api/core';

/** Invokes a Tauri command with type safety and standard error handling. */
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`[Tauri Invoke Error] ${command}:`, error);
    if (typeof error === 'string') {
      throw new Error(error);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}

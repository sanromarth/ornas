/** Settings IPC service — wraps Tauri commands for settings operations. */

import { tauriInvoke } from './invoke';
import { COMMANDS } from '../shared/lib/constants';
import type { Settings } from '../shared/types';

export async function getSettings(): Promise<Settings> {
  return tauriInvoke<Settings>(COMMANDS.GET_SETTINGS);
}

export async function updateSetting(key: string, value: string): Promise<void> {
  return tauriInvoke<void>(COMMANDS.UPDATE_SETTING, { key, value });
}

/** Settings IPC service — wraps Tauri commands for settings operations. */

import { tauriInvoke } from './invoke';
import { COMMANDS } from '../shared/lib/constants';
import type { SettingsDto } from '../shared/types';

export async function getSettings(): Promise<SettingsDto> {
  return tauriInvoke<SettingsDto>(COMMANDS.GET_SETTINGS);
}

export async function updateSetting(key: string, value: string): Promise<void> {
  return tauriInvoke<void>(COMMANDS.UPDATE_SETTING, { key, value });
}

import { invoke } from '@tauri-apps/api/core';
import type { PlatformInfo, DiagnosticsInfo } from '../shared/types';

export async function getPlatformInfo(): Promise<PlatformInfo> {
  return await invoke('get_platform_info');
}

export async function getDiagnosticsInfo(): Promise<DiagnosticsInfo> {
  return await invoke('get_diagnostics_info');
}

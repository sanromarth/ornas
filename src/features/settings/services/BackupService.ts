import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { save, open } from '@tauri-apps/plugin-dialog';

export type ImportMode = 'merge' | 'replace_all';

export interface BackupProgress {
  status: string;
  progress: number;
}

export class BackupService {
  /**
   * Triggers the native save dialog and exports the backup to the selected ZIP file.
   * @param onProgress Callback to receive progress updates from the Rust backend.
   */
  static async exportBackup(onProgress?: (progress: BackupProgress) => void): Promise<void> {
    const filePath = await save({
      filters: [{ name: 'ORNAS Backup', extensions: ['zip'] }],
      defaultPath: 'ornas_backup.zip',
    });

    if (!filePath) {
      // User cancelled the dialog
      return;
    }

    let unlisten: UnlistenFn | null = null;
    if (onProgress) {
      unlisten = await listen<BackupProgress>('backup-progress', (event) => {
        onProgress(event.payload);
      });
    }

    try {
      await invoke('export_backup', { path: filePath });
    } finally {
      if (unlisten) {
        unlisten();
      }
    }
  }

  /**
   * Triggers the native open dialog and imports the selected ZIP backup.
   * @param mode 'merge' (default) or 'replace_all'
   * @param onProgress Callback to receive progress updates from the Rust backend.
   */
  static async importBackup(
    mode: ImportMode = 'merge',
    onProgress?: (progress: BackupProgress) => void
  ): Promise<void> {
    const filePath = await open({
      filters: [{ name: 'ORNAS Backup', extensions: ['zip'] }],
      multiple: false,
    });

    if (!filePath || Array.isArray(filePath)) {
      // User cancelled the dialog
      return;
    }

    let unlisten: UnlistenFn | null = null;
    if (onProgress) {
      unlisten = await listen<BackupProgress>('backup-progress', (event) => {
        onProgress(event.payload);
      });
    }

    try {
      await invoke('import_backup', { path: filePath, mode });
    } finally {
      if (unlisten) {
        unlisten();
      }
    }
  }
}

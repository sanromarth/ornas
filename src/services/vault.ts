import { invoke } from '@tauri-apps/api/core';
import { VaultStatus, DecryptedPayloadResponse } from '../shared/types';

export const VaultService = {
  setupVault: async (password: string): Promise<void> => {
    return invoke('setup_vault', { password });
  },

  unlockVault: async (password: string): Promise<void> => {
    return invoke('unlock_vault', { password });
  },

  lockVault: async (): Promise<void> => {
    return invoke('lock_vault');
  },

  getVaultStatus: async (): Promise<VaultStatus> => {
    return invoke('get_vault_status');
  },

  encryptClip: async (clipId: number): Promise<void> => {
    return invoke('encrypt_clip', { clipId });
  },

  decryptClip: async (clipId: number): Promise<void> => {
    return invoke('decrypt_clip', { clipId });
  },

  getDecryptedClip: async (clipId: number): Promise<DecryptedPayloadResponse> => {
    return invoke('get_decrypted_clip', { clipId });
  }
};

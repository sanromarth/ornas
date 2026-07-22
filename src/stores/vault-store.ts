import { create } from 'zustand';
import { VaultService } from '../services/vault';

interface VaultState {
  isInitialized: boolean;
  isUnlocked: boolean;
  isChecking: boolean;
  error: string | null;

  checkStatus: () => Promise<void>;
  setupVault: (password: string) => Promise<void>;
  unlockVault: (password: string) => Promise<void>;
  lockVault: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set) => ({
  isInitialized: false,
  isUnlocked: false,
  isChecking: true,
  error: null,

  checkStatus: async () => {
    set({ isChecking: true, error: null });
    try {
      const status = await VaultService.getVaultStatus();
      set({ 
        isInitialized: status.is_initialized, 
        isUnlocked: status.is_unlocked,
        isChecking: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to check vault status', isChecking: false });
    }
  },

  setupVault: async (password: string) => {
    set({ error: null });
    try {
      await VaultService.setupVault(password);
      set({ isInitialized: true, isUnlocked: true });
    } catch (error: any) {
      set({ error: error.message || 'Failed to setup vault' });
      throw error;
    }
  },

  unlockVault: async (password: string) => {
    set({ error: null });
    try {
      await VaultService.unlockVault(password);
      set({ isUnlocked: true });
    } catch (error: any) {
      set({ error: error.message || 'Failed to unlock vault' });
      throw error;
    }
  },

  lockVault: async () => {
    set({ error: null });
    try {
      await VaultService.lockVault();
      set({ isUnlocked: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to lock vault' });
      throw error;
    }
  }
}));

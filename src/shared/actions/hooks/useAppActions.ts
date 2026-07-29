import { useEffect } from 'react';
import { actionRegistry } from '../registry';
import { ACTION_DEFINITIONS } from '../definitions';
import { useUIStore } from '../../../stores/ui-store';
import { useVaultStore } from '../../../stores/vault-store';
import { BackupService } from '../../../features/settings/services/BackupService';
import { invoke } from '@tauri-apps/api/core';

/**
 * Hook that registers all global, navigation, search, filter, and system actions
 * in the action registry when the application mounts.
 */
export function useAppActions(): void {
  useEffect(() => {
    const defsMap = new Map(ACTION_DEFINITIONS.map((d) => [d.id, d]));
    const register = (id: string, handler: () => void | Promise<void>, enabled?: () => boolean) => {
      const def = defsMap.get(id);
      if (def) {
        actionRegistry.register(def, handler, enabled);
      }
    };

    // ── General ──
    register('general.settings', () => useUIStore.getState().toggleSettings());
    register('general.command_palette', () => useUIStore.getState().toggleCommandPalette());
    register('general.cheat_sheet', () => useUIStore.getState().toggleCheatSheet());
    register('general.toggle_sidebar', () => useUIStore.getState().toggleSidebar());
    register('general.toggle_theme', async () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      await invoke('update_setting', { key: 'theme', value: next }).catch(console.error);
    });

    // ── Navigation ──
    register('nav.sidebar', () => {
      const state = useUIStore.getState();
      if (!state.sidebarOpen) state.toggleSidebar();
      setTimeout(() => {
        const el = (document.querySelector('[data-panel="sidebar"] button, [data-panel="sidebar"]') || document.querySelector('.ornas-sidebar-panel button')) as HTMLElement;
        el?.focus();
      }, 50);
    });
    register('nav.list', () => {
      const el = (document.querySelector('[data-testid="clipboard-list"]') || document.querySelector('[data-panel="list"]')) as HTMLElement;
      el?.focus();
    });
    register('nav.preview', () => {
      const el = (document.querySelector('[data-testid="clipboard-preview"]') || document.querySelector('[data-panel="preview"]')) as HTMLElement;
      el?.focus();
    });
    register('nav.search', () => {
      const el = document.querySelector('[data-testid="search-bar"]') as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    });

    // ── Search ──
    register('search.focus', () => {
      const el = document.querySelector('[data-testid="search-bar"]') as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    });
    register('search.clear', () => {
      const state = useUIStore.getState();
      if (state.searchQuery) {
        state.setSearchQuery('');
      } else if (document.activeElement?.getAttribute('data-testid') === 'search-bar') {
        (document.activeElement as HTMLElement).blur();
        const listEl = document.querySelector('[data-testid="clipboard-list"]') as HTMLElement;
        listEl?.focus();
      }
    });

    // ── Smart Filters ──
    const filters = ['all', 'favorites', 'pinned', 'images', 'code', 'links', 'files'] as const;
    filters.forEach((filter) => {
      register(`filter.${filter}`, () => useUIStore.getState().selectSmartFilter(filter));
    });

    // ── System / Vault ──
    register('system.export', async () => {
      await BackupService.exportBackup().catch(console.error);
    });
    register('system.import', async () => {
      await BackupService.importBackup().catch(console.error);
    });
    register(
      'system.vault_lock',
      async () => {
        await invoke('lock_vault').catch(console.error);
        useVaultStore.getState().checkStatus();
      },
      () => useVaultStore.getState().isUnlocked
    );
    register(
      'system.vault_unlock',
      () => {
        useUIStore.setState({ settingsOpen: true });
      },
      () => !useVaultStore.getState().isUnlocked
    );

    return () => {
      ACTION_DEFINITIONS.forEach((def) => {
        if (
          def.category === 'general' ||
          def.category === 'navigation' ||
          def.category === 'search' ||
          def.category === 'collections' ||
          def.category === 'system'
        ) {
          actionRegistry.unregister(def.id);
        }
      });
    };
  }, []);
}

import { useSyncExternalStore, useCallback } from 'react';
import { shortcutRegistry } from '../registry';
import { saveShortcutOverrides } from '../persistence';
import type { KeyCombo, ShortcutOverride } from '../types';

export function useShortcutRegistry() {
  const bindings = useSyncExternalStore(
    shortcutRegistry.subscribe.bind(shortcutRegistry),
    shortcutRegistry.getAllBindings.bind(shortcutRegistry)
  );
  const overrides = shortcutRegistry.exportOverrides();

  const getBinding = useCallback((actionId: string) => {
    return shortcutRegistry.getBinding(actionId);
  }, []);

  const checkConflict = useCallback((actionId: string, combo: KeyCombo) => {
    return shortcutRegistry.checkConflict(actionId, combo);
  }, []);

  const setCustomBinding = useCallback((override: ShortcutOverride) => {
    const res = shortcutRegistry.setCustomBinding(override);
    if (!res.hasConflict) {
      saveShortcutOverrides().catch(console.error);
    }
    return res;
  }, []);

  const forceSetBinding = useCallback((override: ShortcutOverride) => {
    shortcutRegistry.forceSetBinding(override);
    saveShortcutOverrides().catch(console.error);
  }, []);

  const resetBinding = useCallback((actionId: string) => {
    shortcutRegistry.resetBinding(actionId);
    saveShortcutOverrides().catch(console.error);
  }, []);

  const resetAll = useCallback(() => {
    shortcutRegistry.reset();
    saveShortcutOverrides().catch(console.error);
  }, []);

  const exportOverrides = useCallback(() => {
    return shortcutRegistry.exportOverrides();
  }, []);

  const importOverrides = useCallback((overrides: ShortcutOverride[]) => {
    shortcutRegistry.importOverrides(overrides);
    saveShortcutOverrides().catch(console.error);
  }, []);

  return {
    bindings,
    overrides,
    getBinding,
    checkConflict,
    setCustomBinding,
    forceSetBinding,
    resetBinding,
    resetAll,
    exportOverrides,
    importOverrides
  };
}

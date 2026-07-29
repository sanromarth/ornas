import { useSyncExternalStore, useCallback } from 'react';
import { actionRegistry } from '../registry';
import type { ActionCategory } from '../types';

export function useActionRegistry() {
  const actions = useSyncExternalStore(
    actionRegistry.subscribe.bind(actionRegistry),
    actionRegistry.getSnapshot.bind(actionRegistry),
  );

  const execute = useCallback((id: string) => actionRegistry.execute(id), []);
  const isEnabled = useCallback((id: string) => actionRegistry.isEnabled(id), []);
  const search = useCallback((query: string) => actionRegistry.search(query), []);
  const getActionsByCategory = useCallback(
    (category: ActionCategory) => actionRegistry.getActionsByCategory(category),
    [],
  );

  return { actions, execute, isEnabled, search, getActionsByCategory };
}

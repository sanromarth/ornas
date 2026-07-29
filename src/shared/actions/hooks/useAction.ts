import { useCallback } from 'react';
import { actionRegistry } from '../registry';

export function useAction(actionId: string): () => void {
  return useCallback(() => {
    actionRegistry.execute(actionId);
  }, [actionId]);
}

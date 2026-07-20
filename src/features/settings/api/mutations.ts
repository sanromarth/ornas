import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSetting } from '../../../services/settings';
import { settingsKeys } from '../../../shared/lib/queryKeys';

/** Updates a setting and invalidates the settings cache. */
export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateSetting(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}

/** Hook to access settings operations and data. */
import { useSettingsQuery } from '../api/queries';
import { useUpdateSetting } from '../api/mutations';

export function useSettings() {
  const { data: settings = {}, isLoading, error } = useSettingsQuery();
  const updateMutation = useUpdateSetting();

  return {
    settings,
    isLoading,
    error,
    updateSetting: updateMutation.mutateAsync,
  } as const;
}

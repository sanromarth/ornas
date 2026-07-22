import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../../../services/settings';
import { settingsKeys } from '../../../shared/lib/queryKeys';

/** Fetches all settings. */
export function useSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: getSettings,
  });
}

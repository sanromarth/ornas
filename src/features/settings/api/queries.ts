import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../../../services/settings';
import { getPlatformInfo, getDiagnosticsInfo } from '../../../services/system';
import { settingsKeys, systemKeys } from '../../../shared/lib/queryKeys';

/** Fetches all settings. */
export function useSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: getSettings,
  });
}

/** Fetches platform info. */
export function usePlatformQuery() {
  return useQuery({
    queryKey: systemKeys.platform,
    queryFn: getPlatformInfo,
  });
}

/** Fetches diagnostics info. */
export function useDiagnosticsQuery() {
  return useQuery({
    queryKey: systemKeys.diagnostics,
    queryFn: getDiagnosticsInfo,
  });
}

/** TanStack Query queries for clipboard data fetching. */

import { useQuery } from '@tanstack/react-query';
import { listClips, getClip } from '../../../services/clipboard';
import { clipboardKeys } from './keys';
import type { ListParams } from '../../../shared/types';

/** Fetches paginated clipboard items. */
export function useClipsQuery(params?: ListParams) {
  return useQuery({
    queryKey: clipboardKeys.list(params ?? {}),
    queryFn: () => listClips(params),
  });
}

/** Fetches a single clip by ID. */
export function useClipQuery(id: number | null) {
  return useQuery({
    queryKey: clipboardKeys.detail(id!),
    queryFn: () => getClip(id!),
    enabled: id !== null,
  });
}

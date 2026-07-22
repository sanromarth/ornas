import { useQuery } from '@tanstack/react-query';
import { searchClips } from '../../../services/search';
import { clipboardKeys } from '../../../shared/lib/queryKeys';

import type { ListParams } from '../../../shared/types';

/** Fetches search results. */
export function useSearchQuery(query: string, params?: ListParams) {
  return useQuery({
    queryKey: clipboardKeys.search(query, params?.limit),
    queryFn: () => searchClips(query, params),
    enabled: query.length > 0,
  });
}

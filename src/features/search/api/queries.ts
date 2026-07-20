import { useQuery } from '@tanstack/react-query';
import { searchClips } from '../../../services/search';
import { clipboardKeys } from '../../../shared/lib/queryKeys';

/** Fetches search results. */
export function useSearchQuery(query: string, limit?: number) {
  return useQuery({
    queryKey: clipboardKeys.search(query, limit),
    queryFn: () => searchClips(query, limit),
    enabled: query.length > 0,
  });
}

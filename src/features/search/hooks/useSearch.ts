/** Hook to access search operations and state. */
import { useCallback } from 'react';
import { useSearchQuery } from '../api/queries';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { DEFAULTS } from '../../../shared/lib/constants';
import { useUIStore } from '../../../stores/ui-store';
import type { ListParams } from '../../../shared/types';

export function useSearch(params?: ListParams) {
  const query = useUIStore((state) => state.searchQuery);
  const setQuery = useUIStore((state) => state.setSearchQuery);
  
  const debouncedQuery = useDebounce(query, DEFAULTS.SEARCH_DEBOUNCE_MS);
  
  const { data: results = [], isLoading, error } = useSearchQuery(debouncedQuery, params);
  
  const clearSearch = useCallback(() => setQuery(''), [setQuery]);
  
  return { 
    query, 
    debouncedQuery, 
    setQuery, 
    clearSearch,
    results,
    isLoading,
    error,
  } as const;
}

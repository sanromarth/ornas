/** useSearch hook — manages search query state with debouncing. */
import { useState, useCallback } from 'react';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { DEFAULTS } from '../../../shared/lib/constants';

export function useSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEFAULTS.SEARCH_DEBOUNCE_MS);
  const clearSearch = useCallback(() => setQuery(''), []);
  return { query, debouncedQuery, setQuery, clearSearch } as const;
}

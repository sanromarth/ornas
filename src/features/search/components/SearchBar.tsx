import { useRef, useCallback, memo } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { IconButton } from '../../../shared/components/IconButton';
import { cn } from '../../../shared/lib/utils';

/**
 * SearchBar — The visual anchor of the center panel.
 *
 * Keyboard workflow (from SEARCH_EXPERIENCE.md):
 *   Ctrl+K or /     → Focus search
 *   Escape          → Clear query (if present), else blur to list
 *   Down Arrow      → Transfer focus to clipboard list
 *   Any typing      → Instant filtering via useSearch (150ms debounce to backend)
 *
 * Design Principles:
 *   Keyboard First: Three shortcuts to reach search. Down Arrow to leave.
 *   Content First:  Search is subordinate to results — it filters, not dominates.
 *   Performance First: Zero unnecessary rerenders. Debounce preserved at 150ms.
 */
export const SearchBar = memo(function SearchBar() {
  const { query, setQuery, clearSearch, isLoading, results } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  const focusList = useCallback(() => {
    const list = document.querySelector('[data-testid="clipboard-list"]') as HTMLElement;
    list?.focus();
  }, []);

  // Down Arrow while in search → transfer focus to the list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusList();
    }
  };

  return (
    <div
      className={cn(
        "ornas-search-bar",
        "relative flex-none flex items-center w-full border-b border-border shrink-0",
        "h-11 bg-surface",
        "transition-colors duration-100 ease-out",
      )}
    >
      {/* Search icon */}
      <Search
        size={16}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 pointer-events-none z-[1]",
          "text-text-tertiary transition-colors duration-100",
          query && "text-text-secondary",
        )}
        style={{ left: '1.25rem' }}
        aria-hidden="true"
      />

      {/* Input */}
      <input
        ref={inputRef}
        data-testid="search-bar"
        type="text"
        placeholder="Search clips…"
        aria-label="Search clipboard history"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleInputKeyDown}
        className={cn(
          "w-full h-full text-base pr-24 border-none bg-transparent font-medium tracking-tight",
          "text-text-primary placeholder:text-text-tertiary",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus-ring/40",
          "transition-colors duration-100 ease-out",
        )}
        style={{ paddingLeft: '3rem' }}
      />

      {/* Right side: shortcut hints or clear button */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {!query && (
          <div className="pointer-events-none flex items-center gap-0.5">
            <kbd className="inline-flex items-center justify-center min-w-[20px] px-1 py-0.5 text-[10px] font-medium text-text-tertiary bg-app border border-border rounded">
              /
            </kbd>
          </div>
        )}
        {query && (
          <>
            {/* Result count indicator during loading */}
            {isLoading && (
              <span className="text-[10px] text-text-tertiary pointer-events-none mr-1">
                …
              </span>
            )}
            {/* Escape badge */}
            <kbd className="pointer-events-none inline-flex items-center justify-center px-1 py-0.5 text-[10px] font-medium text-text-tertiary bg-app border border-border rounded">
              Esc
            </kbd>
            {/* Clear button */}
            <IconButton
              className="text-text-tertiary hover:text-text-primary h-6 w-6 min-w-[24px] min-h-[24px]"
              onClick={() => {
                clearSearch();
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </IconButton>
          </>
        )}
      </div>

      {/* Screen reader live region for search results */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {query ? (isLoading ? 'Searching…' : `Found ${results.length} item${results.length === 1 ? '' : 's'}`) : ''}
      </div>
    </div>
  );
});

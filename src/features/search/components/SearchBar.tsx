import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { IconButton } from '../../../shared/components/IconButton';
import { cn } from '../../../shared/lib/utils';

export function SearchBar() {
  const { query, setQuery, clearSearch, isLoading } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (document.activeElement === inputRef.current) {
          e.preventDefault();
          if (query) {
            clearSearch();
          } else {
            inputRef.current?.blur();
            const list = document.querySelector('[data-testid="clipboard-list"]') as HTMLElement;
            if (list) {
              list.focus();
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch, query]);

  return (
    <div className="relative flex-none flex items-center w-full border-b border-border bg-surface shrink-0 h-12">
      <Search 
        size={18} 
        className={cn(
          "absolute left-[18px] top-1/2 -translate-y-1/2 text-text-secondary z-10 transition-opacity duration-200 pointer-events-none",
          isLoading ? "opacity-50" : "opacity-100"
        )} 
      />
      <input
        ref={inputRef}
        data-testid="search-bar"
        type="text"
        placeholder="Search clipboard…"
        aria-label="Search clipboard"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-full text-base pl-10 pr-12 border-none bg-transparent hover:bg-hover focus-visible:bg-background focus-visible:outline-none transition-colors duration-100 ease-out text-text-primary placeholder:text-text-secondary"
      />
      {query && (
        <IconButton
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary z-10 transition-all duration-100 ease-out starting:opacity-0 starting:scale-90"
          onClick={() => {
            clearSearch();
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <X size={20} />
        </IconButton>
      )}
    </div>
  );
}

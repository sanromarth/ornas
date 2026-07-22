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
          "absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary z-10 transition-opacity duration-200 pointer-events-none",
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
        className="w-full h-full text-[15px] pl-11 pr-16 border-none bg-transparent hover:bg-hover focus-visible:bg-background focus-visible:outline-none transition-colors duration-100 ease-out text-text-primary placeholder:text-text-secondary font-medium"
      />
      {!query && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-medium font-sans uppercase text-text-tertiary bg-background border border-border rounded-md shadow-sm">Ctrl</kbd>
          <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-medium font-sans uppercase text-text-tertiary bg-background border border-border rounded-md shadow-sm">K</kbd>
        </div>
      )}
      {query && (
        <IconButton
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary z-10 transition-all duration-100 ease-out starting:opacity-0 starting:scale-90"
          onClick={() => {
            clearSearch();
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <X size={16} />
        </IconButton>
      )}
    </div>
  );
}

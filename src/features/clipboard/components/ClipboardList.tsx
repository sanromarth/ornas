import { useRef, useEffect } from 'react';
import { useClipboard } from '../hooks/useClipboard';
import { useSearch } from '../../search/hooks/useSearch';
import { useUIStore } from '../../../stores/ui-store';
import { ClipboardItem } from './ClipboardItem';
import { EmptyState } from './EmptyState';
import { useToast } from '../../../shared/components/useToast';
import { invoke } from '@tauri-apps/api/core';
import { useVirtualizer } from '@tanstack/react-virtual';

export function ClipboardList() {
  const { selectedClipId, selectClip, selectedCollectionId, selectedTagId } = useUIStore();
  
  const listParams = {
    collection_id: selectedCollectionId ?? undefined,
    tag_id: selectedTagId ?? undefined,
  };

  const { clips: historyClips, isLoading: isHistoryLoading, error: historyError, fetchNextPage, hasNextPage, isFetchingNextPage } = useClipboard(listParams);
  const { debouncedQuery, results: searchClips, isLoading: isSearchLoading, error: searchError } = useSearch(listParams);
  const { addToast } = useToast();

  const isSearching = debouncedQuery.trim().length > 0;
  
  const clips = isSearching ? searchClips : historyClips;
  const isLoading = isSearching ? isSearchLoading : (isHistoryLoading && clips.length === 0);
  const error = isSearching ? searchError : historyError;

  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: clips.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 80, // estimated item height
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  useEffect(() => {
    if (!isSearching && hasNextPage && !isFetchingNextPage) {
      const lastItem = items[items.length - 1];
      if (lastItem && lastItem.index >= clips.length - 5) {
        fetchNextPage();
      }
    }
  }, [items, isSearching, hasNextPage, isFetchingNextPage, clips.length, fetchNextPage]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!clips || clips.length === 0) return;
    const currentIndex = clips.findIndex(c => c.id === selectedClipId);
    
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (currentIndex < clips.length - 1) {
          selectClip(clips[currentIndex + 1].id);
          virtualizer.scrollToIndex(currentIndex + 1);
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (currentIndex > 0) {
          selectClip(clips[currentIndex - 1].id);
          virtualizer.scrollToIndex(currentIndex - 1);
        }
        break;
      }
      case 'Home': {
        e.preventDefault();
        selectClip(clips[0].id);
        virtualizer.scrollToIndex(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        selectClip(clips[clips.length - 1].id);
        virtualizer.scrollToIndex(clips.length - 1);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        const previewEl = document.querySelector('[data-testid="clipboard-preview"]') as HTMLElement;
        previewEl?.focus();
        break;
      }
      case ' ': { // Space
        e.preventDefault();
        if (currentIndex !== -1) {
          const clip = clips[currentIndex];
          if (clip.content_type === 'file') {
            invoke('restore_files_to_clipboard', { clipId: clip.id })
              .then(() => addToast({ title: 'Files copied to clipboard', variant: 'success' }))
              .catch((err: unknown) => addToast({ title: 'Failed to copy files', description: (err instanceof Error ? err.message : String(err)) || String(err), variant: 'error' }));
          } else {
            const content = clip.content_text ?? clip.preview;
            if (content) {
              navigator.clipboard.writeText(content);
              addToast({ title: 'Copied to clipboard', variant: 'success' });
            }
          }
        }
        break;
      }
      case 'Delete':
      case 'Backspace': {
        if (currentIndex !== -1) {
          const trashButton = listRef.current?.querySelector(`[data-testid="clip-${clips[currentIndex].id}"] [aria-label="Delete item"]`) as HTMLButtonElement;
          trashButton?.click();
        }
        break;
      }
    }
  };

  if (isLoading) {
    return (
      <div data-testid="clipboard-list-loading" className="flex-1 overflow-hidden p-4 bg-transparent">
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-surface rounded-md"></div>
          <div className="h-16 bg-surface rounded-md"></div>
          <div className="h-16 bg-surface rounded-md"></div>
          <div className="h-16 bg-surface rounded-md"></div>
          <div className="h-16 bg-surface rounded-md"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="clipboard-list-error" className="flex-1 flex flex-col items-center justify-center text-danger p-4 text-center bg-transparent">
        <p className="font-medium mb-1">Failed to load {isSearching ? 'search results' : 'clipboard history'}</p>
        <p className="text-sm opacity-80">{error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)}</p>
      </div>
    );
  }

  if (!clips || clips.length === 0) {
    return <EmptyState isSearch={isSearching} />;
  }

  return (
    <div 
      ref={listRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Clipboard history"
      data-testid="clipboard-list" 
      className="flex-1 overflow-y-auto overflow-x-hidden border-r border-border bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
    >
      <div 
        key={isSearching ? `search-${debouncedQuery}` : 'history'}
        className="relative w-full transition-opacity duration-150 ease-out starting:opacity-0"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualItem) => {
            const clip = clips[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
              >
                <ClipboardItem
                  clip={clip}
                  isSelected={clip.id === selectedClipId}
                  onSelect={selectClip}
                  tabIndex={clip.id === selectedClipId ? 0 : -1}
                />
              </div>
            );
          })}
        </div>
        {!isSearching && isFetchingNextPage && (
          <div className="absolute bottom-0 w-full p-4 text-center text-text-tertiary text-sm">
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}

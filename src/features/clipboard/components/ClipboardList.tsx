import { useRef, useEffect, memo, useCallback } from 'react';
import { useClipboard } from '../hooks/useClipboard';
import { useSearch } from '../../search/hooks/useSearch';
import { useUIStore } from '../../../stores/ui-store';
import type { SmartFilter } from '../../../stores/ui-store';
import { ClipboardItem } from './ClipboardItem';
import { EmptyState } from './EmptyState';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ListParams } from '../../../shared/types';
import { useClipboardActions } from '../hooks/useClipboardActions';

/** Translate a smart filter into backend-compatible ListParams. */
function smartFilterToParams(filter: SmartFilter): Partial<ListParams> {
  switch (filter) {
    case 'favorites': return { favorites_only: true };
    case 'pinned': return { pinned_only: true };
    case 'images': return { content_type: 'image' };
    case 'code': return { is_code: true };
    case 'links': return { category: 'url' };
    case 'files': return { content_type: 'file' };
    default: return {};
  }
}

export const ClipboardList = memo(function ClipboardList() {
  const selectedClipId = useUIStore((s) => s.selectedClipId);
  const selectedClipIds = useUIStore((s) => s.selectedClipIds);
  const selectedCollectionId = useUIStore((s) => s.selectedCollectionId);
  const selectedTagId = useUIStore((s) => s.selectedTagId);
  const smartFilter = useUIStore((s) => s.smartFilter);
  const selectClip = useUIStore((s) => s.selectClip);
  const setSelectedClipIds = useUIStore((s) => s.setSelectedClipIds);
  
  const listParams: ListParams = {
    collection_id: selectedCollectionId ?? undefined,
    tag_id: selectedTagId ?? undefined,
    ...smartFilterToParams(smartFilter),
  };

  const { clips: historyClips, isLoading: isHistoryLoading, error: historyError, fetchNextPage, hasNextPage, isFetchingNextPage } = useClipboard(listParams);
  const { debouncedQuery, results: searchClips, isLoading: isSearchLoading, error: searchError } = useSearch(listParams);

  const isSearching = debouncedQuery.trim().length > 0;
  
  const clips = isSearching ? searchClips : historyClips;
  const isLoading = isSearching ? isSearchLoading : (isHistoryLoading && clips.length === 0);
  const error = isSearching ? searchError : historyError;

  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: clips.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 56, // matches h-14 in ClipboardItem
    overscan: 5,
  });

  const handleSelect = useCallback((id: number, e?: React.MouseEvent | React.KeyboardEvent) => {
    const clickedIndex = clips.findIndex(c => c.id === id);
    if (clickedIndex === -1) return;

    const state = useUIStore.getState();
    const currentSelectedId = state.selectedClipId;
    const currentSelectedIds = state.selectedClipIds;

    if (e && e.shiftKey) {
      let anchorIndex = clips.findIndex(c => c.id === currentSelectedId);
      if (anchorIndex === -1) anchorIndex = 0;
      
      const start = Math.min(anchorIndex, clickedIndex);
      const end = Math.max(anchorIndex, clickedIndex);
      
      const newIds = new Set(currentSelectedIds);
      for (let i = start; i <= end; i++) {
        newIds.add(clips[i].id);
      }
      state.setSelectedClipIds(newIds);
      // Do not change the anchor (currentSelectedId) so subsequent shift-clicks extend from the same anchor.
    } else if (e && (e.ctrlKey || e.metaKey)) {
      const newIds = new Set(currentSelectedIds);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      state.setSelectedClipIds(newIds);
      if (newIds.has(id)) {
        state.selectClip(id);
      } else if (currentSelectedId === id && newIds.size > 0) {
        // Find another selected item to be the anchor
        state.selectClip(Array.from(newIds)[0]);
      }
    } else {
      state.selectClip(id);
    }
  }, [clips]);

  // Wire clipboard item actions to ActionRegistry
  useClipboardActions(clips, virtualizer, listRef);

  const items = virtualizer.getVirtualItems();

  useEffect(() => {
    if (!isSearching && hasNextPage && !isFetchingNextPage) {
      const lastItem = items[items.length - 1];
      if (lastItem && lastItem.index >= clips.length - 5) {
        fetchNextPage();
      }
    }
  }, [items, isSearching, hasNextPage, isFetchingNextPage, clips.length, fetchNextPage]);

  // Synchronize Preview Panel selection when active filter or search changes
  useEffect(() => {
    if (isLoading) return;
    if (clips.length === 0) {
      if (selectedClipId !== null) {
        selectClip(null);
      }
    } else {
      const exists = clips.some(c => c.id === selectedClipId);
      if (!exists) {
        selectClip(clips[0].id);
      }
    }
  }, [clips, isLoading, selectedClipId, selectClip]);

  if (isLoading) {
    return (
      <div data-testid="clipboard-list-loading" className="flex-1 overflow-hidden p-4 bg-transparent">
        <div className="space-y-4 animate-pulse">
          <div className="h-14 bg-surface rounded-md"></div>
          <div className="h-14 bg-surface rounded-md"></div>
          <div className="h-14 bg-surface rounded-md"></div>
          <div className="h-14 bg-surface rounded-md"></div>
          <div className="h-14 bg-surface rounded-md"></div>
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
      role="listbox"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          setSelectedClipIds(new Set(clips.map(c => c.id)));
        } else if (e.key === 'Escape') {
          setSelectedClipIds(new Set());
        }
      }}
      onClick={(e) => {
        // If clicking directly on the list container or the padding space, clear selection
        if (e.target === e.currentTarget || e.target === listRef.current?.firstChild) {
          setSelectedClipIds(new Set());
        }
      }}
      aria-activedescendant={selectedClipId ? `clip-${selectedClipId}` : undefined}
      aria-label="Clipboard history"
      data-testid="clipboard-list" 
      className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
    >
      <div 
        key={isSearching ? `search-${debouncedQuery}` : 'history'}
        className="relative w-full animate-[ornas-fade-in_150ms_ease-out]"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${Math.round(items[0]?.start ?? 0)}px)`,
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
                  isSelected={selectedClipIds.has(clip.id) || clip.id === selectedClipId}
                  onSelect={handleSelect}
                  tabIndex={clip.id === selectedClipId ? 0 : -1}
                  searchQuery={isSearching ? debouncedQuery : undefined}
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
});

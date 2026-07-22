import { useRef } from 'react';
import { useClipboard } from '../hooks/useClipboard';
import { useSearch } from '../../search/hooks/useSearch';
import { useUIStore } from '../../../stores/ui-store';
import { ClipboardItem } from './ClipboardItem';
import { EmptyState } from './EmptyState';
import { useToast } from '../../../shared/components/useToast';
import { invoke } from '@tauri-apps/api/core';

export function ClipboardList() {
  const { selectedClipId, selectClip, selectedCollectionId, selectedTagId } = useUIStore();
  
  const listParams = {
    collection_id: selectedCollectionId ?? undefined,
    tag_id: selectedTagId ?? undefined,
  };

  const { clips: historyClips, isLoading: isHistoryLoading, error: historyError } = useClipboard(listParams);
  const { debouncedQuery, results: searchClips, isLoading: isSearchLoading, error: searchError } = useSearch(listParams);
  const { addToast } = useToast();

  const isSearching = debouncedQuery.trim().length > 0;
  
  const clips = isSearching ? searchClips : historyClips;
  const isLoading = isSearching ? isSearchLoading : isHistoryLoading;
  const error = isSearching ? searchError : historyError;

  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!clips || clips.length === 0) return;
    const currentIndex = clips.findIndex(c => c.id === selectedClipId);
    
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (currentIndex < clips.length - 1) {
          selectClip(clips[currentIndex + 1].id);
          const nextEl = listRef.current?.querySelector(`[data-testid="clip-${clips[currentIndex + 1].id}"]`);
          nextEl?.scrollIntoView({ block: 'nearest' });
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (currentIndex > 0) {
          selectClip(clips[currentIndex - 1].id);
          const prevEl = listRef.current?.querySelector(`[data-testid="clip-${clips[currentIndex - 1].id}"]`);
          prevEl?.scrollIntoView({ block: 'nearest' });
        }
        break;
      }
      case 'Home': {
        e.preventDefault();
        selectClip(clips[0].id);
        listRef.current?.scrollTo({ top: 0 });
        break;
      }
      case 'End': {
        e.preventDefault();
        selectClip(clips[clips.length - 1].id);
        const lastEl = listRef.current?.querySelector(`[data-testid="clip-${clips[clips.length - 1].id}"]`);
        lastEl?.scrollIntoView({ block: 'nearest' });
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
              .catch((err: any) => addToast({ title: 'Failed to copy files', description: err.message || String(err), variant: 'error' }));
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
      <div data-testid="clipboard-list-loading" className="flex-1 overflow-hidden p-4 bg-background">
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
      <div data-testid="clipboard-list-error" className="flex-1 flex flex-col items-center justify-center text-danger p-4 text-center bg-background">
        <p className="font-medium mb-1">Failed to load {isSearching ? 'search results' : 'clipboard history'}</p>
        <p className="text-sm opacity-80">{error instanceof Error ? error.message : String(error)}</p>
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
      className="flex-1 overflow-y-auto overflow-x-hidden border-r border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
    >
      <div 
        key={isSearching ? `search-${debouncedQuery}` : 'history'}
        className="flex flex-col transition-opacity duration-150 ease-out starting:opacity-0"
      >
        {clips.map((clip) => (
          <ClipboardItem
            key={clip.id}
            clip={clip}
            isSelected={clip.id === selectedClipId}
            onSelect={selectClip}
          />
        ))}
      </div>
    </div>
  );
}

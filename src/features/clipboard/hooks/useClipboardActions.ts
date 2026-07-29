import { useEffect, useRef } from 'react';
import { actionRegistry, ACTION_DEFINITIONS } from '../../../shared/actions';
import { useUIStore } from '../../../stores/ui-store';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../../../shared/components/useToast';
import { useToggleFavorite, useTogglePin, useDeleteClip } from '../api/mutations';
import type { ClipDto } from '../../../shared/types';
import type { Virtualizer } from '@tanstack/react-virtual';

/**
 * Hook that registers all clipboard item actions (navigation, copy, delete, pin, favorite)
 * into the centralized ActionRegistry.
 */
export function useClipboardActions(
  clips: ClipDto[],
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  listRef: React.RefObject<HTMLDivElement | null>
): void {
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  const listElementRef = useRef(listRef);
  listElementRef.current = listRef;

  const { addToast } = useToast();
  const toggleFavorite = useToggleFavorite();
  const togglePin = useTogglePin();
  const deleteClip = useDeleteClip();

  useEffect(() => {
    const defsMap = new Map(ACTION_DEFINITIONS.map((d) => [d.id, d]));
    const register = (id: string, handler: () => void | Promise<void>, enabled?: () => boolean) => {
      const def = defsMap.get(id);
      if (def) {
        actionRegistry.register(def, handler, enabled);
      }
    };

    const getSelectedClipIndex = () => {
      const selectedId = useUIStore.getState().selectedClipId;
      if (selectedId === null) return -1;
      return clipsRef.current.findIndex((c) => c.id === selectedId);
    };

    const getSelectedClip = () => {
      const idx = getSelectedClipIndex();
      return idx !== -1 ? clipsRef.current[idx] : null;
    };

    const selectAndScroll = (index: number) => {
      if (index >= 0 && index < clipsRef.current.length) {
        const clip = clipsRef.current[index];
        useUIStore.getState().selectClip(clip.id);
        virtualizerRef.current.scrollToIndex(index);
      }
    };

    // ── Navigation ──
    register(
      'clip.prev',
      () => {
        const idx = getSelectedClipIndex();
        if (idx > 0) {
          selectAndScroll(idx - 1);
        } else if (idx === 0) {
          const searchInput = document.querySelector('[data-testid="search-bar"]') as HTMLElement;
          searchInput?.focus();
        }
      },
      () => clipsRef.current.length > 0
    );

    register(
      'clip.next',
      () => {
        const idx = getSelectedClipIndex();
        if (idx < clipsRef.current.length - 1) {
          selectAndScroll(idx + 1);
        }
      },
      () => clipsRef.current.length > 0
    );

    register(
      'clip.first',
      () => {
        if (clipsRef.current.length > 0) selectAndScroll(0);
      },
      () => clipsRef.current.length > 0
    );

    register(
      'clip.last',
      () => {
        if (clipsRef.current.length > 0) selectAndScroll(clipsRef.current.length - 1);
      },
      () => clipsRef.current.length > 0
    );

    const getSelectedClips = () => {
      const state = useUIStore.getState();
      const ids = Array.from(state.selectedClipIds);
      if (ids.length === 0 && state.selectedClipId !== null) {
        return [state.selectedClipId];
      }
      return ids;
    };

    // ── Item Actions ──
    register(
      'clip.copy',
      async () => {
        const clip = getSelectedClip();
        if (!clip) return;
        try {
          if (clip.content_type === 'file') {
            await invoke('restore_files_to_clipboard', { clipId: clip.id });
            addToast({ title: 'Files copied to clipboard', variant: 'success' });
          } else if (clip.content_type === 'image') {
            await invoke('restore_image_to_clipboard', { clipId: clip.id });
            addToast({ title: 'Image copied to clipboard', variant: 'success' });
          } else {
            const content = clip.content_text ?? clip.preview;
            if (content) {
              await navigator.clipboard.writeText(content);
              addToast({ title: 'Copied to clipboard', variant: 'success' });
            }
          }
        } catch (err: unknown) {
          addToast({
            title: 'Failed to copy',
            description: (err instanceof Error ? err.message : String(err)) || String(err),
            variant: 'error',
          });
        }
      },
      () => getSelectedClip() !== null
    );

    register(
      'clip.delete',
      async () => {
        const ids = getSelectedClips();
        if (ids.length === 0) return;
        
        if (ids.length === 1) {
          const listEl = listElementRef.current.current;
          const trashButton = listEl?.querySelector(
            `[data-testid="clip-${ids[0]}"] [aria-label="Delete item"]`
          ) as HTMLButtonElement;
          if (trashButton) {
            trashButton.click();
            return;
          }
        }
        
        try {
          await invoke('bulk_delete_clips', { ids });
          useUIStore.getState().setSelectedClipIds(new Set());
        } catch (err) {
          console.error(err);
        }
      },
      () => getSelectedClips().length > 0
    );

    register(
      'clip.favorite',
      async () => {
        const ids = getSelectedClips();
        if (ids.length === 0) return;
        
        if (ids.length === 1) {
          toggleFavorite.mutate(ids[0]);
          return;
        }

        try {
          await invoke('bulk_set_favorite', { ids, favorite: true });
          useUIStore.getState().setSelectedClipIds(new Set());
        } catch (err) {
          console.error(err);
        }
      },
      () => getSelectedClips().length > 0
    );

    register(
      'clip.pin',
      async () => {
        const ids = getSelectedClips();
        if (ids.length === 0) return;
        
        if (ids.length === 1) {
          togglePin.mutate(ids[0]);
          return;
        }

        try {
          await invoke('bulk_set_pinned', { ids, pinned: true });
          useUIStore.getState().setSelectedClipIds(new Set());
        } catch (err) {
          console.error(err);
        }
      },
      () => getSelectedClips().length > 0
    );

    register(
      'preview.focus',
      () => {
        const previewEl = document.querySelector('[data-testid="clipboard-preview"]') as HTMLElement;
        previewEl?.focus();
      },
      () => getSelectedClip() !== null
    );

    return () => {
      [
        'clip.prev',
        'clip.next',
        'clip.first',
        'clip.last',
        'clip.copy',
        'clip.delete',
        'clip.favorite',
        'clip.pin',
        'preview.focus',
      ].forEach((id) => {
        actionRegistry.unregister(id);
      });
    };
  }, [addToast, deleteClip, toggleFavorite, togglePin]);
}

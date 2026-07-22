import { useQueryClient } from '@tanstack/react-query';
import { useTauriEvent } from '../../../shared/hooks/useTauriEvent';
import { TAURI_EVENTS } from '../../../shared/lib/constants';
import { clipboardKeys } from '../../../shared/lib/queryKeys';
import type { ClipboardEventDto, ClipDto } from '../../../shared/types';
import { getClip } from '../../../services/clipboard';
import { useUIStore } from '../../../stores/ui-store';

/** Hook to listen and react to backend clipboard events. */
export function useClipboardEvents() {
  const queryClient = useQueryClient();

  useTauriEvent<ClipboardEventDto>(TAURI_EVENTS.CLIP_CREATED, async (payload) => {
    try {
      const newClip = await getClip(payload.id);
      if (!newClip) return;

      queryClient.setQueriesData({ queryKey: clipboardKeys.lists() }, (oldData: ClipDto[] | undefined) => {
        if (!oldData) return oldData;
        // Prevent duplicates
        if (oldData.some(clip => clip.id === newClip.id)) {
          return oldData;
        }
        
        // Pinned items stay at the top. Insert the new clip below all pinned items.
        // Assuming the list is already sorted correctly from the backend.
        const pinnedCount = oldData.filter(clip => clip.is_pinned).length;
        const newData = [...oldData];
        newData.splice(pinnedCount, 0, newClip);
        return newData;
      });

      // Invalidate to ensure consistency in the background
      queryClient.invalidateQueries({ queryKey: clipboardKeys.lists() });
    } catch (error) {
      console.error('Failed to handle clip-created event:', error);
    }
  });

  useTauriEvent<ClipboardEventDto>(TAURI_EVENTS.CLIP_UPDATED, async (payload) => {
    try {
      const updatedClip = await getClip(payload.id);
      if (!updatedClip) return;

      // Update lists
      queryClient.setQueriesData({ queryKey: clipboardKeys.lists() }, (oldData: ClipDto[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(clip => clip.id === updatedClip.id ? updatedClip : clip);
      });
      
      // Update detail cache if it exists
      queryClient.setQueryData(clipboardKeys.detail(payload.id), updatedClip);
      
      // Invalidate to ensure consistency (e.g. sort order might change if pinned state changed)
      queryClient.invalidateQueries({ queryKey: clipboardKeys.lists() });
    } catch (error) {
      console.error('Failed to handle clip-updated event:', error);
    }
  });

  useTauriEvent<ClipboardEventDto>(TAURI_EVENTS.CLIP_DELETED, (payload) => {
    // 1. Clear selection safely if the deleted clip is currently selected
    const { selectedClipId, selectClip } = useUIStore.getState();
    if (selectedClipId === payload.id) {
      selectClip(null);
    }

    // 2. Remove from lists
    queryClient.setQueriesData({ queryKey: clipboardKeys.lists() }, (oldData: ClipDto[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.filter(clip => clip.id !== payload.id);
    });
    
    // 3. Remove from detail cache
    queryClient.removeQueries({ queryKey: clipboardKeys.detail(payload.id) });
    
    // 4. Invalidate to ensure consistency
    queryClient.invalidateQueries({ queryKey: clipboardKeys.lists() });
  });
}

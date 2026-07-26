/** Hook to listen and react to backend clipboard events.
 *
 * Must be mounted in a component that is always rendered (e.g. App)
 * so that events are received at all times.
 */

import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useTauriEvent } from '../../../shared/hooks/useTauriEvent';
import { TAURI_EVENTS } from '../../../shared/lib/constants';
import { clipboardKeys } from '../../../shared/lib/queryKeys';
import type { ClipboardEventDto, ClipDto } from '../../../shared/types';
import { getClip } from '../../../services/clipboard';
import { useUIStore } from '../../../stores/ui-store';

type ClipPages = InfiniteData<ClipDto[]>;

/** Hook to listen and react to backend clipboard events. */
export function useClipboardEvents() {
  const queryClient = useQueryClient();

  useTauriEvent<ClipboardEventDto>(TAURI_EVENTS.CLIP_CREATED, (payload) => {
    console.log('[ORNAS] clip-created event received:', payload);

    // Immediately invalidate queries to trigger a refetch — this is the most
    // reliable approach. The optimistic cache update below is a nice-to-have.
    queryClient.invalidateQueries({ queryKey: clipboardKeys.lists() });

    // Also try to optimistically prepend the new clip to avoid a flash
    getClip(payload.id)
      .then((newClip) => {
        if (!newClip) return;

        queryClient.setQueriesData<ClipPages>(
          { queryKey: clipboardKeys.lists() },
          (oldData) => {
            if (!oldData?.pages?.length) return oldData;

            const firstPage = oldData.pages[0];
            // Prevent duplicates
            if (firstPage.some(clip => clip.id === newClip.id)) {
              return oldData;
            }

            // Insert below pinned items in the first page
            const pinnedCount = firstPage.filter(clip => clip.is_pinned).length;
            const updatedFirstPage = [...firstPage];
            updatedFirstPage.splice(pinnedCount, 0, newClip);

            return {
              ...oldData,
              pages: [updatedFirstPage, ...oldData.pages.slice(1)],
            };
          }
        );
      })
      .catch((error) => {
        console.error('[ORNAS] Failed to fetch new clip after clip-created:', error);
      });
  });

  useTauriEvent<ClipboardEventDto>(TAURI_EVENTS.CLIP_UPDATED, (payload) => {
    console.log('[ORNAS] clip-updated event received:', payload);

    getClip(payload.id)
      .then((updatedClip) => {
        if (!updatedClip) return;

        queryClient.setQueriesData<ClipPages>(
          { queryKey: clipboardKeys.lists() },
          (oldData) => {
            if (!oldData?.pages?.length) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map(page =>
                page.map(clip => clip.id === updatedClip.id ? updatedClip : clip)
              ),
            };
          }
        );

        queryClient.setQueryData(clipboardKeys.detail(payload.id), updatedClip);
        queryClient.invalidateQueries({ queryKey: clipboardKeys.lists() });
      })
      .catch((error) => {
        console.error('[ORNAS] Failed to fetch updated clip:', error);
      });
  });

  useTauriEvent<ClipboardEventDto>(TAURI_EVENTS.CLIP_DELETED, (payload) => {
    console.log('[ORNAS] clip-deleted event received:', payload);

    const { selectedClipId, selectClip } = useUIStore.getState();
    if (selectedClipId === payload.id) {
      selectClip(null);
    }

    queryClient.setQueriesData<ClipPages>(
      { queryKey: clipboardKeys.lists() },
      (oldData) => {
        if (!oldData?.pages?.length) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page =>
            page.filter(clip => clip.id !== payload.id)
          ),
        };
      }
    );

    queryClient.removeQueries({ queryKey: clipboardKeys.detail(payload.id) });
    queryClient.invalidateQueries({ queryKey: clipboardKeys.lists() });
  });
}

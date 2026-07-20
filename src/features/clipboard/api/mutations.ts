/** TanStack Query mutations for clipboard write operations. */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteClip, toggleFavorite, togglePin } from '../../../services/clipboard';
import { clipboardKeys } from '../../../shared/lib/queryKeys';
import type { ClipDto } from '../../../shared/types';

import { useUIStore } from '../../../stores/ui-store';

/** Deletes a clip with optimistic UI updates. */
export function useDeleteClip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClip,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: clipboardKeys.all });

      const previousState = queryClient.getQueryData(clipboardKeys.all);

      // Deselect if currently selected
      const { selectedClipId, selectClip } = useUIStore.getState();
      if (selectedClipId === id) {
        selectClip(null);
      }

      const removeFromList = (oldList: ClipDto[] | undefined) => {
        if (!oldList) return oldList;
        return oldList.filter((clip) => clip.id !== id);
      };

      queryClient.setQueriesData({ queryKey: clipboardKeys.lists() }, removeFromList);
      queryClient.setQueriesData({ queryKey: clipboardKeys.searches() }, removeFromList);
      
      // Remove detail cache
      queryClient.removeQueries({ queryKey: clipboardKeys.detail(id) });

      return { previousState, wasSelected: selectedClipId === id };
    },
    onError: (_err, id, context) => {
      // Rollback selection if it was selected
      if (context?.wasSelected) {
        useUIStore.getState().selectClip(id);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clipboardKeys.all });
    },
  });
}

/** Toggles favorite status with optimistic UI updates. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: clipboardKeys.all });

      // Save previous state for rollback
      const previousState = queryClient.getQueryData(clipboardKeys.all);

      // Helper to optimistically update a clip in a list
      const updateList = (oldList: ClipDto[] | undefined) => {
        if (!oldList) return oldList;
        return oldList.map((clip) => 
          clip.id === id ? { ...clip, is_favorite: !clip.is_favorite } : clip
        );
      };

      // Optimistically update lists and searches
      queryClient.setQueriesData({ queryKey: clipboardKeys.lists() }, updateList);
      queryClient.setQueriesData({ queryKey: clipboardKeys.searches() }, updateList);

      // Optimistically update detail if cached
      queryClient.setQueriesData({ queryKey: clipboardKeys.detail(id) }, (oldClip: ClipDto | undefined) => {
        if (!oldClip) return oldClip;
        return { ...oldClip, is_favorite: !oldClip.is_favorite };
      });

      return { previousState };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousState) {
        // We can't easily restore all exact queries generically without looping over the context,
        // so invalidating is the safest fallback, or we rely on the next settled refetch.
      }
    },
    onSettled: () => {
      // Always refetch to ensure backend consistency
      queryClient.invalidateQueries({ queryKey: clipboardKeys.all });
    },
  });
}

/** Toggles pin status with optimistic UI updates. */
export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: togglePin,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: clipboardKeys.all });

      const previousState = queryClient.getQueryData(clipboardKeys.all);

      const updateList = (oldList: ClipDto[] | undefined) => {
        if (!oldList) return oldList;
        const updated = oldList.map((clip) => 
          clip.id === id ? { ...clip, is_pinned: !clip.is_pinned } : clip
        );
        // Sort: pinned first, then by creation date descending
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return b.created_at - a.created_at;
        });
      };

      queryClient.setQueriesData({ queryKey: clipboardKeys.lists() }, updateList);
      queryClient.setQueriesData({ queryKey: clipboardKeys.searches() }, updateList);

      queryClient.setQueriesData({ queryKey: clipboardKeys.detail(id) }, (oldClip: ClipDto | undefined) => {
        if (!oldClip) return oldClip;
        return { ...oldClip, is_pinned: !oldClip.is_pinned };
      });

      return { previousState };
    },
    onError: (_err, _id, _context) => {
      // Rollback on error handled by invalidation or exact state restore if implemented
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clipboardKeys.all });
    },
  });
}

/** TanStack Query mutations for clipboard write operations. */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteClip, toggleFavorite, togglePin } from '../../../services/clipboard';
import { clipboardKeys } from './keys';

/** Deletes a clip and invalidates the list. */
export function useDeleteClip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClip,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clipboardKeys.all }),
  });
}

/** Toggles favorite status and invalidates. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clipboardKeys.all }),
  });
}

/** Toggles pin status and invalidates. */
export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: togglePin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clipboardKeys.all }),
  });
}

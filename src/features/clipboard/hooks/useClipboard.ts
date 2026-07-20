/** Hook to access clipboard operations and data. */
import { useClipsQuery } from '../api/queries';
import { useDeleteClip, useToggleFavorite, useTogglePin } from '../api/mutations';
import type { ListParams } from '../../../shared/types';

export function useClipboard(params?: ListParams) {
  const { data: clips = [], isLoading, error } = useClipsQuery(params);
  const deleteMutation = useDeleteClip();
  const favoriteMutation = useToggleFavorite();
  const pinMutation = useTogglePin();

  return {
    clips,
    isLoading,
    error,
    deleteClip: deleteMutation.mutateAsync,
    toggleFavorite: favoriteMutation.mutateAsync,
    togglePin: pinMutation.mutateAsync,
  } as const;
}

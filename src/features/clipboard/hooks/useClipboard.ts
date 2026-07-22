/** Hook to access clipboard operations and data. */
import { useClipsQuery } from '../api/queries';
import { useDeleteClip, useToggleFavorite, useTogglePin } from '../api/mutations';
import type { ClipDto, ListParams } from '../../../shared/types';

export function useClipboard(params?: ListParams) {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useClipsQuery(params);
  const deleteMutation = useDeleteClip();
  const favoriteMutation = useToggleFavorite();
  const pinMutation = useTogglePin();

  const clips: ClipDto[] = data?.pages.flat() ?? [];

  return {
    clips,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    deleteClip: deleteMutation.mutateAsync,
    toggleFavorite: favoriteMutation.mutateAsync,
    togglePin: pinMutation.mutateAsync,
  } as const;
}

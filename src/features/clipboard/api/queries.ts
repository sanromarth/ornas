/** TanStack Query queries for clipboard data fetching. */

import { useQuery } from '@tanstack/react-query';
import { listClips, getClip } from '../../../services/clipboard';
import { CollectionService } from '../../../services/collection-service';
import { TagService } from '../../../services/tag-service';
import { VaultService } from '../../../services/vault';
import { clipboardKeys } from '../../../shared/lib/queryKeys';
import type { ListParams } from '../../../shared/types';

/** Fetches paginated clipboard items. */
export function useClipsQuery(params?: ListParams) {
  return useQuery({
    queryKey: clipboardKeys.list(params ?? {}),
    queryFn: () => listClips(params),
  });
}

/** Fetches a single clip by ID. */
export function useClipQuery(id: number | null) {
  return useQuery({
    queryKey: clipboardKeys.detail(id!),
    queryFn: () => getClip(id!),
    enabled: id !== null,
  });
}

export function useClipCollectionsQuery(id: number | null) {
  return useQuery({
    queryKey: clipboardKeys.collections(id!),
    queryFn: () => CollectionService.getCollectionsForClip(id!),
    enabled: id !== null,
  });
}

export function useClipTagsQuery(id: number | null) {
  return useQuery({
    queryKey: clipboardKeys.tags(id!),
    queryFn: () => TagService.getTagsForClip(id!),
    enabled: id !== null,
  });
}

export function useDecryptedClipQuery(id: number | null, isEncrypted: boolean, isUnlocked: boolean) {
  return useQuery({
    queryKey: ['decryptedClip', id],
    queryFn: () => VaultService.getDecryptedClip(id!),
    enabled: id !== null && isEncrypted && isUnlocked,
  });
}

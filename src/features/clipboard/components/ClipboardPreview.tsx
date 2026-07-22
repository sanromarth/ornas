import { useState, useEffect, lazy, Suspense } from 'react';
import { useUIStore } from '../../../stores/ui-store';
import { useQueryClient } from '@tanstack/react-query';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { useClipQuery, useClipCollectionsQuery, useClipTagsQuery } from '../api/queries';

import { Star, Pin, Trash2, Copy, Check, MousePointer, Plus, Lock, Unlock } from 'lucide-react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Dialog } from '../../../shared/components/Dialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Button } from '../../../shared/components/Button';
import { useToggleFavorite, useTogglePin, useDeleteClip } from '../api/mutations';
import { useToast } from '../../../shared/components/useToast';
import { cn } from '../../../shared/lib/utils';
import { useCollectionStore } from '../../../stores/collection-store';
import { useTagStore } from '../../../stores/tag-store';
import { CollectionService } from '../../../services/collection-service';
import { TagService } from '../../../services/tag-service';
import { clipboardKeys } from '../../../shared/lib/queryKeys';
const CodeSnippetPreview = lazy(() => import('./CodeSnippetPreview').then(module => ({ default: module.CodeSnippetPreview })));

function ImagePreview({ imagePath }: { imagePath: string }) {
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    async function load() {
      try {
        const base = await appDataDir();
        const fullPath = await join(base, 'images', imagePath);
        setSrc(convertFileSrc(fullPath));
      } catch (err) {
        console.error('Failed to resolve image path', err);
      }
    }
    load();
  }, [imagePath]);

  if (!src) return <div className="p-6 text-text-tertiary">Loading image...</div>;
  return (
    <div className="p-6 overflow-auto h-full">
      <img src={src} alt="Clipboard content" className="max-w-full h-auto rounded-md shadow-sm border border-border" />
    </div>
  );
}

import { useVaultStore } from '../../../stores/vault-store';
import { VaultLockScreen } from '../../vault/components/VaultLockScreen';
import { useDecryptedClipQuery } from '../api/queries';
import { VaultService } from '../../../services/vault';

export function ClipboardPreview() {
  const queryClient = useQueryClient();
  const { selectedClipId } = useUIStore();
  const { collections: allCollections } = useCollectionStore();
  const { tags: allTags } = useTagStore();
  const { isUnlocked, isInitialized } = useVaultStore();
  const { data: rawClip, isLoading, error } = useClipQuery(selectedClipId);
  const { data: decryptedClip, isLoading: isDecrypting } = useDecryptedClipQuery(
    selectedClipId, 
    rawClip?.is_encrypted ?? false, 
    isUnlocked
  );
  
  // Merge decrypted content if available
  const clip = rawClip ? {
    ...rawClip,
    content_text: decryptedClip?.content_text ?? rawClip.content_text,
    content_html: decryptedClip?.content_html ?? rawClip.content_html,
    content_rtf: decryptedClip?.content_rtf ?? rawClip.content_rtf,
    preview: decryptedClip?.preview ?? rawClip.preview,
  } : undefined;

  const { data: collections } = useClipCollectionsQuery(selectedClipId);
  const { data: tags } = useClipTagsQuery(selectedClipId);
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useToggleFavorite();
  const { mutate: togglePin, isPending: isPinPending } = useTogglePin();
  const { mutate: deleteClip, isPending: isDeletePending } = useDeleteClip();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isAssigningCollection, setIsAssigningCollection] = useState(false);
  const [isAssigningTag, setIsAssigningTag] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { addToast } = useToast();

  const handleEncrypt = async () => {
    if (!clip || !isInitialized) return;
    setIsEncrypting(true);
    try {
      if (clip.is_encrypted) {
        await VaultService.decryptClip(clip.id);
        addToast({ title: 'Clip decrypted', variant: 'success' });
      } else {
        await VaultService.encryptClip(clip.id);
        addToast({ title: 'Clip encrypted', variant: 'success' });
      }
      queryClient.invalidateQueries({ queryKey: clipboardKeys.detail(clip.id) });
      queryClient.invalidateQueries({ queryKey: clipboardKeys.list({}) });
    } catch (err: unknown) {
      addToast({ title: 'Encryption failed', description: (err instanceof Error ? err.message : String(err)), variant: 'error' });
    } finally {
      setIsEncrypting(false);
    }
  };

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!clip) return;
    const content = clip.content_text ?? clip.preview;
    if (content) {
      navigator.clipboard.writeText(content);
      addToast({ title: 'Copied to clipboard', variant: 'success' });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    }
  };

  const toggleCollection = async (collectionId: number) => {
    if (!selectedClipId) return;
    try {
      const hasCollection = collections?.some(c => c.id === collectionId);
      if (hasCollection) {
        await CollectionService.removeClipFromCollection(selectedClipId, collectionId);
      } else {
        await CollectionService.assignClipToCollection(selectedClipId, collectionId);
      }
      queryClient.invalidateQueries({ queryKey: clipboardKeys.collections(selectedClipId) });
    } catch (err: unknown) {
      addToast({ title: 'Failed to update collection', description: (err instanceof Error ? err.message : String(err)), variant: 'error' });
    }
  };

  const toggleTag = async (tagId: number) => {
    if (!selectedClipId) return;
    try {
      const hasTag = tags?.some(t => t.id === tagId);
      if (hasTag) {
        await TagService.removeClipFromTag(selectedClipId, tagId);
      } else {
        await TagService.assignClipToTag(selectedClipId, tagId);
      }
      queryClient.invalidateQueries({ queryKey: clipboardKeys.tags(selectedClipId) });
    } catch (err: unknown) {
      addToast({ title: 'Failed to update tag', description: (err instanceof Error ? err.message : String(err)), variant: 'error' });
    }
  };

  if (!selectedClipId) {
    return (
      <div data-testid="clipboard-preview-empty" className="flex-1 bg-surface flex flex-col">
        <EmptyState
          icon={MousePointer}
          title="Select a clip"
          description="Choose an item from the list to preview."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div data-testid="clipboard-preview-loading" className="flex-1 p-6 bg-surface">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-1/3 bg-border rounded-md"></div>
          <div className="h-32 bg-border rounded-md"></div>
        </div>
      </div>
    );
  }

  if (error || !clip) {
    return (
      <div data-testid="clipboard-preview-error" className="flex-1 flex items-center justify-center text-danger p-8 text-center bg-surface">
        <p>Failed to load preview</p>
      </div>
    );
  }

  if (clip.is_encrypted && !isUnlocked) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <VaultLockScreen />
      </div>
    );
  }

  if (clip.is_encrypted && isDecrypting) {
    return (
      <div className="flex-1 p-6 bg-surface">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-1/3 bg-border rounded-md"></div>
          <div className="h-32 bg-border rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      key={clip.id}
      data-testid="clipboard-preview" 
      className="flex-1 flex flex-col overflow-auto bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring transition-opacity duration-200 ease-[var(--ease-snappy)] starting:opacity-0"
      tabIndex={0}
      role="region"
      aria-label="Clipboard content preview"
    >
      <div className="flex flex-col gap-5 p-8 border-b border-border shrink-0 bg-surface">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xl font-semibold text-text-primary tracking-tight font-outfit">
              {(clip.content_type as string) === 'image' ? 'Image Clip' : (clip.content_type as string) === 'link' ? 'Link Clip' : (clip.content_type as string) === 'code' ? 'Code Clip' : 'Text Clip'}
            </h3>
            <div className="text-[13px] text-text-secondary">
              {new Date(clip.created_at * 1000).toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
            <Button variant="secondary" size="sm" onClick={handleCopy} className={cn("gap-2 px-3 h-8 shadow-sm transition-colors", isCopied && "bg-success/10 text-success border-success/30 hover:bg-success/20")}>
              {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => togglePin(clip.id)} disabled={isPinPending} className={cn("px-2.5 h-8", clip.is_pinned && "text-primary hover:text-primary")}>
              <Pin size={16} className={clip.is_pinned ? "fill-current" : ""} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleFavorite(clip.id)} disabled={isFavoritePending} className={cn("px-2.5 h-8", clip.is_favorite && "text-primary hover:text-primary")}>
              <Star size={16} className={clip.is_favorite ? "fill-current" : ""} />
            </Button>
            {isInitialized && isUnlocked && (
              <Button variant="ghost" size="sm" onClick={handleEncrypt} disabled={isEncrypting} className={cn("px-2.5 h-8", clip.is_encrypted && "text-primary hover:text-primary")} aria-label={clip.is_encrypted ? 'Decrypt' : 'Encrypt'}>
                {clip.is_encrypted ? <Unlock size={16} /> : <Lock size={16} />}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmingDelete(true)} disabled={isDeletePending} className="px-2.5 h-8 hover:text-danger hover:bg-danger/10">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
          <div className="flex items-center gap-2">
             <span className="font-semibold text-text-tertiary uppercase tracking-wider">Details</span>
             <div className="flex gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-hover text-text-secondary border border-border">{clip.char_count.toLocaleString()} chars</span>
                <span className="px-2.5 py-0.5 rounded-full bg-hover text-text-secondary border border-border">{clip.line_count.toLocaleString()} lines</span>
                <span className="px-2.5 py-0.5 rounded-full bg-hover text-text-secondary border border-border capitalize">{clip.content_type}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="font-semibold text-text-tertiary uppercase tracking-wider">Collections</span>
             <div className="flex gap-1.5 items-center">
                {collections?.length ? null : <span className="text-text-tertiary italic">None</span>}
                {collections?.map(c => <span key={c.id} className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{c.name}</span>)}
                <button onClick={() => setIsAssigningCollection(true)} className="flex items-center justify-center h-5 w-5 rounded-full bg-hover text-text-secondary hover:text-text-primary transition-colors border border-border outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" aria-label="Add Collection"><Plus size={12} /></button>
             </div>
          </div>

          <div className="flex items-center gap-2">
             <span className="font-semibold text-text-tertiary uppercase tracking-wider">Tags</span>
             <div className="flex gap-1.5 items-center">
                {tags?.length ? null : <span className="text-text-tertiary italic">None</span>}
                {tags?.map(t => <span key={t.id} className="bg-hover text-text-primary px-2.5 py-0.5 rounded-full border border-border">#{t.name}</span>)}
                <button onClick={() => setIsAssigningTag(true)} className="flex items-center justify-center h-5 w-5 rounded-full bg-hover text-text-secondary hover:text-text-primary transition-colors border border-border outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" aria-label="Add Tag"><Plus size={12} /></button>
             </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col relative z-0">
        {clip.content_type === 'image' && clip.image_path ? (
          <ImagePreview imagePath={clip.image_path} />
        ) : (
          <Suspense fallback={<div className="p-6 text-text-tertiary">Loading snippet...</div>}>
            <CodeSnippetPreview clip={clip} />
          </Suspense>
        )}
      </div>



      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete Item"
        description="Are you sure you want to permanently delete this clipboard item?"
        confirmText="Delete"
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={() => {
          setIsConfirmingDelete(false);
          deleteClip(clip.id);
        }}
      />

      <Dialog 
        isOpen={isAssigningCollection} 
        onClose={() => setIsAssigningCollection(false)}
        title="Assign Collections"
      >
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {allCollections.length === 0 && <p className="text-sm text-text-secondary">No collections created yet.</p>}
          {allCollections.map(col => {
            const isAssigned = collections?.some(c => c.id === col.id);
            return (
              <label key={col.id} className="flex items-center gap-2 cursor-pointer hover:bg-hover p-2 rounded-md transition-colors">
                <input 
                  type="checkbox" 
                  checked={isAssigned || false}
                  onChange={() => toggleCollection(col.id)}
                  className="accent-primary"
                />
                <span className="text-sm text-text-primary">{col.name}</span>
              </label>
            );
          })}
        </div>
      </Dialog>

      <Dialog 
        isOpen={isAssigningTag} 
        onClose={() => setIsAssigningTag(false)}
        title="Assign Tags"
      >
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {allTags.length === 0 && <p className="text-sm text-text-secondary">No tags created yet.</p>}
          {allTags.map(tag => {
            const isAssigned = tags?.some(t => t.id === tag.id);
            return (
              <label key={tag.id} className="flex items-center gap-2 cursor-pointer hover:bg-hover p-2 rounded-md transition-colors">
                <input 
                  type="checkbox" 
                  checked={isAssigned || false}
                  onChange={() => toggleTag(tag.id)}
                  className="accent-primary"
                />
                <span className="text-sm text-text-primary">{tag.name}</span>
              </label>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}

/**
 * ClipboardPreview — The centerpiece of ORNAS.
 *
 * Layout (top → bottom):
 *   1. Slim action toolbar (44px, shrink-0) — Copy, Pin, Favorite, Encrypt, Delete
 *   2. Content area (flex-1, overflow-auto) — the hero
 *   3. Metadata strip (shrink-0, border-t) — chars, tags, collections, source
 *
 * Design Principles (PREVIEW_PANEL_DESIGN.md):
 *   Content First:  Content fills the panel. Header and metadata recede.
 *   Readable Width: Text content constrained to max-w-[80ch], centred on large screens.
 *   No Expensive Effects: No backdrop-blur, no box-shadow transitions.
 *   Keyboard Friendly: tabIndex=0, focus ring, Copy on Ctrl+C when focused.
 */

import { useState, useEffect, lazy, Suspense, memo, useMemo } from 'react';
import { actionRegistry, ACTION_DEFINITIONS } from '../../../shared/actions';
import { useUIStore } from '../../../stores/ui-store';
import { useQueryClient } from '@tanstack/react-query';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join, basename } from '@tauri-apps/api/path';
import { useClipQuery, useClipCollectionsQuery, useClipTagsQuery } from '../api/queries';
import { useCopyAction } from '../hooks/useCopyAction';
import { useVaultStore } from '../../../stores/vault-store';
import { useDecryptedClipQuery } from '../api/queries';
import { VaultService } from '../../../services/vault';
import { useCollectionStore } from '../../../stores/collection-store';
import { useTagStore } from '../../../stores/tag-store';
import { CollectionService } from '../../../services/collection-service';
import { TagService } from '../../../services/tag-service';
import { clipboardKeys } from '../../../shared/lib/queryKeys';
import { useToggleFavorite, useTogglePin, useDeleteClip } from '../api/mutations';
import { useToast } from '../../../shared/components/useToast';
import { cn, formatFileSize } from '../../../shared/lib/utils';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Dialog } from '../../../shared/components/Dialog';
import { DeleteDialog } from './DeleteDialog';
import { Button } from '../../../shared/components/Button';
import {
  Star, Pin, Trash2, Copy, Check, MousePointer, Plus,
  Lock, Unlock, File, FolderOpen, Image as ImageIcon,
} from 'lucide-react';
import { VaultLockScreen } from '../../vault/components/VaultLockScreen';

// Lazy-loaded heavy chunks
const CodeSnippetPreview = lazy(() =>
  import('./CodeSnippetPreview').then(m => ({ default: m.CodeSnippetPreview }))
);
const HTMLPreview = lazy(() =>
  import('./HTMLPreview').then(m => ({ default: m.HTMLPreview }))
);
const MonospacePreview = lazy(() =>
  import('./MonospacePreview').then(m => ({ default: m.MonospacePreview }))
);

function ImagePreview({ imagePath }: { imagePath: string }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = await appDataDir();
        const safeName = await basename(imagePath);
        const fullPath = await join(base, 'images', safeName);
        if (!cancelled) setSrc(convertFileSrc(fullPath));
      } catch (err) {
        console.error('Failed to resolve preview image path', err);
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [imagePath]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-tertiary">
        <ImageIcon size={32} strokeWidth={1.5} />
        <p className="text-sm">Image could not be loaded</p>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
        Loading image…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto flex items-start justify-center p-6">
      <img
        src={src}
        alt="Clipboard image"
        className="max-w-full h-auto rounded-md border border-border shadow-sm"
      />
    </div>
  );
}



function FileList({ files }: { files: NonNullable<import('../../../shared/types').ClipDto['files']> }) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex flex-col gap-2 max-w-[80ch] mx-auto">
        {files.map(f => (
          <div
            key={f.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-hover border border-border"
          >
            <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-surface border border-border text-text-tertiary">
              {f.is_dir ? <FolderOpen size={18} /> : <File size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{f.file_name}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary mt-0.5">
                {f.mime_type && <span>{f.mime_type}</span>}
                {f.file_size > 0 && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{formatFileSize(f.file_size)}</span>
                  </>
                )}
                {f.extension && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>.{f.extension}</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-text-tertiary mt-0.5 truncate opacity-70">{f.file_path}</div>
            </div>
            {f.status && f.status !== 'Available' && (
              <span className={cn(
                "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full",
                f.status === 'Moved' ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger',
              )}>
                {f.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



interface MetadataStripProps {
  clip: import('../../../shared/types').ClipDto;
  collections?: { id: number; name: string }[];
  tags?: { id: number; name: string }[];
  onAddCollection: () => void;
  onAddTag: () => void;
}

interface ParsedMetadata {
  word_count?: number;
  has_html?: boolean;
  has_rtf?: boolean;
}

function MetadataStrip({ clip, collections, tags, onAddCollection, onAddTag }: MetadataStripProps) {
  const date = useMemo(() => new Date(clip.created_at * 1000).toLocaleString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }), [clip.created_at]);

  const parsedMetadata = useMemo<ParsedMetadata | null>(() => {
    if (!clip.metadata) return null;
    try { 
      return JSON.parse(clip.metadata) as ParsedMetadata; 
    } catch {
      return null;
    }
  }, [clip.metadata]);

  return (
    <div className="shrink-0 border-t border-border bg-background px-6 py-3 flex flex-col gap-2">
      {/* Row 1: timestamp + source + char count + word count */}
      <div className="flex items-center gap-3 text-[11px] text-text-tertiary flex-wrap">
        <span>{date}</span>
        {clip.source_app && (
          <>
            <span className="opacity-40">·</span>
            <span>From <span className="text-text-secondary">{clip.source_app}</span></span>
          </>
        )}
        {clip.content_type !== 'image' && clip.content_type !== 'file' && (
          <>
            {parsedMetadata?.word_count && (
              <>
                <span className="opacity-40">·</span>
                <span>{parsedMetadata.word_count.toLocaleString()} words</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Row 2: Formats */}
      {(parsedMetadata?.has_html || parsedMetadata?.has_rtf || clip.content_type === 'image' || clip.files?.length) && (
        <div className="flex items-center gap-2 text-[11px] text-text-tertiary flex-wrap mb-1">
          <span>Formats:</span>
          <div className="flex gap-1.5">
            {clip.content_type !== 'image' && clip.content_type !== 'file' && (
              <span className="px-1.5 py-0.5 rounded-sm bg-surface border border-border text-text-secondary font-medium">Text</span>
            )}
            {parsedMetadata?.has_html && (
              <span className="px-1.5 py-0.5 rounded-sm bg-surface border border-border text-text-secondary font-medium">HTML</span>
            )}
            {parsedMetadata?.has_rtf && (
              <span className="px-1.5 py-0.5 rounded-sm bg-surface border border-border text-text-secondary font-medium">RTF</span>
            )}
            {clip.content_type === 'image' && (
              <span className="px-1.5 py-0.5 rounded-sm bg-surface border border-border text-text-secondary font-medium">Image</span>
            )}
            {(clip.files?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-sm bg-surface border border-border text-text-secondary font-medium">Files</span>
            )}
          </div>
        </div>
      )}

      {/* Row 3: collections + tags */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Collections */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {collections?.map(c => (
            <span
              key={c.id}
              className="px-2 py-0.5 text-[11px] rounded-full bg-primary/10 text-primary font-medium"
            >
              {c.name}
            </span>
          ))}
          <button
            onClick={onAddCollection}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border border-border text-text-tertiary hover:text-text-secondary hover:bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label="Assign collection"
          >
            <Plus size={10} />
            {collections?.length ? 'Collection' : 'Add Collection'}
          </button>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags?.map(t => (
            <span
              key={t.id}
              className="px-2 py-0.5 text-[11px] rounded-full border border-border text-text-secondary"
            >
              #{t.name}
            </span>
          ))}
          <button
            onClick={onAddTag}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border border-border text-text-tertiary hover:text-text-secondary hover:bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label="Assign tag"
          >
            <Plus size={10} />
            {tags?.length ? 'Tag' : 'Add Tag'}
          </button>
        </div>
      </div>
    </div>
  );
}



function contentTypeLabel(clip: import('../../../shared/types').ClipDto): string {
  const cat = clip.category;
  switch (clip.content_type as string) {
    case 'image': return 'Image';
    case 'file':  return clip.files && clip.files.length > 1 ? `${clip.files.length} Files` : 'File';
    case 'rich_text': return 'Rich Text';
    default:
      if (clip.is_code && clip.language) return clip.language.charAt(0).toUpperCase() + clip.language.slice(1);
      if (cat === 'link') return 'Link';
      if (cat === 'code') return 'Code';
      return 'Text';
  }
}



export const ClipboardPreview = memo(function ClipboardPreview() {
  const queryClient = useQueryClient();
  const selectedClipId = useUIStore((s) => s.selectedClipId);
  const { collections: allCollections } = useCollectionStore();
  const { tags: allTags } = useTagStore();
  const { isUnlocked, isInitialized } = useVaultStore();

  const { data: rawClip, isLoading, error } = useClipQuery(selectedClipId);
  const { data: decryptedClip, isLoading: isDecrypting } = useDecryptedClipQuery(
    selectedClipId,
    rawClip?.is_encrypted ?? false,
    isUnlocked,
  );

  // Merge decrypted content over raw where available
  const clip = rawClip ? {
    ...rawClip,
    content_text: decryptedClip?.content_text ?? rawClip.content_text,
    content_html:  decryptedClip?.content_html  ?? rawClip.content_html,
    content_rtf:   decryptedClip?.content_rtf   ?? rawClip.content_rtf,
    preview:       decryptedClip?.preview        ?? rawClip.preview,
  } : undefined;

  const { data: collections } = useClipCollectionsQuery(selectedClipId);
  const { data: tags }        = useClipTagsQuery(selectedClipId);

  const { mutate: toggleFavorite, isPending: isFavoritePending } = useToggleFavorite();
  const { mutate: togglePin,      isPending: isPinPending }      = useTogglePin();
  const { mutate: deleteClip,     isPending: isDeletePending }   = useDeleteClip();
  const { copyClip } = useCopyAction();

  const [isCopied,              setIsCopied]              = useState(false);
  const [isConfirmingDelete,    setIsConfirmingDelete]    = useState(false);
  const [isAssigningCollection, setIsAssigningCollection] = useState(false);
  const [isAssigningTag,        setIsAssigningTag]        = useState(false);
  const [isEncrypting,          setIsEncrypting]          = useState(false);
  const { addToast } = useToast();

  const handleCopy = async () => {
    if (!clip) return;
    const success = await copyClip(clip);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    }
  };

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
      addToast({ title: 'Encryption failed', description: err instanceof Error ? err.message : String(err), variant: 'error' });
    } finally {
      setIsEncrypting(false);
    }
  };

  useEffect(() => {
    const register = (id: string, handler: () => void, enabled?: () => boolean) => {
      const def = ACTION_DEFINITIONS.find((d) => d.id === id);
      if (def) actionRegistry.register(def, handler, enabled);
    };

    register('preview.collections', () => setIsAssigningCollection(true), () => !!clip);
    register('preview.tags', () => setIsAssigningTag(true), () => !!clip);
    register('preview.encrypt', () => handleEncrypt(), () => !!clip && isInitialized);

    return () => {
      ['preview.collections', 'preview.tags', 'preview.encrypt'].forEach((id) => {
        actionRegistry.unregister(id);
      });
    };
  }, [clip, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCollection = async (collectionId: number) => {
    if (!selectedClipId) return;
    try {
      if (collections?.some(c => c.id === collectionId)) {
        await CollectionService.removeClipFromCollection(selectedClipId, collectionId);
      } else {
        await CollectionService.assignClipToCollection(selectedClipId, collectionId);
      }
      queryClient.invalidateQueries({ queryKey: clipboardKeys.collections(selectedClipId) });
    } catch (err: unknown) {
      addToast({ title: 'Failed to update collection', description: err instanceof Error ? err.message : String(err), variant: 'error' });
    }
  };

  const toggleTag = async (tagId: number) => {
    if (!selectedClipId) return;
    try {
      if (tags?.some(t => t.id === tagId)) {
        await TagService.removeClipFromTag(selectedClipId, tagId);
      } else {
        await TagService.assignClipToTag(selectedClipId, tagId);
      }
      queryClient.invalidateQueries({ queryKey: clipboardKeys.tags(selectedClipId) });
    } catch (err: unknown) {
      addToast({ title: 'Failed to update tag', description: err instanceof Error ? err.message : String(err), variant: 'error' });
    }
  };

  // ── Guard states ───────────────────────────────────────────────────────────

  if (!selectedClipId) {
    return (
      <div data-testid="clipboard-preview-empty" className="flex-1 flex flex-col bg-background">
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
      <div data-testid="clipboard-preview-loading" className="flex-1 p-6 bg-background">
        <div className="space-y-3 animate-pulse max-w-[80ch] mx-auto">
          <div className="h-4 w-32 bg-border rounded-md" />
          <div className="h-48 bg-border rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !clip) {
    return (
      <div data-testid="clipboard-preview-error" className="flex-1 flex items-center justify-center text-danger p-8 text-center bg-background">
        <p className="text-sm">Failed to load preview</p>
      </div>
    );
  }

  if (clip.is_encrypted && !isUnlocked) {
    return (
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <VaultLockScreen />
      </div>
    );
  }

  if (clip.is_encrypted && isDecrypting) {
    return (
      <div className="flex-1 p-6 bg-background">
        <div className="space-y-3 animate-pulse max-w-[80ch] mx-auto">
          <div className="h-4 w-32 bg-border rounded-md" />
          <div className="h-48 bg-border rounded-md" />
        </div>
      </div>
    );
  }

  const typeLabel = contentTypeLabel(clip);
  const isImage = clip.content_type === 'image';
  const isFile  = clip.content_type === 'file' && clip.files && clip.files.length > 0;

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div
      key={clip.id}
      data-testid="clipboard-preview"
      className="flex-1 flex flex-col overflow-hidden bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
      tabIndex={0}
      role="region"
      aria-label="Clipboard content preview"
    >

      {/* ── Action Toolbar ── */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-6 h-11 border-b border-border bg-background">
        {/* Content info chips */}
        <div className="flex items-center gap-1.5 select-none overflow-hidden">
          <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium bg-surface border border-border rounded text-text-secondary">
            {typeLabel}
          </span>
          {clip.content_type !== 'image' && clip.content_type !== 'file' && (
            <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium bg-surface border border-border rounded text-text-tertiary hidden sm:inline-flex">
              {clip.char_count.toLocaleString()} chars
            </span>
          )}
          {clip.line_count > 1 && (
            <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium bg-surface border border-border rounded text-text-tertiary hidden md:inline-flex">
              {clip.line_count.toLocaleString()} lines
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5" role="toolbar" aria-label="Item actions">
          {/* Copy — primary action, always visible */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            title="Copy to clipboard (Space)"
            className={cn(
              "h-8 px-3 gap-1.5 text-xs transition-colors",
              isCopied && "bg-success/10 text-success border-success/30 hover:bg-success/20",
            )}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            {isCopied ? 'Copied' : 'Copy'}
          </Button>

          {/* Ghost actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePin(clip.id)}
            disabled={isPinPending}
            title={clip.is_pinned ? "Unpin" : "Pin"}
            aria-label={clip.is_pinned ? "Unpin item" : "Pin item"}
            className={cn("h-8 w-8 px-0", clip.is_pinned && "text-primary hover:text-primary")}
          >
            <Pin size={15} className={clip.is_pinned ? "fill-current" : ""} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(clip.id)}
            disabled={isFavoritePending}
            title={clip.is_favorite ? "Remove from favorites" : "Add to favorites"}
            aria-label={clip.is_favorite ? "Remove from favorites" : "Add to favorites"}
            className={cn("h-8 w-8 px-0", clip.is_favorite && "text-primary hover:text-primary")}
          >
            <Star size={15} className={clip.is_favorite ? "fill-current" : ""} />
          </Button>

          {isInitialized && isUnlocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEncrypt}
              disabled={isEncrypting}
              title={clip.is_encrypted ? "Decrypt" : "Encrypt"}
              aria-label={clip.is_encrypted ? "Decrypt item" : "Encrypt item"}
              className={cn("h-8 w-8 px-0", clip.is_encrypted && "text-primary hover:text-primary")}
            >
              {clip.is_encrypted ? <Unlock size={15} /> : <Lock size={15} />}
            </Button>
          )}

          <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isDeletePending}
            title="Delete item (Del)"
            aria-label="Delete item"
            className="h-8 w-8 px-0 hover:text-danger hover:bg-danger/10"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {/* ── Content Area (the hero) ── */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {isImage && clip.image_path ? (
          <ImagePreview imagePath={clip.image_path} />
        ) : isFile ? (
          <FileList files={clip.files!} />
        ) : clip.content_html && clip.category !== 'code' && clip.category !== 'link' && !['json', 'xml', 'yaml', 'markdown', 'sql', 'shell', 'diff', 'terminal_output', 'log'].includes(clip.category) ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">Loading preview…</div>}>
            <HTMLPreview clip={clip} />
          </Suspense>
        ) : ['diff', 'terminal_output', 'log'].includes(clip.category) ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">Loading Monospace preview…</div>}>
            <MonospacePreview clip={clip} />
          </Suspense>
        ) : clip.is_code || clip.category === 'code' || clip.category === 'link' || ['json', 'xml', 'yaml', 'markdown', 'sql', 'shell'].includes(clip.category) ? (
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
              Loading code preview…
            </div>
          }>
            <CodeSnippetPreview clip={clip} />
          </Suspense>
        ) : (
          <div className="absolute inset-0 overflow-auto">
            <div className="min-h-full p-6">
              <div className="max-w-[80ch] mx-auto select-text">
                <pre className="text-[13px] leading-relaxed text-text-primary whitespace-pre-wrap break-words font-sans">
                  {clip.content_text ?? clip.preview ?? ''}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Metadata Strip ── */}
      <MetadataStrip
        clip={clip}
        collections={collections}
        tags={tags}
        onAddCollection={() => setIsAssigningCollection(true)}
        onAddTag={() => setIsAssigningTag(true)}
      />

      {/* ── Dialogs ── */}
      <DeleteDialog
        open={isConfirmingDelete}
        item={clip}
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
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {allCollections.length === 0 && (
            <p className="text-sm text-text-secondary py-2">No collections created yet.</p>
          )}
          {allCollections.map(col => {
            const isAssigned = collections?.some(c => c.id === col.id);
            return (
              <label key={col.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-hover px-2 py-2 rounded-md transition-colors">
                <input
                  type="checkbox"
                  checked={isAssigned ?? false}
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
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {allTags.length === 0 && (
            <p className="text-sm text-text-secondary py-2">No tags created yet.</p>
          )}
          {allTags.map(tag => {
            const isAssigned = tags?.some(t => t.id === tag.id);
            return (
              <label key={tag.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-hover px-2 py-2 rounded-md transition-colors">
                <input
                  type="checkbox"
                  checked={isAssigned ?? false}
                  onChange={() => toggleTag(tag.id)}
                  className="accent-primary"
                />
                <span className="text-sm text-text-primary">#{tag.name}</span>
              </label>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
});

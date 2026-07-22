import { useState } from 'react';
import { useUIStore } from '../../../stores/ui-store';
import { useQueryClient } from '@tanstack/react-query';
import { useClipQuery, useClipCollectionsQuery, useClipTagsQuery } from '../api/queries';

import { Star, Pin, Trash2, Copy, MousePointer, Plus } from 'lucide-react';
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

export function ClipboardPreview() {
  const queryClient = useQueryClient();
  const { selectedClipId } = useUIStore();
  const { collections: allCollections } = useCollectionStore();
  const { tags: allTags } = useTagStore();
  const { data: clip, isLoading, error } = useClipQuery(selectedClipId);
  const { data: collections } = useClipCollectionsQuery(selectedClipId);
  const { data: tags } = useClipTagsQuery(selectedClipId);
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useToggleFavorite();
  const { mutate: togglePin, isPending: isPinPending } = useTogglePin();
  const { mutate: deleteClip, isPending: isDeletePending } = useDeleteClip();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isAssigningCollection, setIsAssigningCollection] = useState(false);
  const [isAssigningTag, setIsAssigningTag] = useState(false);
  const { addToast } = useToast();

  const handleCopy = () => {
    if (!clip) return;
    const content = clip.content_text ?? clip.preview;
    if (content) {
      navigator.clipboard.writeText(content);
      addToast({ title: 'Copied to clipboard', variant: 'success' });
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
    } catch (err: any) {
      addToast({ title: 'Failed to update collection', description: err.toString(), variant: 'error' });
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
    } catch (err: any) {
      addToast({ title: 'Failed to update tag', description: err.toString(), variant: 'error' });
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

  return (
    <div 
      key={clip.id}
      data-testid="clipboard-preview" 
      className="flex-1 flex flex-col overflow-auto bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring transition-opacity duration-200 ease-[var(--ease-snappy)] starting:opacity-0"
      tabIndex={0}
      role="region"
      aria-label="Clipboard content preview"
    >
      <div className="flex flex-col gap-4 p-6 border-b border-border shrink-0">
        <h3 className="text-base font-medium text-text-primary font-['Outfit'] tracking-wide">
          {(clip.content_type as string) === 'image' ? 'Image Clip' : (clip.content_type as string) === 'link' ? 'Link Clip' : (clip.content_type as string) === 'code' ? 'Code Clip' : 'Text Clip'}
        </h3>
        
        <div className="flex items-center gap-10 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium tracking-wide uppercase text-text-primary/70">Copied</span>
            <span className="text-text-primary font-medium">{new Date(clip.created_at * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium tracking-wide uppercase text-text-primary/70">Characters</span>
            <span className="text-text-primary font-medium">{clip.char_count.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium tracking-wide uppercase text-text-primary/70">Lines</span>
            <span className="text-text-primary font-medium">{clip.line_count.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium tracking-wide uppercase text-text-primary/70">Category</span>
            <span className="text-text-primary font-medium capitalize">{clip.content_type}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium tracking-wide uppercase text-text-primary/70">Pinned</span>
            <span className="text-text-primary font-medium">{clip.is_pinned ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
           <div className="flex gap-2 items-center text-xs">
              <span className="text-text-tertiary">Collections:</span>
              {collections?.map(c => <span key={c.id} className="bg-primary/20 text-primary px-2 py-0.5 rounded-full">{c.name}</span>)}
              <button onClick={() => setIsAssigningCollection(true)} className="text-text-tertiary hover:text-text-primary px-1.5 py-0.5 rounded transition-colors"><Plus size={14} /></button>
           </div>
           
           <div className="flex gap-2 items-center text-xs">
              <span className="text-text-tertiary">Tags:</span>
              {tags?.map(t => <span key={t.id} className="bg-surface border border-border px-2 py-0.5 rounded-full">#{t.name}</span>)}
              <button onClick={() => setIsAssigningTag(true)} className="text-text-tertiary hover:text-text-primary px-1.5 py-0.5 rounded transition-colors"><Plus size={14} /></button>
           </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        {clip.content_type === 'image' && clip.image_path ? (
          <img src={`asset://localhost/${clip.image_path}`} alt="Clipboard content" className="max-w-full h-auto rounded-md shadow-sm border border-border" />
        ) : (
          <pre className="whitespace-pre-wrap break-all text-sm font-mono text-text-primary max-w-[80ch] leading-relaxed">
            {clip.content_text ?? clip.preview}
          </pre>
        )}
      </div>

      <div className="border-t border-border p-4 flex items-center justify-end gap-2 shrink-0 bg-surface">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          <Copy size={16} />
          Copy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => togglePin(clip.id)}
          disabled={isPinPending}
          className={cn("gap-2", clip.is_pinned && "text-primary hover:text-primary")}
        >
          <Pin size={16} className={clip.is_pinned ? "fill-current" : ""} />
          Pin
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleFavorite(clip.id)}
          disabled={isFavoritePending}
          className={cn("gap-2", clip.is_favorite && "text-primary hover:text-primary")}
        >
          <Star size={16} className={clip.is_favorite ? "fill-current" : ""} />
          Favorite
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsConfirmingDelete(true)}
          disabled={isDeletePending}
          className="gap-2 hover:text-danger/90 hover:bg-hover"
        >
          <Trash2 size={16} />
          Delete
        </Button>
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
              <label key={col.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-md">
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
              <label key={tag.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-md">
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

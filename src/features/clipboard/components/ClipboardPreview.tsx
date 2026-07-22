import { useState } from 'react';
import { useUIStore } from '../../../stores/ui-store';
import { useClipQuery } from '../api/queries';

import { Star, Pin, Trash2, Copy, MousePointer } from 'lucide-react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Button } from '../../../shared/components/Button';
import { useToggleFavorite, useTogglePin, useDeleteClip } from '../api/mutations';
import { useToast } from '../../../shared/components/useToast';
import { cn } from '../../../shared/lib/utils';

export function ClipboardPreview() {
  const { selectedClipId } = useUIStore();
  const { data: clip, isLoading, error } = useClipQuery(selectedClipId);
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useToggleFavorite();
  const { mutate: togglePin, isPending: isPinPending } = useTogglePin();
  const { mutate: deleteClip, isPending: isDeletePending } = useDeleteClip();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { addToast } = useToast();

  const handleCopy = () => {
    if (!clip) return;
    const content = clip.content_text ?? clip.preview;
    if (content) {
      navigator.clipboard.writeText(content);
      addToast({ title: 'Copied to clipboard', variant: 'success' });
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
    </div>
  );
}

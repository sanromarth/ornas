import React, { useState } from 'react';
import { Pin, Star, Type, Image as ImageIcon, Trash2, Copy, Link, Code } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import type { ClipDto } from '../../../shared/types';
import { useToggleFavorite, useTogglePin, useDeleteClip } from '../api/mutations';
import { IconButton } from '../../../shared/components/IconButton';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/useToast';

interface Props {
  clip: ClipDto;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export const ClipboardItem = React.memo(function ClipboardItem({ clip, isSelected, onSelect }: Props) {
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useToggleFavorite();
  const { mutate: togglePin, isPending: isPinPending } = useTogglePin();
  const { mutate: deleteClip, isPending: isDeletePending } = useDeleteClip();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { addToast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const content = clip.content_text ?? clip.preview;
    if (content) {
      navigator.clipboard.writeText(content);
      addToast({ title: 'Copied to clipboard', variant: 'success' });
    }
  };

  const date = new Date(clip.created_at * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const getContentTypeIcon = () => {
    const type = clip.content_type as string;
    switch (type) {
      case 'image': return <ImageIcon size={14} />;
      case 'link': return <Link size={14} />;
      case 'code': return <Code size={14} />;
      default: return <Type size={14} />;
    }
  };

  return (
    <div
      data-testid={`clip-${clip.id}`}
      className={cn(
        "group relative flex items-center justify-between px-4 py-3 cursor-pointer border-b border-border transition-colors duration-150 ease-out hover:bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus-ring",
        isSelected ? "bg-selection border-l-2 border-l-primary" : "bg-background border-l-2 border-l-transparent"
      )}
      onClick={() => onSelect(clip.id)}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1 text-left relative">
        {/* Permanent Indicators */}
        {(clip.is_pinned || clip.is_favorite) && (
          <div className="absolute top-0 right-0 flex items-center gap-1.5 opacity-80">
            {clip.is_pinned && <Pin size={14} className="fill-current text-primary" />}
            {clip.is_favorite && <Star size={14} className="fill-current text-primary" />}
          </div>
        )}

        {/* Top line */}
        <div className="flex items-center gap-2 pr-12">
          <div className="text-text-secondary shrink-0 flex items-center justify-center">
            {getContentTypeIcon()}
          </div>
          <div className="text-sm font-medium truncate text-text-primary">
            {clip.content_type === 'image' ? (
              <span className="italic text-text-secondary">Image content</span>
            ) : (
              clip.preview
            )}
          </div>
        </div>
        
        {/* Second line */}
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{date}</span>
          <span className="opacity-50">·</span>
          <span className="capitalize">{clip.category}</span>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="shrink-0 flex items-center gap-0 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 focus-within:opacity-100 ml-2">
        <IconButton
          onClick={handleCopy}
          aria-label="Copy to clipboard"
        >
          <Copy size={16} />
        </IconButton>
        <IconButton
          active={clip.is_pinned}
          onClick={(e) => {
            e.stopPropagation();
            togglePin(clip.id);
          }}
          disabled={isPinPending}
          aria-label={clip.is_pinned ? "Unpin item" : "Pin item"}
        >
          <Pin size={16} className={clip.is_pinned ? "fill-current" : ""} />
        </IconButton>
        <IconButton
          active={clip.is_favorite}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(clip.id);
          }}
          disabled={isFavoritePending}
          aria-label={clip.is_favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star size={16} className={clip.is_favorite ? "fill-current" : ""} />
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirmingDelete(true);
          }}
          disabled={isDeletePending}
          aria-label="Delete item"
          className="hover:text-danger hover:bg-danger/10"
        >
          <Trash2 size={16} />
        </IconButton>
      </div>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete Item"
        description="Are you sure you want to permanently delete this clipboard item?"
        confirmText="Delete"
        onConfirm={() => deleteClip(clip.id)}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </div>
  );
});

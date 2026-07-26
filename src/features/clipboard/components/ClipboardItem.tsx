import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Pin, Star, Type, Image as ImageIcon, Trash2, Copy, Link, Code, File, Lock } from 'lucide-react';
import { cn, formatFileSize } from '../../../shared/lib/utils';
import type { ClipDto } from '../../../shared/types';
import { writeTextToClipboard } from '../../../services/clipboard';
import { useToggleFavorite, useTogglePin, useDeleteClip } from '../api/mutations';
import { IconButton } from '../../../shared/components/IconButton';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/useToast';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';

function ThumbnailImage({ imagePath, isSelected }: { imagePath: string, isSelected: boolean }) {
  const [src, setSrc] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const base = await appDataDir();
        const fullPath = await join(base, 'images', 'thumbnails', imagePath);
        console.log(`[Thumbnail] Resolved path requested by frontend: ${fullPath}`);
        setSrc(convertFileSrc(fullPath));
      } catch (err) {
        setError(true);
      }
    }
    load();
  }, [imagePath]);

  if (error || !src) {
    return (
      <div className={cn("w-10 h-8 rounded overflow-hidden flex items-center justify-center border", isSelected ? "bg-primary/20 border-primary/30 text-primary-foreground/70" : "bg-surface border-border text-text-tertiary")}>
        <ImageIcon size={14} />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt="Thumbnail" 
      className={cn("w-10 h-8 object-cover rounded border", isSelected ? "border-primary/50" : "border-border")}
      onError={() => setError(true)}
    />
  );
}

interface Props {
  clip: ClipDto;
  isSelected: boolean;
  onSelect: (id: number) => void;
  tabIndex?: number;
}

export const ClipboardItem = React.memo(function ClipboardItem({ clip, isSelected, onSelect, tabIndex }: Props) {
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useToggleFavorite();
  const { mutate: togglePin, isPending: isPinPending } = useTogglePin();
  const { mutate: deleteClip, isPending: isDeletePending } = useDeleteClip();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { addToast } = useToast();
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const checkNew = () => {
      const lastFocused = localStorage.getItem('ornas_last_focused_at');
      if (lastFocused) {
        setIsNew(clip.created_at * 1000 > parseInt(lastFocused, 10));
      }
    };
    checkNew();
    window.addEventListener('ornas-focus-changed', checkNew);
    return () => window.removeEventListener('ornas-focus-changed', checkNew);
  }, [clip.created_at]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clip.content_type === 'file') {
      try {
        await invoke('restore_files_to_clipboard', { clipId: clip.id });
        addToast({ title: 'Files copied to clipboard', variant: 'success' });
      } catch (err: unknown) {
        addToast({ title: 'Failed to copy files', description: (err instanceof Error ? err.message : String(err)) || String(err), variant: 'error' });
      }
      return;
    }
    
    if (clip.content_type === 'image') {
      try {
        await invoke('restore_image_to_clipboard', { clipId: clip.id });
        addToast({ title: 'Image copied to clipboard', variant: 'success' });
      } catch (err: unknown) {
        addToast({ title: 'Failed to copy image', description: (err instanceof Error ? err.message : String(err)) || String(err), variant: 'error' });
      }
      return;
    }
    
    const content = clip.content_text ?? clip.preview;
    if (content) {
      try {
        await writeTextToClipboard(content);
        addToast({ title: 'Copied to clipboard', variant: 'success' });
      } catch (err: unknown) {
        addToast({ title: 'Failed to copy', description: (err instanceof Error ? err.message : String(err)) || String(err), variant: 'error' });
      }
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
      case 'file': return <File size={14} />;
      default: return <Type size={14} />;
    }
  };

  return (
    <div
      data-testid={`clip-${clip.id}`}
      className={cn(
        "group relative flex items-center justify-between px-3 py-2 mx-2 my-0.5 rounded-md cursor-pointer transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        isSelected ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent hover:bg-hover text-text-primary"
      )}
      onClick={() => onSelect(clip.id)}
      tabIndex={tabIndex}
    >
      <div className={cn("flex-1 min-w-0 flex flex-col justify-center text-left relative", isNew ? "pl-2.5" : "pl-1")}>
        {isNew && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" title="New clip" />}
        {/* Top line */}
        <div className="flex items-center gap-2 pr-20">
          {clip.content_type !== 'image' && (
            <div className={cn("shrink-0 flex items-center justify-center", isSelected ? "text-primary-foreground opacity-90" : "text-text-secondary")}>
              {getContentTypeIcon()}
            </div>
          )}
          {clip.content_type === 'image' && clip.image_path && (
            <div className="shrink-0">
              <ThumbnailImage imagePath={clip.image_path} isSelected={isSelected} />
            </div>
          )}
          <div className="text-[13px] font-medium truncate" title={clip.content_type === 'file' ? (clip.files && clip.files.length > 1 ? `${clip.files.length} items` : (clip.files?.[0]?.file_name || clip.preview || undefined)) : (clip.is_encrypted ? undefined : (clip.preview || undefined))}>
            {clip.content_type === 'image' ? (
              clip.image_path ? <span className="text-text-secondary">Image</span> : <span className="italic text-text-secondary">Image content</span>
            ) : clip.content_type === 'file' ? (
              clip.files && clip.files.length > 1 ? (
                 <span>{clip.files.length} items</span>
              ) : (
                 <span>{clip.files?.[0]?.file_name || clip.preview}</span>
              )
            ) : clip.is_encrypted ? (
              <span className="italic text-text-secondary flex items-center gap-1">Encrypted Payload</span>
            ) : (
              clip.preview
            )}
          </div>
        </div>
        
        {/* Second line */}
        <div className={cn("flex items-center gap-2 text-[11px] mt-1", isSelected ? "text-primary-foreground/80" : "text-text-secondary")}>
          <span>{date}</span>
          <span className="opacity-50">·</span>
          {clip.content_type === 'file' && clip.files && clip.files.length > 0 ? (
            <>
              <span>
                {formatFileSize(
                  clip.files.reduce((acc, f) => acc + f.file_size, 0)
                )}
              </span>
              <span className="opacity-50">·</span>
              <span className={cn(
                clip.files[0].status === 'Available' ? 'text-success' : 
                clip.files[0].status === 'Moved' ? 'text-warning' : 'text-danger'
              )}>{clip.files[0].status}</span>
            </>
          ) : (
            <span>{clip.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
          )}
          
          {/* Indicators */}
          {(clip.is_encrypted || clip.is_pinned || clip.is_favorite) && (
            <>
              <span className="opacity-50">·</span>
              <div className="flex items-center gap-1">
                {clip.is_encrypted && <Lock size={12} className={isSelected ? "text-primary-foreground" : "text-primary"} />}
                {clip.is_pinned && <Pin size={12} className={cn("fill-current", isSelected ? "text-primary-foreground" : "text-primary")} />}
                {clip.is_favorite && <Star size={12} className={cn("fill-current", isSelected ? "text-primary-foreground" : "text-primary")} />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hover Actions - Glassmorphic Toolbar */}
      <div className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 flex items-center p-0.5 rounded-md border border-border backdrop-blur-md opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 focus-within:opacity-100 shadow-sm",
        isSelected ? "bg-primary/20 border-primary/30 text-primary-foreground" : "bg-surface/80"
      )}>
        <IconButton
          onClick={handleCopy}
          title="Copy to clipboard"
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
          title={clip.is_pinned ? "Unpin item" : "Pin item"}
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
          title={clip.is_favorite ? "Remove from favorites" : "Add to favorites"}
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
          title="Delete item"
          aria-label="Delete item"
          className="hover:text-danger hover:bg-danger/20"
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

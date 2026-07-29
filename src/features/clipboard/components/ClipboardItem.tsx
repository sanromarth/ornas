/**
 * ClipboardItem — The core list cell of ORNAS.
 *
 * Visual Hierarchy (top → bottom, primary → secondary):
 *   1. Content preview (primary — the hero)
 *   2. Type icon (supporting — identifies content type at a glance)
 *   3. Timestamp + category + file info (metadata — recedes entirely)
 *   4. Pin/Favorite/Encrypted indicators (status glyphs — smallest)
 *
 * Selection state:
 *   Mirrors the Sidebar pattern: bg-selection (Indigo tint) + border-l-2 border-primary.
 *   Content text remains fully readable (no white-on-indigo inversion).
 *
 * Performance:
 *   - React.memo — skips render when clip + selection unchanged
 *   - Hover actions use solid bg-elevated (no backdrop-blur — zero GPU cost)
 *   - "New" indicator uses a fixed-width gutter (no conditional padding shifts)
 *   - No inline anonymous functions on hot render paths
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Pin, Star, Type, Image as ImageIcon, Trash2, Copy, Link, Code, File, Lock } from 'lucide-react';
import { cn, formatFileSize } from '../../../shared/lib/utils';
import type { ClipDto } from '../../../shared/types';
import { useToggleFavorite, useTogglePin, useDeleteClip } from '../api/mutations';
import { IconButton } from '../../../shared/components/IconButton';
import { DeleteDialog } from './DeleteDialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join, basename } from '@tauri-apps/api/path';
import { useCopyAction } from '../hooks/useCopyAction';

// ── Helpers ──────────────────────────────────────────────────────────────────

function HighlightedText({ text, query }: { text: string, query: string }) {
  if (!query.trim()) return <>{text}</>;
  
  // Escape regex specials
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/30 text-text-primary rounded-sm px-0.5 font-medium">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** Format a category slug into a readable label. e.g. "rich_text" → "Rich Text" */
function formatCategory(category: string): string {
  return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Returns the appropriate Lucide icon for a content type. */
function ContentTypeIcon({ type, className }: { type: string; className?: string }) {
  const size = 13;
  switch (type) {
    case 'image': return <ImageIcon size={size} className={className} />;
    case 'link':  return <Link      size={size} className={className} />;
    case 'code':  return <Code      size={size} className={className} />;
    case 'file':  return <File      size={size} className={className} />;
    default:      return <Type      size={size} className={className} />;
  }
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

interface ThumbnailProps {
  imagePath: string;
  isSelected: boolean;
}

const ThumbnailImage = React.memo(function ThumbnailImage({ imagePath, isSelected }: ThumbnailProps) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = await appDataDir();
        const safeName = await basename(imagePath);
        const fullPath = await join(base, 'images', 'thumbnails', safeName);
        if (!cancelled) setSrc(convertFileSrc(fullPath));
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [imagePath]);

  const fallback = (
    <div className={cn(
      "w-10 h-10 rounded flex items-center justify-center border shrink-0",
      isSelected
        ? "bg-selection border-primary/30 text-primary"
        : "bg-hover border-border text-text-tertiary",
    )}>
      <ImageIcon size={13} />
    </div>
  );

  if (error || !src) return fallback;

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={cn(
        "w-10 h-10 object-cover rounded border shrink-0",
        isSelected ? "border-primary/40" : "border-border",
      )}
      onError={() => setError(true)}
    />
  );
});

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  clip: ClipDto;
  isSelected: boolean;
  onSelect: (id: number, e: React.MouseEvent | React.KeyboardEvent) => void;
  tabIndex?: number;
  searchQuery?: string;
}

export const ClipboardItem = React.memo(function ClipboardItem({
  clip,
  isSelected,
  onSelect,
  tabIndex,
  searchQuery,
}: Props) {
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useToggleFavorite();
  const { mutate: togglePin,     isPending: isPinPending }       = useTogglePin();
  const { mutate: deleteClip,    isPending: isDeletePending }    = useDeleteClip();
  const { copyClip } = useCopyAction();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // "New since last focus" indicator
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

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyClip(clip);
  }, [copyClip, clip]);

  const handleTogglePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(clip.id);
  }, [togglePin, clip.id]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(clip.id);
  }, [toggleFavorite, clip.id]);

  const handleDeleteRequest = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  }, []);

  // Formatted timestamp — computed once per render, stable reference
  const date = new Date(clip.created_at * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // ── Derived content values ──
  const isImage   = clip.content_type === 'image';
  const isFile    = clip.content_type === 'file';
  const hasFiles  = isFile && clip.files && clip.files.length > 0;
  const multiFile = hasFiles && clip.files!.length > 1;

  /** Primary content label — the text users scan. */
  const contentLabel: React.ReactNode = (() => {
    if (clip.is_encrypted) {
      return <span className="italic text-text-tertiary">Encrypted</span>;
    }
    if (isImage) {
      return <span className="text-text-secondary">Image</span>;
    }
    if (isFile) {
      return multiFile
        ? <span>{clip.files!.length} files</span>
        : <span><HighlightedText text={clip.files![0]?.file_name ?? clip.preview ?? ''} query={searchQuery ?? ''} /></span>;
    }
    return clip.preview ? <HighlightedText text={clip.preview} query={searchQuery ?? ''} /> : <span className="text-text-tertiary">No preview</span>;
  })();

  /** Tooltip for the content label. */
  const contentTitle = (() => {
    if (clip.is_encrypted || isImage) return undefined;
    if (isFile) return multiFile ? `${clip.files!.length} files` : clip.files![0]?.file_name;
    return clip.preview ?? undefined;
  })();

  return (
    <div
      id={`clip-${clip.id}`}
      data-testid={`clip-${clip.id}`}
      role="option"
      aria-selected={isSelected}
      className={cn(
        "group relative flex items-center gap-2 px-2 h-14 rounded-md cursor-pointer",
        // Background transitions smoothly; border handled by ornas-item-selection-bar
        "transition-colors duration-150 ease-out",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
        // Selection tint
        isSelected ? "bg-selection" : "bg-transparent hover:bg-hover",
      )}
      onClick={(e) => onSelect(clip.id, e)}
      tabIndex={tabIndex}
    >


      {/* ── "New" indicator — fixed 6px gutter, never shifts text ── */}
      <div className="shrink-0 w-1.5 flex items-center justify-center self-stretch">
        {isNew && (
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isSelected ? "bg-primary" : "bg-primary/70",
            )}
            title="New since last focus"
          />
        )}
      </div>

      {/* ── Image thumbnail OR type icon ── */}
      <div className="shrink-0 flex items-center">
        {isImage && clip.image_path ? (
          <ThumbnailImage imagePath={clip.image_path} isSelected={isSelected} />
        ) : (
          <ContentTypeIcon
            type={clip.content_type as string}
            className={isSelected ? "text-primary" : "text-text-tertiary"}
          />
        )}
      </div>

      {/* ── Content + metadata (flex-1, min-w-0 prevents overflow) ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">

        {/* Primary: content preview — the hero */}
        <div
          className="text-sm font-medium truncate leading-snug text-text-primary"
          title={contentTitle}
        >
          {contentLabel}
        </div>

        {/* Secondary: category/file-info + status glyphs + timestamp */}
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-text-tertiary leading-none">
          {/* Category or file details */}
          {hasFiles ? (
            <>
              <span className="shrink-0">
                {formatFileSize(clip.files!.reduce((acc, f) => acc + f.file_size, 0))}
              </span>
              {clip.files![0]?.status && (
                <>
                  <span className="opacity-40">·</span>
                  <span className={cn(
                    "shrink-0",
                    clip.files![0].status === 'Available' ? 'text-success' :
                    clip.files![0].status === 'Moved'     ? 'text-warning' : 'text-danger',
                  )}>
                    {clip.files![0].status}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="shrink-0 truncate">{formatCategory(clip.category)}</span>
          )}

          {/* Status glyphs: encrypted, pinned, favorite */}
          {(clip.is_encrypted || clip.is_pinned || clip.is_favorite) && (
            <div className="flex items-center gap-0.5 ml-0.5">
              {clip.is_encrypted && (
                <Lock size={10} className="text-primary shrink-0" aria-label="Encrypted" />
              )}
              {clip.is_pinned && (
                <Pin size={10} className="fill-current text-primary shrink-0" aria-label="Pinned" />
              )}
              {clip.is_favorite && (
                <Star size={10} className="fill-current text-primary shrink-0" aria-label="Favorite" />
              )}
            </div>
          )}

          {/* Right-aligned timestamp */}
          <span className="shrink-0 ml-auto opacity-70">{date}</span>
        </div>
      </div>

      {/* ── Hover action bar ── */}
      {/* Uses solid bg-elevated — no backdrop-blur to avoid GPU cost on fast scroll. */}
      <div
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2",
          "flex items-center gap-0 p-0.5 rounded-md",
          "bg-elevated shadow-sm",
          "opacity-0 transition-opacity duration-100 ease-out",
          "group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <IconButton
          onClick={handleCopy}
          title="Copy to clipboard (Space)"
          aria-label="Copy to clipboard"
          className="h-7 w-7 min-w-[28px] min-h-[28px]"
        >
          <Copy size={14} />
        </IconButton>
        <IconButton
          active={clip.is_pinned}
          onClick={handleTogglePin}
          disabled={isPinPending}
          title={clip.is_pinned ? "Unpin" : "Pin"}
          aria-label={clip.is_pinned ? "Unpin item" : "Pin item"}
          className="h-7 w-7 min-w-[28px] min-h-[28px]"
        >
          <Pin size={14} className={clip.is_pinned ? "fill-current" : ""} />
        </IconButton>
        <IconButton
          active={clip.is_favorite}
          onClick={handleToggleFavorite}
          disabled={isFavoritePending}
          title={clip.is_favorite ? "Unfavorite" : "Favorite"}
          aria-label={clip.is_favorite ? "Remove from favorites" : "Add to favorites"}
          className="h-7 w-7 min-w-[28px] min-h-[28px]"
        >
          <Star size={14} className={clip.is_favorite ? "fill-current" : ""} />
        </IconButton>
        <IconButton
          onClick={handleDeleteRequest}
          disabled={isDeletePending}
          title="Delete (Del)"
          aria-label="Delete item"
          className="h-7 w-7 min-w-[28px] min-h-[28px] hover:text-danger hover:bg-danger/10"
        >
          <Trash2 size={14} />
        </IconButton>
      </div>

      <DeleteDialog
        open={isConfirmingDelete}
        item={clip}
        onConfirm={() => deleteClip(clip.id)}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </div>
  );
});

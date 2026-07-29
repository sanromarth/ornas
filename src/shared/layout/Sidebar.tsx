import { useEffect, useState, memo } from 'react';
import { useCollectionStore } from '../../stores/collection-store';
import { useTagStore } from '../../stores/tag-store';
import { useUIStore, type SmartFilter } from '../../stores/ui-store';
import { useFilterCountsQuery } from '../../features/clipboard/api/queries';
import { cn } from '../lib/utils';
import {
  Inbox, Hash, Plus, Settings, Folder,
  Star, Pin, Image, Code, Link, File,
  ChevronDown,
} from 'lucide-react';

/**
 * Sidebar — ORNAS's filtering command center.
 *
 * Structure:
 *   1. Smart Filters (built-in, undeletable)
 *   2. Collections (user-created, collapsible)
 *   3. Tags (user-created, collapsible)
 *   4. Settings (bottom-pinned)
 *
 * Active state: Indigo-tinted background + solid left border.
 * Typography: uppercase tracking-wider section headers, no horizontal dividers.
 *
 * Design Principles:
 *   Keyboard First: All items are focusable buttons.
 *   Desktop First: Tight spacing, high density.
 *   Content First: Sidebar recedes when not needed.
 */

// ── Smart Filter definitions ──

interface SmartFilterDef {
  id: SmartFilter;
  label: string;
  icon: typeof Inbox;
}

const SMART_FILTERS: SmartFilterDef[] = [
  { id: 'all',       label: 'All Clips',  icon: Inbox },
  { id: 'favorites', label: 'Favorites',  icon: Star },
  { id: 'pinned',    label: 'Pinned',     icon: Pin },
  { id: 'images',    label: 'Images',     icon: Image },
  { id: 'code',      label: 'Code',       icon: Code },
  { id: 'links',     label: 'Links',      icon: Link },
  { id: 'files',     label: 'Files',      icon: File },
];

// ── Shared styles ──

/** Active state: Indigo-tinted background + solid left accent border. */
const activeItemClass = "bg-selection text-primary font-medium border-l-2 border-primary";
/** Inactive state: subtle hover, muted text. */
const inactiveItemClass = "text-text-secondary hover:bg-hover hover:text-text-primary border-l-2 border-transparent";
/** Base item styles shared by all sidebar nav items. */
const baseItemClass = "w-full text-left px-3 py-1.5 rounded-r-md text-[13px] transition-colors duration-100 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring";

// ── Collapsible Section ──

function SectionHeader({ 
  label, 
  isOpen, 
  onToggle, 
  action,
}: { 
  label: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between pl-3 pr-2 mb-1 group">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[11px] font-semibold text-text-tertiary tracking-wider uppercase hover:text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-sm"
        aria-expanded={isOpen}
      >
        <ChevronDown
          size={12}
          className={cn(
            "shrink-0 transition-transform duration-100",
            !isOpen && "-rotate-90"
          )}
        />
        {label}
      </button>
      {action && (
        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {action}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

export const Sidebar = memo(function Sidebar() {
  const { collections, loadCollections, createCollection } = useCollectionStore();
  const { tags, loadTags, createTag } = useTagStore();
  const selectedCollectionId = useUIStore((s) => s.selectedCollectionId);
  const selectCollection = useUIStore((s) => s.selectCollection);
  const selectedTagId = useUIStore((s) => s.selectedTagId);
  const selectTag = useUIStore((s) => s.selectTag);
  const smartFilter = useUIStore((s) => s.smartFilter);
  const selectSmartFilter = useUIStore((s) => s.selectSmartFilter);
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const { data: filterCounts } = useFilterCountsQuery();

  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Collapsible section state (persisted to localStorage)
  const [collectionsOpen, setCollectionsOpen] = useState(() => {
    try { return localStorage.getItem('ornas_sidebar_collections') !== 'false'; } catch { return true; }
  });
  const [tagsOpen, setTagsOpen] = useState(() => {
    try { return localStorage.getItem('ornas_sidebar_tags') !== 'false'; } catch { return true; }
  });

  useEffect(() => {
    loadCollections();
    loadTags();
  }, [loadCollections, loadTags]);

  useEffect(() => {
    try { localStorage.setItem('ornas_sidebar_collections', String(collectionsOpen)); } catch { /* */ }
  }, [collectionsOpen]);

  useEffect(() => {
    try { localStorage.setItem('ornas_sidebar_tags', String(tagsOpen)); } catch { /* */ }
  }, [tagsOpen]);

  const handleAddCollection = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCollectionName.trim()) {
      await createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setIsAddingCollection(false);
    } else if (e.key === 'Escape') {
      setIsAddingCollection(false);
      setNewCollectionName('');
    }
  };

  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagName.trim()) {
      await createTag(newTagName.trim());
      setNewTagName('');
      setIsAddingTag(false);
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTagName('');
    }
  };

  /** Whether a smart filter is the currently active selection (no collection/tag selected). */
  const isSmartFilterActive = (id: SmartFilter) =>
    smartFilter === id && selectedCollectionId === null && selectedTagId === null;

  return (
    <aside aria-label="Sidebar navigation" className="w-full h-full bg-sidebar flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto py-2">

        {/* ── Smart Filters ── */}
        <div className="px-2 space-y-0.5">
          {SMART_FILTERS.map(({ id, label, icon: Icon }) => {
            const count = filterCounts ? filterCounts[id] : undefined;
            const active = isSmartFilterActive(id);
            return (
              <button
                key={id}
                onClick={() => selectSmartFilter(id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  baseItemClass,
                  active ? activeItemClass : inactiveItemClass,
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "shrink-0",
                    active ? "text-primary" : "text-text-tertiary",
                  )}
                />
                <span className="flex-1 truncate text-left">{label}</span>
                {count !== undefined && (
                  <span className={cn(
                    "text-[11px] font-mono px-2 py-0.5 rounded-full transition-colors",
                    active ? "bg-primary/20 text-primary font-semibold" : "text-text-tertiary bg-white/10"
                  )}>
                    {count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Collections ── */}
        <div className="mt-4 px-2">
          <SectionHeader
            label="Collections"
            isOpen={collectionsOpen}
            onToggle={() => setCollectionsOpen(prev => !prev)}
            action={
              <button
                onClick={() => setIsAddingCollection(true)}
                className="p-1 rounded-md text-text-tertiary hover:bg-hover hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                aria-label="Add Collection"
              >
                <Plus size={13} />
              </button>
            }
          />
          {collectionsOpen && (
            <div className="space-y-0.5">
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => selectCollection(col.id)}
                  aria-current={selectedCollectionId === col.id ? 'page' : undefined}
                  className={cn(
                    baseItemClass,
                    selectedCollectionId === col.id ? activeItemClass : inactiveItemClass,
                  )}
                >
                  <Folder
                    size={16}
                    className={cn(
                      "shrink-0",
                      selectedCollectionId === col.id ? "text-primary" : "text-text-tertiary",
                    )}
                  />
                  <span className="truncate">{col.name}</span>
                </button>
              ))}
              {collections.length === 0 && !isAddingCollection && (
                <p className="px-3 py-1.5 text-[11px] text-text-tertiary">No collections yet</p>
              )}
              {isAddingCollection && (
                <div className="px-1 mt-1">
                  <input
                    autoFocus
                    type="text"
                    aria-label="New collection name"
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    onKeyDown={handleAddCollection}
                    onBlur={() => setIsAddingCollection(false)}
                    placeholder="Collection name…"
                    className="w-full px-2 py-1.5 text-xs bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Tags ── */}
        <div className="mt-4 px-2">
          <SectionHeader
            label="Tags"
            isOpen={tagsOpen}
            onToggle={() => setTagsOpen(prev => !prev)}
            action={
              <button
                onClick={() => setIsAddingTag(true)}
                className="p-1 rounded-md text-text-tertiary hover:bg-hover hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                aria-label="Add Tag"
              >
                <Plus size={13} />
              </button>
            }
          />
          {tagsOpen && (
            <div className="space-y-0.5">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => selectTag(tag.id)}
                  aria-current={selectedTagId === tag.id ? 'page' : undefined}
                  className={cn(
                    baseItemClass,
                    selectedTagId === tag.id ? activeItemClass : inactiveItemClass,
                  )}
                >
                  <Hash
                    size={16}
                    className={cn(
                      "shrink-0",
                      selectedTagId === tag.id ? "text-primary" : "text-text-tertiary",
                    )}
                  />
                  <span className="truncate">{tag.name}</span>
                </button>
              ))}
              {tags.length === 0 && !isAddingTag && (
                <p className="px-3 py-1.5 text-[11px] text-text-tertiary">No tags yet</p>
              )}
              {isAddingTag && (
                <div className="px-1 mt-1">
                  <input
                    autoFocus
                    type="text"
                    aria-label="New tag name"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={handleAddTag}
                    onBlur={() => setIsAddingTag(false)}
                    placeholder="Tag name…"
                    className="w-full px-2 py-1.5 text-xs bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── Settings (bottom-pinned) ── */}
      <div className="px-2 py-2 border-t border-border">
        <button
          onClick={toggleSettings}
          className="w-full text-left px-3 py-1.5 rounded-md text-[13px] text-text-secondary hover:bg-hover hover:text-text-primary transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
        >
          <Settings size={16} className="text-text-tertiary shrink-0" />
          Settings
          <kbd className="ml-auto text-[10px] text-text-tertiary font-medium">⌘,</kbd>
        </button>
      </div>
    </aside>
  );
});

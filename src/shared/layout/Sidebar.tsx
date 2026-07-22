import { useEffect, useState } from 'react';
import { useCollectionStore } from '../../stores/collection-store';
import { useTagStore } from '../../stores/tag-store';
import { useUIStore } from '../../stores/ui-store';
import { cn } from '../lib/utils';
import { Inbox, Hash, Plus, Settings, Folder } from 'lucide-react';

export function Sidebar() {
  const { collections, loadCollections, createCollection } = useCollectionStore();
  const { tags, loadTags, createTag } = useTagStore();
  const { 
    selectedCollectionId, selectCollection, 
    selectedTagId, selectTag,
    toggleSettings 
  } = useUIStore();

  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    loadCollections();
    loadTags();
  }, [loadCollections, loadTags]);

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

  return (
    <aside className="w-60 border-r border-border bg-app flex flex-col h-full overflow-hidden flex-shrink-0">
      <div className="flex-1 overflow-y-auto py-3 space-y-6">
        
        {/* All Items */}
        <div className="px-2">
          <button
            onClick={() => { selectCollection(null); selectTag(null); }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-[13px] transition-colors flex items-center gap-2",
              selectedCollectionId === null && selectedTagId === null
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "text-text-secondary hover:bg-hover hover:text-text-primary"
            )}
          >
            <Inbox size={16} className={cn("shrink-0", selectedCollectionId === null && selectedTagId === null ? "text-primary-foreground" : "")} />
            All Clips
          </button>
        </div>

        {/* Collections */}
        <div className="px-2">
          <div className="flex items-center justify-between px-2 mb-2 group">
            <span className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase">Collections</span>
            <button 
              onClick={() => setIsAddingCollection(true)}
              className="p-0.5 rounded-md text-text-tertiary hover:bg-hover hover:text-text-primary opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-all"
              aria-label="Add Collection"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => { selectCollection(col.id); selectTag(null); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-[13px] transition-colors flex items-center gap-2 group/item",
                  selectedCollectionId === col.id
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-text-secondary hover:bg-hover hover:text-text-primary"
                )}
              >
                <Folder size={14} className={cn("shrink-0", selectedCollectionId === col.id ? "text-primary-foreground" : "text-text-tertiary group-hover/item:text-text-secondary")} />
                <span className="truncate">{col.name}</span>
              </button>
            ))}
            {isAddingCollection && (
              <div className="px-1 mt-1 animate-in slide-in-from-top-2 fade-in duration-150">
                <input
                  autoFocus
                  type="text"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  onKeyDown={handleAddCollection}
                  onBlur={() => setIsAddingCollection(false)}
                  placeholder="Collection name..."
                  className="w-full px-2 py-1.5 text-xs bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-transparent focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="px-2">
          <div className="flex items-center justify-between px-2 mb-2 group">
            <span className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase">Tags</span>
            <button 
              onClick={() => setIsAddingTag(true)}
              className="p-0.5 rounded-md text-text-tertiary hover:bg-hover hover:text-text-primary opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-all"
              aria-label="Add Tag"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => { selectTag(tag.id); selectCollection(null); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-[13px] transition-colors flex items-center gap-2 group/item",
                  selectedTagId === tag.id
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-text-secondary hover:bg-hover hover:text-text-primary"
                )}
              >
                <Hash size={14} className={cn("shrink-0", selectedTagId === tag.id ? "text-primary-foreground" : "text-text-tertiary opacity-70 group-hover/item:text-text-secondary")} />
                <span className="truncate">{tag.name}</span>
              </button>
            ))}
            {isAddingTag && (
              <div className="px-1 mt-1 animate-in slide-in-from-top-2 fade-in duration-150">
                <input
                  autoFocus
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={() => setIsAddingTag(false)}
                  placeholder="Tag name..."
                  className="w-full px-2 py-1.5 text-xs bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-transparent focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="p-3">
        <button
          onClick={toggleSettings}
          className="w-full text-left px-3 py-2 rounded-md text-[13px] font-medium text-text-secondary hover:bg-hover hover:text-text-primary transition-colors flex items-center gap-2"
        >
          <Settings size={16} className="text-text-tertiary shrink-0" />
          Settings
        </button>
      </div>
    </aside>
  );
}

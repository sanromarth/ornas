import { useEffect, useState } from 'react';
import { useCollectionStore } from '../../stores/collection-store';
import { useTagStore } from '../../stores/tag-store';
import { useUIStore } from '../../stores/ui-store';
import { cn } from '../lib/utils';
import { Folder, Hash, Plus, Settings } from 'lucide-react';

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
    <aside className="w-48 border-r border-border bg-surface flex flex-col h-full overflow-hidden flex-shrink-0">
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        
        {/* All Items */}
        <div>
          <button
            onClick={() => { selectCollection(null); selectTag(null); }}
            className={cn(
              "w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
              selectedCollectionId === null && selectedTagId === null
                ? "bg-primary text-primary-foreground"
                : "text-text-secondary hover:bg-white/5"
            )}
          >
            <Folder size={14} />
            All Clips
          </button>
        </div>

        {/* Collections */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Collections</span>
            <button 
              onClick={() => setIsAddingCollection(true)}
              className="text-text-tertiary hover:text-text-primary transition-colors"
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
                  "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2",
                  selectedCollectionId === col.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-text-secondary hover:bg-white/5"
                )}
              >
                <Folder size={14} />
                {col.name}
              </button>
            ))}
            {isAddingCollection && (
              <input
                autoFocus
                type="text"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                onKeyDown={handleAddCollection}
                onBlur={() => setIsAddingCollection(false)}
                placeholder="New collection..."
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md text-text-primary focus:outline-none focus:border-primary"
              />
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Tags</span>
            <button 
              onClick={() => setIsAddingTag(true)}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5 flex flex-wrap gap-1 px-3">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => { selectTag(tag.id); selectCollection(null); }}
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                  selectedTagId === tag.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border text-text-secondary hover:border-primary/50"
                )}
              >
                <Hash size={10} />
                {tag.name}
              </button>
            ))}
            {isAddingTag && (
              <input
                autoFocus
                type="text"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={handleAddTag}
                onBlur={() => setIsAddingTag(false)}
                placeholder="New tag..."
                className="w-full mt-1 px-3 py-1 text-xs bg-background border border-border rounded-md text-text-primary focus:outline-none focus:border-primary"
              />
            )}
          </div>
        </div>

      </div>

      <div className="p-2 border-t border-border">
        <button
          onClick={toggleSettings}
          className="w-full text-left px-3 py-2 rounded-md text-sm text-text-secondary hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          <Settings size={14} />
          Settings
        </button>
      </div>
    </aside>
  );
}

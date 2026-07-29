import { memo } from 'react';
import { useUIStore } from '../../../stores/ui-store';
import { useCollectionStore } from '../../../stores/collection-store';
import { useTagStore } from '../../../stores/tag-store';
import { useFilterCountsQuery } from '../api/queries';
import { Star, Pin, Image as ImageIcon, Code, Link as LinkIcon, File as FileIcon, Folder, Hash, X } from 'lucide-react';
import { IconButton } from '../../../shared/components/IconButton';
import { cn } from '../../../shared/lib/utils';

export const FilterContextHeader = memo(function FilterContextHeader() {
  const smartFilter = useUIStore((s) => s.smartFilter);
  const selectedCollectionId = useUIStore((s) => s.selectedCollectionId);
  const selectedTagId = useUIStore((s) => s.selectedTagId);
  const selectSmartFilter = useUIStore((s) => s.selectSmartFilter);
  const { collections } = useCollectionStore();
  const { tags } = useTagStore();
  const { data: filterCounts } = useFilterCountsQuery();

  const isDefault = smartFilter === 'all' && selectedCollectionId === null && selectedTagId === null;
  if (isDefault) return null;

  let title = '';
  let Icon = Star;
  let count: number | undefined;

  if (selectedCollectionId !== null) {
    const col = collections.find(c => c.id === selectedCollectionId);
    title = col ? `Collection: ${col.name}` : 'Collection';
    Icon = Folder;
  } else if (selectedTagId !== null) {
    const tag = tags.find(t => t.id === selectedTagId);
    title = tag ? `Tag: ${tag.name}` : 'Tag';
    Icon = Hash;
  } else {
    switch (smartFilter) {
      case 'favorites':
        title = 'Favorites';
        Icon = Star;
        count = filterCounts?.favorites;
        break;
      case 'pinned':
        title = 'Pinned';
        Icon = Pin;
        count = filterCounts?.pinned;
        break;
      case 'images':
        title = 'Images';
        Icon = ImageIcon;
        count = filterCounts?.images;
        break;
      case 'code':
        title = 'Code';
        Icon = Code;
        count = filterCounts?.code;
        break;
      case 'links':
        title = 'Links';
        Icon = LinkIcon;
        count = filterCounts?.links;
        break;
      case 'files':
        title = 'Files';
        Icon = FileIcon;
        count = filterCounts?.files;
        break;
      default:
        break;
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1.5 bg-selection/50 border-b border-border text-xs text-text-primary animate-[ornas-fade-in_150ms_ease-out] shrink-0",
      )}
      data-testid="filter-context-header"
    >
      <div className="flex items-center gap-1.5 overflow-hidden font-medium">
        <Icon size={14} className="text-primary shrink-0" />
        <span className="truncate">{title}</span>
        {count !== undefined && (
          <span className="text-[11px] font-mono text-text-tertiary ml-1">
            ({count.toLocaleString()})
          </span>
        )}
      </div>
      <IconButton
        aria-label="Clear filter"
        onClick={() => selectSmartFilter('all')}
        className="h-5 w-5 min-w-[20px] min-h-[20px] text-text-tertiary hover:text-text-primary hover:bg-hover shrink-0"
      >
        <X size={12} />
      </IconButton>
    </div>
  );
});

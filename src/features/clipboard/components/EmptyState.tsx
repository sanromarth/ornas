/**
 * Clipboard-specific empty states.
 *
 * Two modes:
 *   isSearch=true  → No search results (transient, user-caused)
 *   isSearch=false → Clipboard is empty (onboarding moment)
 *
 * The empty-clipboard state is the first screen a new user sees after the
 * welcome overlay. It should feel calm and informative, not anxious.
 */

import { EmptyState as SharedEmptyState } from '../../../shared/components/EmptyState';
import { Clipboard, SearchX, Star, Pin, Image as ImageIcon, Code, Link, File } from 'lucide-react';
import { useUIStore, type SmartFilter } from '../../../stores/ui-store';

interface Props {
  isSearch?: boolean;
}

/** Minimal keyboard hint: "Ctrl C anywhere to start" */
function CopyHint() {
  return (
    <div className="flex items-center gap-1.5 text-text-tertiary mt-1">
      <span className="text-[12px]">Copy anything with</span>
      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-surface border border-border rounded shadow-sm">
        Ctrl
      </kbd>
      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-surface border border-border rounded shadow-sm">
        C
      </kbd>
    </div>
  );
}

export function EmptyState({ isSearch }: Props) {
  const smartFilter = useUIStore((s) => s.smartFilter);
  const selectSmartFilter = useUIStore((s) => s.selectSmartFilter);

  if (isSearch) {
    return (
      <div data-testid="empty-state" className="flex-1 animate-[ornas-fade-in_200ms_ease-out]">
        <SharedEmptyState
          icon={SearchX}
          title="No results"
          description="Try a different search term or clear your filters."
        />
      </div>
    );
  }

  // Contextual empty states based on smart filter
  const getFilterState = (filter: SmartFilter) => {
    switch (filter) {
      case 'favorites':
        return { icon: Star, title: "No favorites yet", desc: "Press F on any clip to favorite it." };
      case 'pinned':
        return { icon: Pin, title: "No pins yet", desc: "Press P on any clip to pin it to the top." };
      case 'images':
        return { icon: ImageIcon, title: "No images", desc: "Copied images will appear here." };
      case 'code':
        return { icon: Code, title: "No code snippets", desc: "Code copied from your IDE will appear here." };
      case 'links':
        return { icon: Link, title: "No links", desc: "Copied URLs will appear here." };
      case 'files':
        return { icon: File, title: "No files", desc: "Copied files and folders will appear here." };
      default:
        return { 
          icon: Clipboard, 
          title: "Nothing here yet", 
          desc: "Copy text, images, or files from any app and they'll appear here.",
          action: <CopyHint />
        };
    }
  };

  const state = getFilterState(smartFilter);

  return (
    <div data-testid="empty-state" className="flex-1 animate-[ornas-fade-in_200ms_ease-out]">
      <SharedEmptyState
        icon={state.icon}
        title={state.title}
        description={state.desc}
        action={
          <div className="flex flex-col items-center gap-2">
            {state.action}
            {smartFilter !== 'all' && (
              <button 
                onClick={() => selectSmartFilter('all')}
                className="text-xs text-primary hover:underline mt-2"
              >
                Clear filter
              </button>
            )}
          </div>
        }
      />
    </div>
  );
}

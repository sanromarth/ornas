import { EmptyState as SharedEmptyState } from '../../../shared/components/EmptyState';
import { Clipboard, SearchX } from 'lucide-react';

interface Props {
  isSearch?: boolean;
}

export function EmptyState({ isSearch }: Props) {
  return (
    <div data-testid="empty-state" className="flex-1">
      {isSearch ? (
        <SharedEmptyState
          icon={SearchX}
          title="No results found"
          description="We couldn't find any clips matching your search query."
        />
      ) : (
        <SharedEmptyState
          icon={Clipboard}
          title="Clipboard is empty"
          description="Copy text or images from any application and they will appear here."
        />
      )}
    </div>
  );
}

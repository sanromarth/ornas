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
          action={
            <div className="flex items-center gap-1 mt-2 text-text-tertiary">
              <span className="text-xs">Press</span>
              <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium font-sans uppercase bg-surface border border-border rounded shadow-sm">Ctrl</kbd>
              <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium font-sans uppercase bg-surface border border-border rounded shadow-sm">C</kbd>
              <span className="text-xs">anywhere to start</span>
            </div>
          }
        />
      )}
    </div>
  );
}

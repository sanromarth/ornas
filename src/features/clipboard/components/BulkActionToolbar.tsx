import { memo } from 'react';
import { useUIStore } from '../../../stores/ui-store';
import { Trash2, Star, Pin, X } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DeleteDialog } from './DeleteDialog';
import { useState } from 'react';

export const BulkActionToolbar = memo(function BulkActionToolbar() {
  const selectedClipIds = useUIStore((s) => s.selectedClipIds);
  const setSelectedClipIds = useUIStore((s) => s.setSelectedClipIds);
  const queryClient = useQueryClient();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const count = selectedClipIds.size;
  const ids = Array.from(selectedClipIds);

  const clearSelection = () => {
    setSelectedClipIds(new Set());
  };

  const deleteMutation = useMutation({
    mutationFn: async () => invoke('bulk_delete_clips', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      clearSelection();
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (favorite: boolean) => invoke('bulk_set_favorite', { ids, favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      clearSelection();
    },
  });

  const pinMutation = useMutation({
    mutationFn: async (pinned: boolean) => invoke('bulk_set_pinned', { ids, pinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      clearSelection();
    },
  });

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[ornas-fade-in_200ms_ease-out]">
      <div className="bg-surface border border-border shadow-2xl rounded-full px-4 py-2 flex items-center gap-4">
        <span className="text-sm font-medium text-text-secondary px-2">
          {count} selected
        </span>
        
        <div className="w-px h-5 bg-border mx-1"></div>
        
        <button
          onClick={() => favoriteMutation.mutate(true)}
          className="p-2 text-text-tertiary hover:text-primary hover:bg-hover rounded-full transition-colors"
          title="Favorite selected"
        >
          <Star size={18} />
        </button>
        
        <button
          onClick={() => pinMutation.mutate(true)}
          className="p-2 text-text-tertiary hover:text-primary hover:bg-hover rounded-full transition-colors"
          title="Pin selected"
        >
          <Pin size={18} />
        </button>
        
        <button
          onClick={() => setIsConfirmingDelete(true)}
          className="p-2 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
          title="Delete selected"
        >
          <Trash2 size={18} />
        </button>
        
        <div className="w-px h-5 bg-border mx-1"></div>
        
        <button
          onClick={clearSelection}
          className="p-2 text-text-tertiary hover:text-text-primary hover:bg-hover rounded-full transition-colors"
          title="Clear selection (Esc)"
        >
          <X size={18} />
        </button>
      </div>
      
      {isConfirmingDelete && (
        <DeleteDialog
          open={true}
          item={count}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </div>
  );
});

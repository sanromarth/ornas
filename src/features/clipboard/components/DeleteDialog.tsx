import { Dialog } from '../../../shared/components/Dialog';
import { Button } from '../../../shared/components/Button';
import { Trash2 } from 'lucide-react';
import type { ClipDto } from '../../../shared/types';

interface DeleteDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Pass a single ClipDto if deleting one, or a number if deleting multiple. */
  item: ClipDto | number;
}

export function DeleteDialog({ open, onConfirm, onCancel, item }: DeleteDialogProps) {
  const isBulk = typeof item === 'number';
  const count = isBulk ? item : 1;
  const singleClip = !isBulk ? (item as ClipDto) : null;

  // Generate an elegant summary string for single items
  let summary = '';
  let contentPreview = '';
  
  if (singleClip) {
    const typeLabel = singleClip.content_type === 'text' ? 'Text' 
                    : singleClip.content_type === 'image' ? 'Image' 
                    : singleClip.content_type === 'file' ? 'File' 
                    : singleClip.content_type;
                    
    const dateStr = new Date(singleClip.created_at * 1000).toLocaleString(undefined, { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
    });

    let sizeStr = '';
    if (singleClip.content_type === 'image' && singleClip.image_path) {
      sizeStr = 'Image file';
    } else if (singleClip.content_type === 'file' && singleClip.files && singleClip.files.length > 0) {
      sizeStr = `${singleClip.files.length} file(s)`;
    } else {
      const len = (singleClip.content_text || '').length;
      sizeStr = `${len} chars`;
    }

    summary = `${typeLabel} • ${dateStr} • ${sizeStr}`;
    
    // Truncate to 3 lines max
    contentPreview = (singleClip.content_text || singleClip.preview || '')
      .split('\n')
      .slice(0, 3)
      .join('\n');
      
    if ((singleClip.content_text || '').split('\n').length > 3 || contentPreview.length > 150) {
      contentPreview = contentPreview.substring(0, 150) + '...';
    }
  }

  return (
    <Dialog
      isOpen={open}
      onClose={onCancel}
      title={isBulk ? `Delete ${count} items?` : 'Delete clip?'}
      closeOnBackdropClick={false}
      hideClose={true}
      className="max-w-[420px]"
    >
      <div className="flex flex-col p-6 gap-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-danger/10 text-danger shrink-0">
            <Trash2 size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-outfit text-[17px] font-semibold text-text-primary tracking-wide leading-tight">
              {isBulk ? `Delete ${count} clipboard items?` : 'Delete this clip?'}
            </h2>
            <p className="text-text-tertiary text-[13px] mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {!isBulk && singleClip && (
          <div className="flex flex-col pl-[52px] gap-2">
            <div className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">
              {summary}
            </div>
            {contentPreview && (
              <div className="p-3 bg-surface border border-border rounded-md">
                <pre className="text-[12px] text-text-secondary font-sans whitespace-pre-wrap break-words leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {contentPreview}
                </pre>
              </div>
            )}
          </div>
        )}

        {isBulk && (
          <div className="pl-[52px] text-[14px] text-text-secondary leading-relaxed">
            Are you sure you want to permanently delete {count} selected items from your history?
          </div>
        )}

        <div className="h-px bg-border my-1" />

        <div className="flex items-center justify-end gap-3 mt-1">
          <Button variant="secondary" onClick={onCancel} autoFocus>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            Delete {isBulk ? 'All' : ''}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

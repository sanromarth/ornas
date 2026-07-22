import { Dialog } from './Dialog';
import { Button } from './Button';

interface Props {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: Props) {
  return (
    <Dialog isOpen={open} onClose={onCancel} title={title}>
      <div className="flex flex-col gap-6">
        <p className="text-[15px] leading-relaxed text-text-secondary">{description}</p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

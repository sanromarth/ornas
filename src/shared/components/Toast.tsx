import { useEffect, useRef, useState } from 'react';
import { useToast, type ToastMessage } from './useToast';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { IconButton } from './IconButton';

const variantConfig = {
  success: { icon: CheckCircle, className: 'text-success', borderClass: 'border-l-success' },
  warning: { icon: AlertTriangle, className: 'text-warning', borderClass: 'border-l-warning' },
  info: { icon: Info, className: 'text-info', borderClass: 'border-l-info' },
  error: { icon: XCircle, className: 'text-danger', borderClass: 'border-l-danger' },
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300); // Wait for slow exit animation
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHovered, toast.id, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 100); // Wait for fast close animation
  };

  const { icon: Icon, className, borderClass } = variantConfig[toast.variant];

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'pointer-events-auto flex w-full max-w-[360px] items-start gap-3 rounded-lg border border-border border-l-[3px] bg-surface px-4 py-3 shadow-lg',
        borderClass,
        'transition-all duration-200 ease-[var(--ease-snappy)]',
        isExiting ? 'opacity-0 scale-95 duration-100 ease-out' : 'starting:translate-y-2 starting:opacity-0 opacity-100 scale-100'
      )}
    >
      <Icon className={cn('mt-0.5 shrink-0', className)} size={18} />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.description && <p className="text-sm text-text-secondary">{toast.description}</p>}
      </div>
      <IconButton
        aria-label="Close"
        onClick={handleClose}
        className="shrink-0 text-text-secondary hover:text-text-primary"
      >
        <X size={16} />
      </IconButton>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div 
      aria-live="polite" 
      className="fixed bottom-0 right-0 z-toast flex max-h-screen w-full flex-col-reverse items-end justify-bottom gap-2 p-4 sm:flex-col md:max-w-[420px] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

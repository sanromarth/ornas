import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
  className?: string;
  hideClose?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdropClick = true,
  className,
  hideClose = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Small delay to ensure DOM is painted before we transition to visible
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 100); // Fast duration (100ms) for close
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isVisible) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        dialogRef.current?.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'Tab' && focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousFocusRef.current?.focus();
      };
    }
  }, [isVisible, onClose]);

  if (!isRendered) return null;

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 z-dialog flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity",
        isVisible ? "opacity-100 duration-200 ease-[var(--ease-snappy)]" : "opacity-0 duration-100 ease-out"
      )}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex w-full max-w-[420px] flex-col rounded-lg border border-border bg-surface shadow-2xl outline-none",
          "transition-all",
          isVisible ? "opacity-100 scale-100 duration-200 ease-[var(--ease-snappy)]" : "opacity-0 scale-95 duration-100 ease-out",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {hideClose ? (
          children
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 id={titleId} className="font-outfit text-lg font-semibold text-text-primary tracking-wide">
                {title}
              </h2>
              <IconButton 
                aria-label="Close dialog" 
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={18} />
              </IconButton>
            </div>
            <div className="p-6">
              {children}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

import { create } from 'zustand';

export type ToastVariant = 'success' | 'warning' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      const id = Math.random().toString(36).slice(2, 9);
      const newToasts = [...state.toasts, { ...toast, id }];
      if (newToasts.length > 3) {
        newToasts.shift();
      }
      return { toasts: newToasts };
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

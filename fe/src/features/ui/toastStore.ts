import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: 'default' | 'success' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    window.setTimeout(() => {
      get().dismissToast(id);
    }, 5000);

    return id;
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

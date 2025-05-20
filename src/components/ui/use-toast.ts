import { useState } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
  visible: boolean;
}

interface UseToastReturn {
  toasts: Toast[];
  toast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      visible: true,
      duration: 5000, // Default duration
      variant: 'default', // Default variant
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after duration
    setTimeout(() => {
      dismissToast(id);
    }, newToast.duration);

    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );

    // Remove from state after animation (300ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  return { toasts, toast, dismissToast };
};

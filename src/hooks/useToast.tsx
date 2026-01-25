import { useState, useCallback } from 'react';
import type { ToastMessage } from '../interfaces';
import Toast from '../components/custom/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string, duration?: number) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, message, duration };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  );

  return {
    toast: {
      success: (message: string, duration?: number) => addToast('success', message, duration),
      error: (message: string, duration?: number) => addToast('error', message, duration),
      info: (message: string, duration?: number) => addToast('info', message, duration),
      warning: (message: string, duration?: number) => addToast('warning', message, duration),
    },
    ToastContainer,
  };
};

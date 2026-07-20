import { useState, useCallback, useRef } from 'react';
import type { ToastMessage } from '../interfaces';
import Toast from '../components/custom/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const seqRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], message: string, duration?: number) => {
    // unique id (Date.now alone can collide when two toasts fire in the same ms)
    const id = `${Date.now()}-${seqRef.current++}`;
    const newToast: ToastMessage = { id, type, message, duration };
    setToasts((prev) => [...prev, newToast]);
    // Auto-dismiss at the HOOK level (independent of the Toast component's own
    // mount timer) so it always closes even if <ToastContainer /> re-mounts on
    // parent re-renders.
    const ms = duration ?? 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ms);
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

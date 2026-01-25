import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import type { DialogProps } from '../../interfaces';

interface ExtendedDialogProps extends DialogProps {
  type?: 'info' | 'warning' | 'success' | 'error';
}

const Dialog = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'info'
}: ExtendedDialogProps) => {
  if (!isOpen) return null;

  const icons = {
    info: <Info className="w-12 h-12 text-blue-500" />,
    warning: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    error: <XCircle className="w-12 h-12 text-red-500" />
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        {/* Dialog */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex flex-col items-center text-center">
            {icons[type]}
            <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>

            <div className="mt-6 flex gap-3 w-full">
              {onConfirm && (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                  >
                    {confirmText}
                  </button>
                </>
              )}
              {!onConfirm && (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  {confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dialog;

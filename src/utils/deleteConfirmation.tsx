import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          हटवण्याची पुष्टी (Confirm Delete)
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          तुम्हाला खात्री आहे की तुम्हाला हा रेकॉर्ड हटवायचा आहे का?
          <br />
          Are you sure you want to delete this record?
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            रद्द करा (Cancel)
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            हटवा (Delete)
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing delete confirmation state
export const useDeleteConfirmation = () => {
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    show: boolean;
    index: number | null;
  }>({ show: false, index: null });

  const handleDeleteClick = (index: number) => {
    setDeleteConfirmation({ show: true, index });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, index: null });
  };

  const resetDeleteConfirmation = () => {
    setDeleteConfirmation({ show: false, index: null });
  };

  return {
    deleteConfirmation,
    handleDeleteClick,
    cancelDelete,
    resetDeleteConfirmation,
  };
};

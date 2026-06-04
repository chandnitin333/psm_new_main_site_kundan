import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/common/Modal';
import { Upload, X } from 'lucide-react';
import type { ImageUploadModalProps } from '../../../interfaces/dashboard/malmatta-nodni/ImageUploadModal.types';

const ImageUploadModal = ({ isOpen, onClose, onSave, khatedharkacheNav, existingImageUrl }: ImageUploadModalProps) => {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    khatedharkacheNav: khatedharkacheNav,
    imageFile: null as File | null,
    imagePreview: null as string | null,
  });

  // Update form data when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      khatedharkacheNav,
    }));
  }, [khatedharkacheNav]);

  // Auto-focus on first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('कृपया फक्त इमेज फाइल निवडा (Please select only image files)');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
    }));
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!formData.imageFile) {
      alert('कृपया इमेज निवडा (Please select an image)');
      return;
    }
    onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      khatedharkacheNav: '',
      imageFile: null,
      imagePreview: null,
    });
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="इमेज अपलोड (Image Upload)"
      size="medium"
      footer={
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            जतन करा (Save)
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            रद्द करा (Cancel)
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Khatedharkache Nav Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            खातेदाराचे नाव (Khedekar Name)
          </label>
          <input
            type="text"
            name="khatedharkacheNav"
            ref={firstInputRef}
            value={formData.khatedharkacheNav}
            onChange={handleInputChange}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
            placeholder="खातेदाराचे नाव"
          />
        </div>

        {/* Current Image (if exists) */}
        {existingImageUrl && !formData.imagePreview && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              सध्याची इमेज (Current Image)
            </label>
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <img
                src={existingImageUrl}
                alt="Current"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* Image Upload Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            इमेज अपलोड (Upload Image)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(106,115,55)] text-white rounded-lg hover:bg-[rgb(86,95,35)] transition-colors cursor-pointer font-medium"
            >
              <Upload className="w-5 h-5" />
              इमेज निवडा (Choose Image)
            </label>
            {formData.imageFile && (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {formData.imageFile.name}
              </span>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {formData.imagePreview && (
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                इमेज पूर्वावलोकन (Image Preview)
              </label>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                काढा (Remove)
              </button>
            </div>
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <img
                src={formData.imagePreview}
                alt="Preview"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImageUploadModal;

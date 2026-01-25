export interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { khatedharkacheNav: string; imageFile: File | null; imagePreview: string | null }) => void;
  khatedharkacheNav: string;
}

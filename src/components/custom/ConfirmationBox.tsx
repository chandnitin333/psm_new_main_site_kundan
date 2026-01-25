import Dialog from './Dialog';

interface ConfirmationBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationBox = (props: ConfirmationBoxProps) => {
  return <Dialog {...props} type="warning" />;
};

export default ConfirmationBox;

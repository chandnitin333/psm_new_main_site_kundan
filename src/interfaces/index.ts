// Common Interfaces
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  mobileNumber: string;
  designation: string;
  district: string;
  taluka: string;
  gramPanchayat: string;
  gatGramPanchayat?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// API Login Types
export type UserType = 'user' | 'bdo';

export interface LoginPayload {
  email: string;
  password: string;
  user_type: UserType;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    user_type: UserType;
    mobile?: string;
  };
  access_token: string;
  refresh_token?: string;
  loader_config?: {
    type: string;
    color: string;
  };
}

export interface OtpVerifyPayload {
  email: string;
  otp: string;
  user_type: UserType;
}

export interface OtpVerifyResponse {
  user: {
    id: string;
    email: string;
    name: string;
    user_type: UserType;
  };
  access_token: string;
  refresh_token?: string;
  loader_config?: {
    type: string;
    color: string;
  };
}

export interface RegisterData extends Omit<User, 'id'> {
  password: string;
  confirmPassword: string;
}

export interface Location {
  id: string;
  name: string;
  parentId?: string;
}

export interface District extends Location {}
export interface Taluka extends Location {}
export interface GramPanchayat extends Location {}
export interface GatGramPanchayat extends Location {}

export interface TeamMember {
  id: string;
  name: string;
  profession: string;
  image: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  profession: string;
  contact: string;
  email: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  subMenus?: SubMenuItem[];
}

export interface SubMenuItem {
  id: string;
  label: string;
  path: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface ImagePreviewProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
}

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
export type UserType = 'user' | 'bdo' | 'super_user' | 'citizen';

export interface LoginPayload {
  email: string;
  password: string;
  user_type: UserType;
}

// Full user data returned from API
export interface ApiUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  mobile_no?: string;
  aadhar_card_no?: string;
  pan_card_no?: string;
  address?: string;
  profile_image?: string | null;
  district_id?: number;
  taluka_id?: number;
  gram_panchayat_id?: number;
  gat_gram_panchayat_id?: number;
  designation_id?: number;
  district?: string;
  taluka?: string;
  gram_panchayat?: string;
  gat_gram_panchayat?: string;
  designation?: string;
  /** citizen still on the shared default password — must change it on first login */
  must_change_password?: boolean;
  permissions?: Array<{
    id: number;
    name: string;
    url: string;
    description?: string;
    icon?: string;
    sequence_order?: number;
    is_in_header?: number;
    access_flag?: string;
  }>;
}

export interface LoginResponse {
  // When OTP is enabled - returns user_id for OTP verification
  user_id?: number;
  email?: string;
  otp_sent?: boolean;
  otp_enabled?: boolean;
  // When OTP is disabled or for admin - returns full user data and tokens
  user?: ApiUser;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

export interface OtpVerifyPayload {
  user_id: number;
  otp: string;
}

export interface OtpVerifyResponse {
  user: ApiUser;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
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

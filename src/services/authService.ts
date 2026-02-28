/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { api, type ApiResponse, type ApiError } from './api';
import type {
  LoginPayload,
  LoginResponse,
  OtpVerifyPayload,
  OtpVerifyResponse,
  User,
  UserType,
} from '../interfaces';

// API Endpoints
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  VERIFY_OTP: '/auth/verify-otp',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  USER_ROLE: 'userRole',
  IS_AUTHENTICATED: 'isAuthenticated',
} as const;

/**
 * Map frontend role to API user_type
 */
export const mapRoleToUserType = (role: 'grampanchayat' | 'bdo'): UserType => {
  return role === 'grampanchayat' ? 'user' : 'bdo';
};

/**
 * Map API user_type to frontend role
 */
export const mapUserTypeToRole = (userType: UserType): 'grampanchayat' | 'bdo' => {
  return userType === 'user' ? 'grampanchayat' : 'bdo';
};

export const authService = {
  /**
   * Login with email, password, and user type
   */
  login: async (
    email: string,
    password: string,
    role: 'grampanchayat' | 'bdo'
  ): Promise<ApiResponse<LoginResponse>> => {
    const payload: LoginPayload = {
      email,
      password,
      user_type: mapRoleToUserType(role),
    };

    try {
      const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, payload);
      return response;
    } catch (error) {
      throw error as ApiError;
    }
  },

  /**
   * Verify OTP after login
   */
  verifyOtp: async (
    userId: number,
    otp: string,
    role: 'grampanchayat' | 'bdo'
  ): Promise<ApiResponse<OtpVerifyResponse>> => {
    const payload: OtpVerifyPayload = {
      user_id: userId,
      otp,
    };

    try {
      const response = await api.post<OtpVerifyResponse>(AUTH_ENDPOINTS.VERIFY_OTP, payload);

      // Store auth data on successful OTP verification
      if (response.success && response.data) {
        authService.setAuthData(response.data, role);
      }

      return response;
    } catch (error) {
      throw error as ApiError;
    }
  },

  /**
   * Store authentication data in localStorage
   */
  setAuthData: (data: OtpVerifyResponse | LoginResponse, role: 'grampanchayat' | 'bdo'): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token as string);
    if (data.refresh_token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    }
    if (data.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    }
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
  },

  /**
   * Clear all authentication data
   */
  clearAuthData: (): void => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      // Call logout API if needed
      await api.post(AUTH_ENDPOINTS.LOGOUT);
    } catch {
      // Ignore errors during logout
    } finally {
      authService.clearAuthData();
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  },

  /**
   * Get current user from storage
   */
  getCurrentUser: (): Partial<User> | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Get current user role
   */
  getUserRole: (): 'grampanchayat' | 'bdo' | null => {
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    return role as 'grampanchayat' | 'bdo' | null;
  },

  /**
   * Get access token
   */
  getAccessToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Forgot password - send reset link
   */
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    try {
      return await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
    } catch (error) {
      throw error as ApiError;
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<ApiResponse> => {
    try {
      return await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
        token,
        new_password: newPassword,
      });
    } catch (error) {
      throw error as ApiError;
    }
  },
};

export default authService;

/**
 * API Service - Centralized HTTP client
 * Handles all API requests with consistent error handling and interceptors
 */

import { config } from '../config';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  success: false;
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Request configuration
interface RequestConfig extends RequestInit {
  timeout?: number;
}

/**
 * Creates a fetch request with timeout support
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestConfig = {}
): Promise<Response> => {
  const { timeout = config.api.timeout, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Get authorization headers
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  // super_user: tell the backend which gram panchayat to operate on
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.user_type === 'super_user') {
      const gp = JSON.parse(localStorage.getItem('activeGp') || 'null');
      if (gp?.gram_panchayat_id) headers['X-Active-Gp'] = String(gp.gram_panchayat_id);
    }
  } catch {
    // ignore — no active GP header
  }
  return headers;
};

/**
 * Build full URL with base
 */
const buildUrl = (endpoint: string): string => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

/**
 * Handle API response
 */
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');

  let data: ApiResponse<T>;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = {
      success: response.ok,
      message: text || response.statusText,
    };
  }

  if (!response.ok) {
    throw {
      success: false,
      message: data.message || 'An error occurred',
      status: response.status,
      errors: data.errors,
    } as ApiError;
  }

  return data;
};

/**
 * Handle API errors
 */
const handleError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Request timeout. Please try again.',
        status: 408,
      };
    }
    return {
      success: false,
      message: error.message || 'Network error. Please check your connection.',
      status: 0,
    };
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    return error as ApiError;
  }

  return {
    success: false,
    message: 'An unexpected error occurred',
    status: 500,
  };
};

/**
 * API Client
 */
export const api = {
  /**
   * GET request
   */
  get: async <T>(endpoint: string, options?: RequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await fetchWithTimeout(buildUrl(endpoint), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
        ...options,
      });
      return handleResponse<T>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * POST request
   */
  post: async <T>(
    endpoint: string,
    body?: unknown,
    options?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetchWithTimeout(buildUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });
      return handleResponse<T>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * PUT request
   */
  put: async <T>(
    endpoint: string,
    body?: unknown,
    options?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetchWithTimeout(buildUrl(endpoint), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });
      return handleResponse<T>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * PATCH request
   */
  patch: async <T>(
    endpoint: string,
    body?: unknown,
    options?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetchWithTimeout(buildUrl(endpoint), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });
      return handleResponse<T>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * DELETE request
   */
  delete: async <T>(endpoint: string, options?: RequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await fetchWithTimeout(buildUrl(endpoint), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
        ...options,
      });
      return handleResponse<T>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Upload file(s) with multipart/form-data
   */
  upload: async <T>(
    endpoint: string,
    formData: FormData,
    options?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetchWithTimeout(buildUrl(endpoint), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
        ...options,
      });
      return handleResponse<T>(response);
    } catch (error) {
      throw handleError(error);
    }
  },
};

export default api;

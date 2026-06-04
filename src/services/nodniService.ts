/**
 * Nodni Service
 * Handles all Nodni form related API calls
 */

import { api, type ApiResponse } from './api';

const NODNI_ENDPOINTS = {
  CREATE: '/main/nodni',
  UPDATE: (id: number) => `/main/nodni/${id}`,
  GET_BY_ID: (id: number) => `/main/nodni/${id}`,
  TAX_LIST: '/main/nodni/tax-list',
  SEARCH: '/main/malmatta-nodni/search',
  FILTER: '/main/malmatta-nodni/filter',
  CHECK_SILLAK_JODA: '/main/malmatta-nodni/previous-tax/check-sillak-joda-exist',
  CREATE_PREVIOUS_TAX: '/main/malmatta-nodni/previous-tax',
  UPDATE_PREVIOUS_TAX: (id: number) => `/main/malmatta-nodni/previous-tax/${id}`,
  KHULA_BHUKHAND: '/main/khuld-bhukhand-kar-aakrani',
  BANDKAM: '/main/bandkamachi-kar-aakarani',
  MANORYACHE: '/main/manoryache-kar-aakarani',
  UPLOAD_IMAGE: '/main/malmatta-nodni/images/upload',
  GET_IMAGES_BY_NODNI: (nodniId: number) => `/main/malmatta-nodni/images/nodni/${nodniId}`,
} as const;

export const nodniService = {
  /**
   * Create a new nodni record
   */
  create: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.CREATE, payload);
  },

  /**
   * Update an existing nodni record
   */
  update: async (id: number, payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.put(NODNI_ENDPOINTS.UPDATE(id), payload);
  },

  /**
   * Get nodni record by ID
   */
  getById: async (id: number): Promise<ApiResponse> => {
    return api.get(NODNI_ENDPOINTS.GET_BY_ID(id));
  },

  /**
   * Fetch tax list for location
   */
  getTaxList: async (payload: {
    district_id: number;
    taluka_id: number;
    gram_panchayat_id: number;
    gat_gram_panchayat_id: number;
  }): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.TAX_LIST, payload);
  },

  /**
   * Search malmatta nodni records
   */
  search: async (payload: { page: number; per_page: number; search?: string }): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.SEARCH, payload);
  },

  /**
   * Filter malmatta nodni records by individual fields
   */
  filter: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.FILTER, payload);
  },

  /**
   * Check if sillak joda (previous tax) record exists
   */
  checkSillakJodaExist: async (payload: {
    nodni_id: number;
    user_id?: number;
    year: string;
  }): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.CHECK_SILLAK_JODA, payload);
  },

  /**
   * Create a new previous tax record
   */
  createPreviousTax: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.CREATE_PREVIOUS_TAX, payload);
  },

  /**
   * Update an existing previous tax record
   */
  updatePreviousTax: async (id: number, payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.put(NODNI_ENDPOINTS.UPDATE_PREVIOUS_TAX(id), payload);
  },

  /**
   * Create a khula bhukhand kar aakarani record
   */
  createKhulaBhukhand: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.KHULA_BHUKHAND, payload);
  },

  /**
   * Create a bandkamachi kar aakarani record
   */
  createBandkam: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.BANDKAM, payload);
  },

  /**
   * Create a manoryache kar aakarani record
   */
  createManoryache: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.MANORYACHE, payload);
  },

  /**
   * Search nodni record by anu_kramank and ward_kramnak (for ferfar form auto-fill)
   */
  searchNodniForFerfar: async (anuKramank: string, wardKramnak: string): Promise<ApiResponse> => {
    return api.post('/main/malmatta-ferfar/search-nodni', { anu_kramank: anuKramank, ward_kramnak: wardKramnak });
  },

  /**
   * Delete a nodni record
   */
  delete: async (id: number): Promise<ApiResponse> => {
    return api.delete(NODNI_ENDPOINTS.UPDATE(id));
  },

  /**
   * Get images for a specific nodni record
   */
  getImagesByNodni: async (nodniId: number): Promise<ApiResponse> => {
    return api.get(NODNI_ENDPOINTS.GET_IMAGES_BY_NODNI(nodniId));
  },

  /**
   * Upload an image for a nodni record
   */
  uploadImage: async (nodniId: number, imageFile: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('nodni_id', String(nodniId));
    formData.append('image', imageFile);
    return api.upload(NODNI_ENDPOINTS.UPLOAD_IMAGE, formData);
  },
};

export default nodniService;

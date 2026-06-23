/**
 * Nodni Service
 * Handles all Nodni form related API calls
 */

import { api, type ApiResponse } from './api';

export interface DuplicateMatch {
  id: number;
  anu_kramank: string | null;
  malmatta_number: string | null;
  ward_kramnak: string | null;
  ghar_malkache_nav: string | null;
  bhogavat_darache_nav: string | null;
  mobile_number: string | null;
  match_reasons: string[];
}

export interface PropertyHistory {
  property: Record<string, string | number | null>;
  transfers: {
    id: number; year: string | null; to_year: string | null; dinank_date: string | null;
    tharav_kramnak: string | null; from_name: string | null; to_name: string | null;
    shera_tip: string | null; created_at: string | null;
  }[];
  vasuli: { id: number; year: string; magni: number; jama: number; baki: number; payment_count: number }[];
  certificates: {
    id: number; cert_type: string; cert_name: string; applicant_name: string;
    outward_no: string | null; created_at: string | null;
  }[];
}

const NODNI_ENDPOINTS = {
  CREATE: '/main/nodni',
  UPDATE: (id: number) => `/main/nodni/${id}`,
  GET_BY_ID: (id: number) => `/main/nodni/${id}`,
  CHALU_KHATEDAR: '/main/nodni/chalu-khatedar',
  DASHBOARD_COUNTS: '/main/nodni/dashboard-counts',
  DHARKACHI_YADI: '/main/nodni/dharkachi-yadi',
  TAX_LIST: '/main/nodni/tax-list',
  NEXT_ANU_KRAMANK: '/main/nodni/next-anu-kramank',
  CHECK_DUPLICATE: '/main/nodni/check-duplicate',
  HISTORY: (id: number) => `/main/nodni/${id}/history`,
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
  /**
   * Ward-wise next अनु क्रमांक (last entry for the ward + 1)
   */
  getNextAnuKramank: async (
    ward: string | number,
  ): Promise<ApiResponse<{ next_anu_kramank: number; last_anu_kramank: number }>> => {
    return api.get(`${NODNI_ENDPOINTS.NEXT_ANU_KRAMANK}?ward=${encodeURIComponent(String(ward))}`);
  },

  create: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(NODNI_ENDPOINTS.CREATE, payload);
  },

  /**
   * Soft duplicate check before saving a property. Returns matching records
   * (with match_reasons) so the form can warn — never blocks.
   */
  checkDuplicate: async (payload: {
    malmatta_number?: string;
    ward_kramnak?: string | number;
    anu_kramank?: string | number;
    mobile_number?: string;
    ghar_malkache_nav?: string;
    exclude_id?: number;
  }): Promise<ApiResponse<{ duplicates: DuplicateMatch[] }>> => {
    return api.post(NODNI_ENDPOINTS.CHECK_DUPLICATE, payload);
  },

  /**
   * Update an existing nodni record
   */
  update: async (id: number, payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.put(NODNI_ENDPOINTS.UPDATE(id), payload);
  },

  /** Property 360° — full history (transfers + year-wise vasuli + certificates) */
  getHistory: async (id: number): Promise<ApiResponse<PropertyHistory>> => {
    return api.get(NODNI_ENDPOINTS.HISTORY(id));
  },

  /**
   * Get nodni record by ID
   */
  getById: async (id: number): Promise<ApiResponse> => {
    return api.get(NODNI_ENDPOINTS.GET_BY_ID(id));
  },

  /**
   * चालू खातेदार — active account holders (all properties) for the logged-in user
   */
  getChaluKhatedar: async (prakar?: string): Promise<ApiResponse> => {
    const qs = prakar ? `?prakar=${encodeURIComponent(prakar)}` : '';
    return api.get(`${NODNI_ENDPOINTS.CHALU_KHATEDAR}${qs}`);
  },

  /**
   * Dashboard category counts (one query)
   */
  getDashboardCounts: async (): Promise<ApiResponse> => {
    return api.get(NODNI_ENDPOINTS.DASHBOARD_COUNTS);
  },

  /**
   * मालमत्ता धारकाची यादी — ward-wise list of properties with full नमुना ८ detail
   */
  getDharkachiYadi: async (
    ward?: string | number,
    start?: string | number,
    end?: string | number,
    type?: string,
    year?: string | number,
  ): Promise<ApiResponse> => {
    const params = new URLSearchParams();
    if (ward !== undefined && ward !== '') params.append('ward', String(ward));
    if (start !== undefined && start !== '') params.append('start', String(start));
    if (end !== undefined && end !== '') params.append('end', String(end));
    if (type !== undefined && type !== '') params.append('type', type);
    if (year !== undefined && year !== '') params.append('year', String(year));
    const qs = params.toString();
    return api.get(qs ? `${NODNI_ENDPOINTS.DHARKACHI_YADI}?${qs}` : NODNI_ENDPOINTS.DHARKACHI_YADI);
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

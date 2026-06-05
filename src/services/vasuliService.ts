/**
 * Vasuli Service
 * Handles vasuli form related API calls
 */

import { api, type ApiResponse } from './api';

const VASULI_ENDPOINTS = {
  AUTOFILL: '/main/vasuli/autofill',
  LIST: '/main/vasuli/list',
  CREATE: '/main/vasuli',
  UPDATE: (id: number) => `/main/vasuli/${id}`,
  DELETE: (id: number) => `/main/vasuli/${id}`,
} as const;

export interface VasuliListPayload {
  page?: number;
  per_page?: number;
  year?: string;
  to_year?: string;
  anu_kramank?: string;
  malmatta_number?: string;
  ward_number?: string;
  plot_number?: string;
  khasara_kramank?: string;
  survey_number?: string;
  khatedharkache_nav?: string;
  bhogwatdarache_nav?: string;
}

export interface VasuliAutofillPayload {
  anu_kramank: string;
  ward_number: string;
  year: string;
}

/** Per-tax-head amounts returned for magil / chalu */
export interface VasuliTaxHeads {
  gruhkar: number;
  viz: number;
  aarogya: number;
  safae: number;
  samanya_pani: number;
  vishesh_pani: number;
  notice_fee: number;
  etar_fee: number;
  ekun: number;
}

export interface VasuliAutofillResponse {
  found: boolean;
  property?: {
    nodni_id: number;
    anu_kramank: string;
    malmatta_number: string;
    ward_kramnak: string;
    plot_number: string;
    khasara_number: string;
    survey_number: string;
    khatedharkache_nav: string;
    bhogwatdarache_nav: string;
    patta: string;
  };
  magil?: VasuliTaxHeads;
  chalu?: VasuliTaxHeads;
}

export const vasuliService = {
  /**
   * Auto-fill the vasuli form from anu_kramank + ward_number (+ year).
   * Returns property master info plus previous (magil) and current (chalu) assessed tax.
   * Records are scoped to the logged-in user's gram panchayat by the backend.
   */
  autofill: async (payload: VasuliAutofillPayload): Promise<ApiResponse<VasuliAutofillResponse>> => {
    return api.post(VASULI_ENDPOINTS.AUTOFILL, payload);
  },

  /**
   * List vasuli records (paginated, filtered). Scoped to the user's gram panchayat by the backend.
   */
  list: async (payload: VasuliListPayload): Promise<ApiResponse> => {
    return api.post(VASULI_ENDPOINTS.LIST, payload);
  },

  /**
   * Get a single vasuli record (full) by id
   */
  getById: async (id: number): Promise<ApiResponse> => {
    return api.get(`/main/vasuli/${id}`);
  },

  /**
   * Create a new vasuli record
   */
  create: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(VASULI_ENDPOINTS.CREATE, payload);
  },

  /**
   * Update an existing vasuli record
   */
  update: async (id: number, payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.put(VASULI_ENDPOINTS.UPDATE(id), payload);
  },

  /**
   * Delete (soft) a vasuli record by id
   */
  delete: async (id: number): Promise<ApiResponse> => {
    return api.delete(VASULI_ENDPOINTS.DELETE(id));
  },
};

export default vasuliService;

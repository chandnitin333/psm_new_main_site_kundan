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
  STATS: '/main/vasuli/stats',
  FIND: '/main/vasuli/find',
  GP_PAYMENT_INFO: '/main/vasuli/gp-payment-info',
  PAYMENTS: (vasuliId: number) => `/main/vasuli/${vasuliId}/payments`,
  PAYMENT_DELETE: (paymentId: number) => `/main/vasuli/payments/${paymentId}`,
  PAYMENT_IMAGE_UPLOAD: '/main/vasuli/payment-image/upload',
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

  /**
   * Dashboard वसुली stats — year-wise + tax-head-wise collected totals
   */
  getStats: async (): Promise<ApiResponse> => {
    return api.get(VASULI_ENDPOINTS.STATS);
  },

  /** Current user's GP payment details (QR scanners + bank/UPI for ghar & pani) */
  getGpPaymentInfo: async (): Promise<ApiResponse> => {
    return api.get(VASULI_ENDPOINTS.GP_PAYMENT_INFO);
  },

  /** Find an existing vasuli for anu_kramank + ward + year (returns {found, vasuli}) */
  findByYear: async (anuKramank: string, wardNumber: string, year: string): Promise<ApiResponse> => {
    const qs = new URLSearchParams({ anu_kramank: anuKramank, ward_number: wardNumber, year }).toString();
    return api.get(`${VASULI_ENDPOINTS.FIND}?${qs}`);
  },

  /** List all payment entries for a vasuli */
  listPayments: async (vasuliId: number): Promise<ApiResponse> => {
    return api.get(VASULI_ENDPOINTS.PAYMENTS(vasuliId));
  },

  /** Add one payment entry to a vasuli */
  addPayment: async (vasuliId: number, payment: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(VASULI_ENDPOINTS.PAYMENTS(vasuliId), payment);
  },

  /** Delete a payment entry */
  deletePayment: async (paymentId: number): Promise<ApiResponse> => {
    return api.delete(VASULI_ENDPOINTS.PAYMENT_DELETE(paymentId));
  },

  /** Attach a proof image to a payment — field: 'ghar' | 'pani' (default legacy) */
  uploadPaymentImage: async (paymentId: number, imageFile: File, field?: 'ghar' | 'pani'): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('payment_id', String(paymentId));
    formData.append('image', imageFile);
    if (field) formData.append('field', field);
    return api.upload(VASULI_ENDPOINTS.PAYMENT_IMAGE_UPLOAD, formData);
  },
};

export default vasuliService;

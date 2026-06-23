/**
 * Certificate service — save issued certificates + fetch stats/list.
 * All data is GP-scoped on the backend (own GP / super_user's selected GP).
 */
import { api, type ApiResponse } from './api';

const CERT_ENDPOINTS = {
  BASE: '/main/certificates',
  STATS: '/main/certificates/stats',
} as const;

export interface SaveCertificatePayload {
  cert_type: string;
  cert_name?: string;
  applicant_name?: string;
  outward_no?: string;
  data: Record<string, unknown>;
}

export const certificateService = {
  /** Save an issued certificate */
  save: async (payload: SaveCertificatePayload): Promise<ApiResponse> => {
    return api.post(CERT_ENDPOINTS.BASE, payload);
  },

  /** Paginated list of issued certificates (GP-scoped) */
  list: async (page = 1, perPage = 10, certType?: string, search?: string): Promise<ApiResponse> => {
    const q = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (certType) q.set('cert_type', certType);
    if (search) q.set('q', search);
    return api.get(`${CERT_ENDPOINTS.BASE}?${q.toString()}`);
  },

  /** Counts per certificate type + total (GP-scoped) */
  stats: async (): Promise<ApiResponse> => {
    return api.get(CERT_ENDPOINTS.STATS);
  },

  /** Full saved certificate (incl. data) for re-view / re-print */
  get: async (id: number): Promise<ApiResponse> => {
    return api.get(`${CERT_ENDPOINTS.BASE}/${id}`);
  },
};

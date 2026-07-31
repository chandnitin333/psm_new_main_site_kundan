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

export interface CertificateVerifyResult {
  valid: boolean;
  status?: 'valid' | 'revoked' | 'invalid' | 'not_found';
  cert_type?: string;
  cert_name?: string;
  applicant_name?: string;
  outward_no?: string;
  issued_date?: string;
  revoked?: boolean;
  revoked_date?: string | null;
  revoke_reason?: string | null;
  gram_panchayat?: string;
  taluka?: string;
  district?: string;
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

  /** Full saved certificate (incl. data + verify_token) for re-view / re-print */
  get: async (id: number): Promise<ApiResponse> => {
    return api.get(`${CERT_ENDPOINTS.BASE}/${id}`);
  },

  /** PUBLIC — verify a certificate's authenticity by its QR token (no login). */
  verify: async (token: string): Promise<ApiResponse<CertificateVerifyResult>> => {
    return api.get(`${CERT_ENDPOINTS.BASE}/verify/${encodeURIComponent(token)}`);
  },

  /** Revoke (रद्द) an issued certificate with a reason. GP-scoped, permission-gated. */
  revoke: async (id: number, reason: string): Promise<ApiResponse> => {
    return api.post(`${CERT_ENDPOINTS.BASE}/${id}/revoke`, { reason });
  },

  /** Undo a revoke — restore the certificate to valid. */
  unrevoke: async (id: number): Promise<ApiResponse> => {
    return api.post(`${CERT_ENDPOINTS.BASE}/${id}/unrevoke`, {});
  },
};

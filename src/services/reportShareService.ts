/**
 * Report Share Service
 * Creates a short token for a report (so its QR can be scanned) and
 * fetches a shared report publicly (no auth) when the QR is opened.
 */
import { api, type ApiResponse } from './api';

export interface ReportSharePayload {
  report_type: string;
  params?: unknown;
  data?: unknown;
}

export interface PublicReportShare {
  report_type: string;
  params: Record<string, unknown> | null;
  data: unknown;
  created_at: string;
}

export const reportShareService = {
  /** Create a share token for a report (authenticated). Returns { token }. */
  create: async (payload: ReportSharePayload): Promise<ApiResponse<{ token: string }>> => {
    return api.post('/main/report-share', payload);
  },

  /** Fetch a shared report by token (PUBLIC — no login needed). */
  getPublic: async (token: string): Promise<ApiResponse<PublicReportShare>> => {
    return api.get(`/public/report-share/${encodeURIComponent(token)}`);
  },
};

export default reportShareService;

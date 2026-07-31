/**
 * Grievance / Complaint (तक्रार) service.
 * Citizen: create + my. Staff: list + update status.
 */
import { api, type ApiResponse } from './api';

const E = {
  CREATE: '/main/grievance',
  MY: '/main/grievance/my',
  LIST: '/main/grievance/list',
  STATUS: (id: number) => `/main/grievance/${id}/status`,
  SEEN: (id: number) => `/main/grievance/${id}/seen`,
  HISTORY: (id: number) => `/main/grievance/${id}/history`,
} as const;

export type GrievanceStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

export interface GrievanceEvent {
  id: number;
  event: 'created' | 'seen' | 'status';
  status: GrievanceStatus | null;
  remark: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export interface Grievance {
  id: number;
  gram_panchayat_id?: number | null;
  user_id?: number | null;
  citizen_name?: string | null;
  mobile?: string | null;
  category: string | null;
  subject: string;
  description: string | null;
  status: GrievanceStatus;
  staff_remark: string | null;
  resolved_by?: number | null;
  created_at: string;
  updated_at: string;
}

export const grievanceService = {
  create: async (payload: { subject: string; category?: string; description?: string }): Promise<ApiResponse> =>
    api.post(E.CREATE, payload),

  getMy: async (): Promise<ApiResponse<Grievance[]>> => api.get(E.MY),

  list: async (status?: string): Promise<ApiResponse<{ rows: Grievance[]; counts: Record<string, number>; total: number }>> =>
    api.get(status ? `${E.LIST}?status=${encodeURIComponent(status)}` : E.LIST),

  updateStatus: async (id: number, status: GrievanceStatus, staff_remark?: string): Promise<ApiResponse> =>
    api.put(E.STATUS(id), { status, staff_remark }),

  getHistory: async (id: number): Promise<ApiResponse<GrievanceEvent[]>> => api.get(E.HISTORY(id)),

  markSeen: async (id: number): Promise<ApiResponse> => api.post(E.SEEN(id), {}),
};

export default grievanceService;

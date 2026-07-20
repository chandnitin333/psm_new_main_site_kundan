/**
 * Helpline Service — useful local contacts directory (doctor, railway, police…)
 */
import { api, type ApiResponse } from './api';

export interface HelplineContact {
  id: number;
  source?: 'member' | 'helpline';
  gram_panchayat_id?: number | null;
  category: string | null;
  title: string | null;
  person_name: string | null;
  phone: string | null;
  alternate_phone: string | null;
  address: string | null;
  description: string | null;
  sort_order?: number;
  is_active?: number;
}

export interface HelplinePayload {
  category?: string;
  title?: string;
  person_name?: string;
  phone?: string;
  alternate_phone?: string;
  address?: string;
  description?: string;
  sort_order?: number;
  is_active?: number | boolean;
}

const ENDPOINTS = {
  LIST: '/main/helpline/list',
  CREATE: '/main/helpline',
  UPDATE: (id: number) => `/main/helpline/${id}`,
  DELETE: (id: number) => `/main/helpline/${id}`,
} as const;

export const helplineService = {
  list: async (): Promise<ApiResponse<HelplineContact[]>> => api.get(ENDPOINTS.LIST),
  create: async (payload: HelplinePayload): Promise<ApiResponse> => api.post(ENDPOINTS.CREATE, payload),
  update: async (id: number, payload: HelplinePayload): Promise<ApiResponse> => api.put(ENDPOINTS.UPDATE(id), payload),
  remove: async (id: number): Promise<ApiResponse> => api.delete(ENDPOINTS.DELETE(id)),
};

export default helplineService;

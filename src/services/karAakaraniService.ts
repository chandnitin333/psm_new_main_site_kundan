/**
 * Kar Aakarani (Tax Assessment) Service
 * Handles kar aakarani list API calls
 */

import { api, type ApiResponse } from './api';

const KAR_AAKARANI_ENDPOINTS = {
  LIST: '/main/kar-aakarani/list',
} as const;

export interface KarAakaraniListPayload {
  ward_number?: string;
  year?: string;
  to_year?: string;
  page?: number;
  per_page?: number;
}

export const karAakaraniService = {
  /**
   * Get kar aakarani records filtered by ward_number, year, to_year.
   * Records are automatically scoped to the logged-in user's gram panchayat by the backend.
   */
  list: async (payload: KarAakaraniListPayload): Promise<ApiResponse> => {
    return api.post(KAR_AAKARANI_ENDPOINTS.LIST, payload);
  },
};

export default karAakaraniService;

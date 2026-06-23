/**
 * Global search service — one call that searches properties, vasuli records and
 * issued certificates for the user's gram panchayat. Powers the header search bar.
 */
import { api, type ApiResponse } from './api';

export interface SearchResult {
  type: 'property' | 'vasuli' | 'certificate';
  id: number;
  label: string;
  sublabel: string;
  // routing helpers (present per type)
  anu_kramank?: string | null;
  ward_kramnak?: string | null;
  ward_number?: string | null;
  cert_type?: string | null;
}

export const searchService = {
  /** Search across modules. Returns up to a handful of matches per type. */
  global: async (q: string): Promise<ApiResponse<{ results: SearchResult[] }>> => {
    return api.get(`/main/search?q=${encodeURIComponent(q)}`);
  },
};

export default searchService;

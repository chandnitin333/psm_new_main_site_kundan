/**
 * Global search service — one call that searches properties, vasuli records and
 * issued certificates for the user's gram panchayat. Powers the header search bar.
 */
import { api, type ApiResponse } from './api';

export type SearchType = 'property' | 'vasuli' | 'certificate' | 'water_meter';

export interface SearchResult {
  type: SearchType;
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
  /** Search across modules (permission-based — `types` limits which entities are searched). */
  global: async (q: string, types?: string[]): Promise<ApiResponse<{ results: SearchResult[] }>> => {
    const t = types && types.length ? `&types=${encodeURIComponent(types.join(','))}` : '';
    return api.get(`/main/search?q=${encodeURIComponent(q)}${t}`);
  },
};

export default searchService;

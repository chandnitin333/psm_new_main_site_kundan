/**
 * Personal / GP expense diary — private, per-user, ENCRYPTED at rest.
 * Staff log the gram panchayat's expenses; citizens keep their own personal ones.
 * Backend stores the whole blob encrypted; only the owner (token) can read/write.
 */
import { api, type ApiResponse } from './api';

// One expense row inside a month
export interface ExpenseRow {
  id: number;        // local id (Date-based); the whole blob is replaced on save
  date: string;      // YYYY-MM-DD
  name: string;
  amount: number;
  img?: string | null; // optional proof (compressed base64 data URL) — cheque/screenshot etc.
}
// One month's sheet
export interface MonthSheet {
  budget: number;            // "monthly payment" added at the top
  expenses: ExpenseRow[];
}
// Full blob: { "YYYY-MM": MonthSheet }
export type ExpenseData = Record<string, MonthSheet>;

const E = { BASE: '/main/personal-expense' };

const personalExpenseService = {
  /** Load the logged-in user's own (decrypted) expense data. */
  get: async (): Promise<ApiResponse<{ data: ExpenseData }>> => api.get(E.BASE),
  /** Replace the whole blob (re-encrypted server-side). */
  save: async (data: ExpenseData): Promise<ApiResponse> => api.put(E.BASE, { data }),
};

export default personalExpenseService;

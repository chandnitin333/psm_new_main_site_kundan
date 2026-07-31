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
  KPIS: '/main/vasuli/kpis',
  MONTHLY: '/main/vasuli/monthly',
  GHOSVARA: '/main/vasuli/ghosvara',
  BULK_REMINDER: '/main/vasuli/bulk-reminder',
  LEDGER: (nodniId: number) => `/main/vasuli/ledger/${nodniId}`,
  DEFAULTERS: '/main/vasuli/defaulters',
  DAYBOOK: '/main/vasuli/daybook',
  WARD_COLLECTION: '/main/vasuli/ward-collection',
  FIND: '/main/vasuli/find',
  GP_PAYMENT_INFO: '/main/vasuli/gp-payment-info',
  PAYMENTS: (vasuliId: number) => `/main/vasuli/${vasuliId}/payments`,
  PAYMENT_DELETE: (paymentId: number) => `/main/vasuli/payments/${paymentId}`,
  PAYMENT_IMAGE_UPLOAD: '/main/vasuli/payment-image/upload',
  MY_PAYMENTS: '/main/vasuli/my-payments',
} as const;

/** One भरणा (payment) entry for the logged-in citizen, incl. receipt fields. */
export interface MyPayment {
  id: number;
  paid_at: string;
  amount: number;
  payment_type: string | null;      // cash | online | ...
  kar_prakar: string | null;        // gruhkar | pani | both
  ghar_amount: number | null;
  pani_amount: number | null;
  reference_no: string | null;
  ghar_pavti_no: string | null;
  pani_pavti_no: string | null;
  year: number | null;
  to_year: number | null;
  malmatta_number: string | null;
  anu_kramank: string | null;
  ward_number: string | null;
  khatedharkache_nav: string | null;
  patta_address: string | null;
  sillak_ekun: number | null;
  gram_panchayat: string | null;
  taluka: string | null;
  district: string | null;
}
export interface MyPaymentsResponse {
  payments: MyPayment[];
  total_paid: number;
  count: number;
}

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

export interface DashboardKpis {
  collected: number;
  outstanding: number;
  demand: number;
  recovery_pct: number;
  ward_outstanding: { ward: string; baki: number }[];
  properties_total: number;
  today_entries: number;
  certificates_total: number;
}

export interface MonthlyCollection {
  year: number;
  months: { month_name: string; collected: number; count: number }[];
  total: number;
}

export interface GhosvaraRow {
  ward: string;
  properties: number;
  demand: number;
  collected: number;
  outstanding: number;
  recovery_pct: number;
}
export interface Ghosvara {
  year: string | null;
  wards: GhosvaraRow[];
  total: GhosvaraRow;
}

export interface LedgerYear {
  id: number; year: number | string | null; to_year: number | string | null;
  ward_number: string | null; anu_kramank: string | null; malmatta_number: string | null;
  demand: number; collected: number; outstanding: number;
}
export interface LedgerPayment {
  id: number; paid_at: string; amount: number; payment_type: string | null;
  kar_prakar: string | null; reference_no: string | null;
  ghar_pavti_no: string | null; pani_pavti_no: string | null;
}
export interface PropertyLedger {
  property: { nodni_id: number; name: string; mobile: string; ward: string | number | null; malmatta_number: string | null; address: string };
  years: LedgerYear[];
  payments: LedgerPayment[];
  totals: { demand: number; collected: number; outstanding: number };
  water: { meter_number: string | null; total_paid: number; count: number } | null;
}

export interface BulkReminderResult {
  inapp_sent: number;
  sms_count: number;
  no_mobile: number;
  sms_list: { mobile: string; name: string; message: string }[];
}

export interface Defaulter {
  nodni_id: number;
  anu_kramank: string | null;
  ward: string | null;
  malmatta_number: string | null;
  name: string;
  mobile: string | null;
  year: string | null;
  to_year: string | null;
  demand: number;
  jama: number;
  baki: number;
}

export interface DaybookPayment {
  id: number; time: string; date: string; name: string; ward: string | null;
  anu_kramank: string | null; mode: string; provider: string | null;
  amount: number; ghar_amount: number; pani_amount: number;
  pavti_no: string | null; reference_no: string | null; collector: string;
}

export interface Daybook {
  from: string; to: string;
  payments: DaybookPayment[];
  count: number;
  total: number; ghar_total: number; pani_total: number;
  by_mode: Record<string, number>;
  by_collector: Record<string, number>;
}

export interface WardCollectionProperty {
  nodni_id: number; anu_kramank: string | null; ward: string | null;
  malmatta_number: string | null; name: string; mobile: string | null;
  vasuli_id: number | null; demand: number; jama: number; baki: number;
  status: 'paid' | 'pending' | 'not_billed';
}

export interface WardCollection {
  ward: string; year: string;
  properties: WardCollectionProperty[];
  total_properties: number;
  pending_count: number;
  pending_baki: number;
  collected: number;
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

  /** Consolidated dashboard KPIs — collection totals, recovery %, ward-wise बाकी, counts */
  getKpis: async (year?: string): Promise<ApiResponse<DashboardKpis>> => {
    return api.get(year ? `${VASULI_ENDPOINTS.KPIS}?year=${encodeURIComponent(year)}` : VASULI_ENDPOINTS.KPIS);
  },

  /** Month-wise collection for a financial year (Apr -> Mar) — मासिक वसुली trend */
  getMonthly: async (year?: string | number): Promise<ApiResponse<MonthlyCollection>> => {
    return api.get(year ? `${VASULI_ENDPOINTS.MONTHLY}?year=${encodeURIComponent(String(year))}` : VASULI_ENDPOINTS.MONTHLY);
  },

  /** Ward-wise घोषवारा summary (मागणी/वसुली/थकबाकी) + GP total for a year */
  getGhosvara: async (year?: string | number): Promise<ApiResponse<Ghosvara>> => {
    return api.get(year ? `${VASULI_ENDPOINTS.GHOSVARA}?year=${encodeURIComponent(String(year))}` : VASULI_ENDPOINTS.GHOSVARA);
  },

  /** Consolidated property खातेवही — year-wise मागणी/वसुली/थकबाकी + payments + water */
  getLedger: async (nodniId: number): Promise<ApiResponse<PropertyLedger>> => api.get(VASULI_ENDPOINTS.LEDGER(nodniId)),

  /** Bulk thakbaki reminder — in-app सूचना to defaulters + SMS text list */
  bulkReminder: async (payload: {
    title?: string; message?: string; send_inapp?: boolean;
    targets: { mobile?: string | null; name?: string | null; baki?: number; year?: number | string | null }[];
  }): Promise<ApiResponse<BulkReminderResult>> => {
    return api.post(VASULI_ENDPOINTS.BULK_REMINDER, payload);
  },

  /** Top defaulter properties by outstanding बाकी (optionally a year) */
  getDefaulters: async (year?: string, limit = 50): Promise<ApiResponse<{ defaulters: Defaulter[]; count: number }>> => {
    const qs = new URLSearchParams();
    if (year) qs.set('year', year);
    qs.set('limit', String(limit));
    return api.get(`${VASULI_ENDPOINTS.DEFAULTERS}?${qs.toString()}`);
  },

  /** दैनिक वसुली रजिस्टर — payments in a date range with totals (default: today) */
  getDaybook: async (from?: string, to?: string): Promise<ApiResponse<Daybook>> => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    return api.get(`${VASULI_ENDPOINTS.DAYBOOK}${q ? `?${q}` : ''}`);
  },

  /** Mobile field-collection — ward-wise property list with year's vasuli status */
  getWardCollection: async (ward: string, year: string): Promise<ApiResponse<WardCollection>> => {
    const qs = new URLSearchParams({ ward, year }).toString();
    return api.get(`${VASULI_ENDPOINTS.WARD_COLLECTION}?${qs}`);
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

  /** Citizen self-service — own भरणा इतिहास (for माझे भरणे page + पावती). */
  getMyPayments: async (): Promise<ApiResponse<MyPaymentsResponse>> => {
    return api.get(VASULI_ENDPOINTS.MY_PAYMENTS);
  },
};

export default vasuliService;

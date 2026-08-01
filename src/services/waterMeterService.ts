/**
 * Water Meter — reading register + water demand bill.
 */
import { api, type ApiResponse } from './api';

export interface WaterMeter {
  id: number;
  gram_panchayat_id?: number | null;
  nodni_id?: number | null;
  anu_kramank?: string | null;
  malmatta_number?: string | null;
  ward?: string | null;
  plot_number?: string | null;
  meter_number?: string | null;
  mobile?: string | null;
  khatedar_name?: string | null;
  bhogwatdar_name?: string | null;
  address?: string | null;
  water_supply_name?: string | null;
  rate?: number | null;
  late_fee?: number | null;
  /** विलंब दंड वारंवारता — 'monthly' (दर महिना) किंवा 'quarterly' (तिमाही, quarter च्या शेवटच्या महिन्यात) */
  late_fee_freq?: 'monthly' | 'quarterly' | null;
  is_active?: number;
  readings?: WaterReading[];
  /** latest saved bill config (report endpoint) — केंद्र, पावती, दिनांक, सूचना इ. */
  bill?: {
    due_date?: string | null; center?: string | null; center_addr?: string | null;
    prev_receipt?: string | null; prev_date?: string | null; magil_month?: string | null;
    magil_amount?: number | null; notes?: string | null; from_seq?: number | null; to_seq?: number | null;
  } | null;
}

export interface WaterReading {
  id?: number;
  meter_id?: number;
  year: number;
  month_seq: number;
  month_name?: string | null;
  current_reading?: string | null;
  previous_reading?: string | null;
  units?: number | null;
  ekun_reading?: string | null;
  rate?: number | null;
  current_charge?: number | null;
  arrears?: number | null;
  late_fee?: number | null;
  total?: number | null;
  receipt_no?: string | null;
  receipt_date?: string | null;
  paid_amount?: number | null;
  balance?: number | null;
  remark?: string | null;
  reading_photo?: string | null; // compressed base64 data URL (per-month reading photo)
  config_locked?: number | null; // 1 once आकारणी दर/विलंब config confirmed on the detail page
}

export type WaterMeterPayload = Partial<Omit<WaterMeter, 'id' | 'readings'>>;

/** One water bill payment (पाणी बिल भरणा) entry. */
export interface WaterPayment {
  id: number;
  meter_id?: number;
  water_bill_id?: number | null;
  amount: number;
  payment_type?: string | null;   // cash | online | cheque | upi
  reference_no?: string | null;
  receipt_no?: string | null;
  paid_date?: string | null;
  year?: number | null;
  from_seq?: number | null;
  to_seq?: number | null;
  remark?: string | null;
  created_at?: string;
  // citizen view (joined meter/GP)
  meter_number?: string | null;
  khatedar_name?: string | null;
  address?: string | null;
  ward?: string | null;
  malmatta_number?: string | null;
  gram_panchayat?: string | null;
  taluka?: string | null;
  district?: string | null;
}
export interface WaterPaymentsResponse {
  payments: WaterPayment[];
  total_paid: number;
  count: number;
}

// Financial-year month order (April -> March)
export const WATER_MONTHS = ['एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर', 'जानेवारी', 'फेब्रुवारी', 'मार्च'];

const E = {
  LIST: '/main/water-meter/list',
  CREATE: '/main/water-meter',
  UPDATE: (id: number) => `/main/water-meter/${id}`,
  DELETE: (id: number) => `/main/water-meter/${id}`,
  GET: (id: number) => `/main/water-meter/${id}`,
  READING: (id: number) => `/main/water-meter/${id}/reading`,
  DEL_READING: (rid: number) => `/main/water-meter/reading/${rid}`,
  LOCK_CONFIG: (id: number) => `/main/water-meter/${id}/lock-config`,
  MY: '/main/water-meter/my',
  REPORT: '/main/water-meter/report',
  BY_NODNI: (nid: number) => `/main/water-meter/by-nodni/${nid}`,
  SAVE_BILL: (id: number) => `/main/water-meter/${id}/bill`,
  LATEST_BILL: (id: number) => `/main/water-meter/${id}/bill/latest`,
  ADD_PAYMENT: (id: number) => `/main/water-meter/${id}/payment`,
  LIST_PAYMENTS: (id: number) => `/main/water-meter/${id}/payments`,
  DEL_PAYMENT: (pid: number) => `/main/water-meter/payment/${pid}`,
  MY_PAYMENTS: '/main/water-meter/my-water-payments',
  FIELD: '/main/water-meter/field',
} as const;

/** One meter row for field-mode reading entry. */
export interface FieldMeter {
  meter_id: number;
  meter_number: string | null;
  khatedar_name: string | null;
  mobile: string | null;
  ward: string | null;
  malmatta_number: string | null;
  rate: number;
  prev_reading: string | null;
  arrears: number;
  reading_id: number | null;
  current_reading: string | null;
  saved: boolean;
  has_photo?: boolean;
}
export interface FieldMetersResponse { year: number; month_seq: number; meters: FieldMeter[]; count: number; }

export const waterMeterService = {
  list: async (search = ''): Promise<ApiResponse<WaterMeter[]>> => api.post(E.LIST, { search }),
  create: async (p: WaterMeterPayload): Promise<ApiResponse> => api.post(E.CREATE, p),
  update: async (id: number, p: WaterMeterPayload): Promise<ApiResponse> => api.put(E.UPDATE(id), p),
  remove: async (id: number): Promise<ApiResponse> => api.delete(E.DELETE(id)),
  getMeter: async (id: number, year?: number): Promise<ApiResponse<WaterMeter>> =>
    api.get(year ? `${E.GET(id)}?year=${year}` : E.GET(id)),
  saveReading: async (id: number, r: WaterReading): Promise<ApiResponse> => api.post(E.READING(id), r),
  lockConfig: async (id: number, year: number): Promise<ApiResponse> => api.post(E.LOCK_CONFIG(id), { year }),
  deleteReading: async (rid: number): Promise<ApiResponse> => api.delete(E.DEL_READING(rid)),
  myMeters: async (): Promise<ApiResponse<WaterMeter[]>> => api.get(E.MY),
  report: async (params: { year?: number; ward?: string }): Promise<ApiResponse<WaterMeter[]>> => api.post(E.REPORT, params),
  byNodni: async (nodniId: number): Promise<ApiResponse<WaterMeter>> => api.get(E.BY_NODNI(nodniId)),
  saveBill: async (id: number, bill: Record<string, unknown>): Promise<ApiResponse> => api.post(E.SAVE_BILL(id), bill),
  latestBill: async (id: number, year?: number, fromSeq?: number, toSeq?: number): Promise<ApiResponse<Record<string, unknown>>> => {
    const qs = new URLSearchParams();
    if (year) qs.set('year', String(year));
    if (fromSeq) qs.set('from_seq', String(fromSeq));
    if (toSeq) qs.set('to_seq', String(toSeq));
    const q = qs.toString();
    return api.get(q ? `${E.LATEST_BILL(id)}?${q}` : E.LATEST_BILL(id));
  },
  // ---- payments (पाणी बिल भरणा) ----
  addPayment: async (meterId: number, p: Partial<WaterPayment>): Promise<ApiResponse> => api.post(E.ADD_PAYMENT(meterId), p),
  listPayments: async (meterId: number): Promise<ApiResponse<WaterPaymentsResponse>> => api.get(E.LIST_PAYMENTS(meterId)),
  deletePayment: async (paymentId: number): Promise<ApiResponse> => api.delete(E.DEL_PAYMENT(paymentId)),
  myWaterPayments: async (): Promise<ApiResponse<WaterPaymentsResponse>> => api.get(E.MY_PAYMENTS),

  /** Field mode — meters with previous reading + arrears for quick current-reading entry. */
  fieldMeters: async (year: number, monthSeq: number, ward?: string, search?: string): Promise<ApiResponse<FieldMetersResponse>> => {
    const qs = new URLSearchParams({ year: String(year), month_seq: String(monthSeq) });
    if (ward != null && ward !== '') qs.set('ward', ward);
    if (search) qs.set('search', search);
    return api.get(`${E.FIELD}?${qs.toString()}`);
  },
};

export default waterMeterService;

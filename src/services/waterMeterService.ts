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
  is_active?: number;
  readings?: WaterReading[];
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
}

export type WaterMeterPayload = Partial<Omit<WaterMeter, 'id' | 'readings'>>;

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
  MY: '/main/water-meter/my',
  BY_NODNI: (nid: number) => `/main/water-meter/by-nodni/${nid}`,
  SAVE_BILL: (id: number) => `/main/water-meter/${id}/bill`,
  LATEST_BILL: (id: number) => `/main/water-meter/${id}/bill/latest`,
} as const;

export const waterMeterService = {
  list: async (search = ''): Promise<ApiResponse<WaterMeter[]>> => api.post(E.LIST, { search }),
  create: async (p: WaterMeterPayload): Promise<ApiResponse> => api.post(E.CREATE, p),
  update: async (id: number, p: WaterMeterPayload): Promise<ApiResponse> => api.put(E.UPDATE(id), p),
  remove: async (id: number): Promise<ApiResponse> => api.delete(E.DELETE(id)),
  getMeter: async (id: number, year?: number): Promise<ApiResponse<WaterMeter>> =>
    api.get(year ? `${E.GET(id)}?year=${year}` : E.GET(id)),
  saveReading: async (id: number, r: WaterReading): Promise<ApiResponse> => api.post(E.READING(id), r),
  deleteReading: async (rid: number): Promise<ApiResponse> => api.delete(E.DEL_READING(rid)),
  myMeters: async (): Promise<ApiResponse<WaterMeter[]>> => api.get(E.MY),
  byNodni: async (nodniId: number): Promise<ApiResponse<WaterMeter>> => api.get(E.BY_NODNI(nodniId)),
  saveBill: async (id: number, bill: Record<string, unknown>): Promise<ApiResponse> => api.post(E.SAVE_BILL(id), bill),
  latestBill: async (id: number, year?: number): Promise<ApiResponse<Record<string, unknown>>> =>
    api.get(year ? `${E.LATEST_BILL(id)}?year=${year}` : E.LATEST_BILL(id)),
};

export default waterMeterService;

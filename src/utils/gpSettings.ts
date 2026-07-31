/**
 * GP operational settings (receipt header/footer, default water late-fee) —
 * configured by admin in System Settings. Fetched once and cached in localStorage
 * so sync code (receipt generators) can read it without an await.
 */
import { api } from '../services/api';

const KEY = 'gp_settings';

export interface GpSettings {
  receipt_header: string;
  receipt_footer: string;
  water_late_fee_default: number;
}

const DEFAULTS: GpSettings = {
  receipt_header: '',
  receipt_footer: 'ही संगणकीय पावती आहे — स्वाक्षरीची आवश्यकता नाही.',
  water_late_fee_default: 10,
};

/** Fetch + cache (call once after login / at dashboard mount). */
export const loadGpSettings = async (): Promise<void> => {
  try {
    const res = await api.get<Partial<GpSettings>>('/main/common-ddl/gp-settings');
    if (res?.success && res.data) localStorage.setItem(KEY, JSON.stringify(res.data));
  } catch { /* keep whatever is cached / defaults */ }
};

/** Sync read (with defaults) — safe to call from receipt generators. */
export const getGpSettings = (): GpSettings => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...s };
  } catch { return DEFAULTS; }
};

export const gpSetting = <K extends keyof GpSettings>(k: K): GpSettings[K] => getGpSettings()[k];

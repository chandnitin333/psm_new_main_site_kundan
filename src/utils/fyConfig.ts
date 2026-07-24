/**
 * Financial-year config — global (admin-set): year-wise vs financial-year-wise,
 * with an editable range (default 1 April → 31 March).
 *
 * Fetched from /public/fy-config, cached in localStorage, polled for live updates
 * (same pattern as themeColor / branding). Whole app reads it to filter "year"
 * selections by FY date-range when enabled.
 */
import { useSyncExternalStore } from 'react';
import { config } from '../config';

export interface FyConfig {
  enabled: boolean;
  startMonth: number; // 1-12
  startDay: number;   // 1-31
  endMonth: number;   // 1-12
  endDay: number;     // 1-31
}

const DEFAULT: FyConfig = { enabled: true, startMonth: 4, startDay: 1, endMonth: 3, endDay: 31 };
const STORAGE_KEY = 'fy_config';

let current: FyConfig = DEFAULT;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const getFyConfig = (): FyConfig => current;
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
/** React hook — re-renders when FY config changes. */
export const useFyConfig = (): FyConfig => useSyncExternalStore(subscribe, getFyConfig, getFyConfig);

export const isFyEnabled = (): boolean => current.enabled;

const pad = (n: number) => String(n).padStart(2, '0');

/** Start & end calendar dates (YYYY-MM-DD) for the financial year that STARTS in `year`.
 *  If the range crosses the calendar year (endMonth < startMonth, e.g. Apr→Mar),
 *  the end date falls in year+1. When FY is disabled, returns the plain calendar year. */
export const fyRange = (year: number): { start: string; end: string } => {
  const c = current;
  if (!c.enabled) return { start: `${year}-01-01`, end: `${year}-12-31` };
  const crosses = c.endMonth < c.startMonth || (c.endMonth === c.startMonth && c.endDay < c.startDay);
  const endYear = crosses ? year + 1 : year;
  return {
    start: `${year}-${pad(c.startMonth)}-${pad(c.startDay)}`,
    end: `${endYear}-${pad(c.endMonth)}-${pad(c.endDay)}`,
  };
};

/** Label for a selected year: FY → "2026-2027", year-wise → "2026". */
export const fyLabel = (year: number): string => (current.enabled ? `${year}-${year + 1}` : `${year}`);

/** The financial year (start year) that a given date falls into. */
export const fyOfDate = (d = new Date()): number => {
  const c = current;
  if (!c.enabled) return d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const afterStart = m > c.startMonth || (m === c.startMonth && day >= c.startDay);
  return afterStart ? d.getFullYear() : d.getFullYear() - 1;
};

const normalize = (x: unknown): FyConfig | null => {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const int = (v: unknown, lo: number, hi: number, dflt: number) => {
    const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? Math.trunc(n) : dflt;
  };
  return {
    enabled: o.enabled === true || o.enabled === 'true' || o.enabled === 1,
    startMonth: int(o.startMonth, 1, 12, 4),
    startDay: int(o.startDay, 1, 31, 1),
    endMonth: int(o.endMonth, 1, 12, 3),
    endDay: int(o.endDay, 1, 31, 31),
  };
};

const apply = (c: FyConfig) => { current = c; notify(); };

let _last = '';
const fetchAndApply = () => {
  fetch(`${config.api.baseUrl.replace(/\/$/, '')}/public/fy-config`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const c = normalize(json?.data?.fy);
      if (!c) return;
      const sig = JSON.stringify(c);
      if (sig === _last) return;
      _last = sig;
      apply(c);
      try { localStorage.setItem(STORAGE_KEY, sig); } catch { /* ignore */ }
    })
    .catch(() => { /* keep cached/default */ });
};

/** Apply cached config instantly, fetch authoritative, then poll for live updates. */
export const initFyConfig = (): void => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const c = cached ? normalize(JSON.parse(cached)) : null;
    if (c) { _last = JSON.stringify(c); apply(c); }
  } catch { /* ignore */ }
  fetchAndApply();
  setInterval(fetchAndApply, 30000);
  window.addEventListener('focus', fetchAndApply);
};

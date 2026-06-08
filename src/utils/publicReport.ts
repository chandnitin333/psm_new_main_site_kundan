/**
 * Helpers for rendering a report in PUBLIC (scanned-QR) mode.
 *
 * When a report is opened via its QR, the public viewer pre-loads the data
 * snapshot into sessionStorage under PUBLIC_DATA_KEY. Each report, instead of
 * fetching from an authenticated endpoint, uses this snapshot if present.
 */
export const PUBLIC_DATA_KEY = '__publicReportData';

/** Returns the injected data snapshot when running in public/scanned mode, else null. */
export function getPublicReportData<T = unknown>(): T | null {
  try {
    const raw = sessionStorage.getItem(PUBLIC_DATA_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** True when the current tab is showing a publicly-shared (scanned) report. */
export function isPublicReportMode(): boolean {
  return !!sessionStorage.getItem(PUBLIC_DATA_KEY);
}

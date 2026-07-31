/**
 * Self-hosted client error monitoring — captures uncaught JS errors + promise
 * rejections + React render errors, and posts them to the backend for admin review.
 * Best-effort, throttled + deduped so it never spams or breaks the app.
 */
import { api } from '../services/api';

const seen = new Set<string>();
let sent = 0;
const MAX_PER_SESSION = 30;

interface ClientError { message: string; stack?: string; source?: string; url?: string; }

export const reportClientError = (e: ClientError): void => {
  try {
    const msg = (e.message || '').slice(0, 500);
    if (!msg) return;
    const key = `${e.source || ''}|${msg}`.slice(0, 200);
    if (seen.has(key) || sent >= MAX_PER_SESSION) return; // dedupe + cap
    seen.add(key); sent++;
    // fire-and-forget; ignore all failures (never surface capture errors)
    api.post('/main/common-ddl/client-error', {
      message: msg,
      stack: (e.stack || '').slice(0, 5000),
      source: e.source || 'error',
      url: e.url || window.location.pathname,
    }).catch(() => { /* ignore */ });
  } catch { /* ignore */ }
};

let inited = false;
/** Attach global handlers once (call at app startup). */
export const initErrorCapture = (): void => {
  if (inited) return;
  inited = true;
  window.addEventListener('error', (ev) => {
    reportClientError({
      message: ev.message || String(ev.error || 'Unknown error'),
      stack: ev.error?.stack,
      source: 'window.onerror',
      url: window.location.pathname,
    });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason;
    reportClientError({
      message: (r?.message || String(r) || 'Unhandled promise rejection').slice(0, 500),
      stack: r?.stack,
      source: 'unhandledrejection',
      url: window.location.pathname,
    });
  });
};

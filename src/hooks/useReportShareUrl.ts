import { useEffect, useState } from 'react';
import reportShareService from '../services/reportShareService';

/**
 * Creates ONE report-share token (when data is ready) and returns the public
 * scan URL `${origin}/r/<token>`. Lets a report place the QR image anywhere
 * (even in multiple spots) without creating multiple shares.
 */
export function useReportShareUrl(opts: {
  reportType: string;
  sessionKey?: string;
  params?: Record<string, unknown>;
  data: unknown;
  enabled?: boolean;
}): string {
  const { reportType, sessionKey, params, data, enabled = true } = opts;
  const [url, setUrl] = useState('');
  const hasData = Array.isArray(data) ? data.length > 0 : !!data;

  useEffect(() => {
    if (!enabled || !hasData) return;
    let active = true;
    (async () => {
      try {
        let user: unknown = null;
        try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { user = null; }
        const res = await reportShareService.create({
          report_type: reportType,
          params: { ...(params || {}), __sessionKey: sessionKey, __user: user },
          data,
        });
        const token = (res?.data as { token?: string } | undefined)?.token;
        if (active && token) {
          // VITE_PUBLIC_BASE_URL lets you point the QR at a LAN IP for phone testing;
          // leave it empty in prod to use the current site origin automatically.
          const base = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
          setUrl(`${base.replace(/\/$/, '')}/r/${token}`);
        }
      } catch (e) {
        console.error('[useReportShareUrl] create share failed', e);
      }
    })();
    return () => { active = false; };
    // create once when data becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hasData]);

  return url;
}

export default useReportShareUrl;

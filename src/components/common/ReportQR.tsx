import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import reportShareService from '../../services/reportShareService';

interface ReportQRProps {
  /** report identifier used by the public viewer registry (e.g. 'bill-129-1') */
  reportType: string;
  /** the sessionStorage key the report reads its params from (so the viewer can restore them) */
  sessionKey?: string;
  /** params the report needs (period, dates, year, etc.) */
  params?: Record<string, unknown>;
  /** the already-fetched data snapshot to embed (so the scan renders the same report) */
  data?: unknown;
  size?: number;
  label?: string;
}

/**
 * Renders a QR code that, when scanned, opens a public (no-login) view of THIS report.
 * Creates a short-lived share token on mount and encodes `${origin}/r/<token>`.
 * Visible in print (so the printed report can be scanned).
 */
const ReportQR = ({ reportType, sessionKey, params, data, size = 84, label = 'स्कॅन करा' }: ReportQRProps) => {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
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
        // be tolerant of envelope shape
        const token =
          (res && (res.data as { token?: string } | undefined)?.token) ||
          (res as unknown as { token?: string })?.token;
        if (active && token) {
          const base = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
          setUrl(`${base.replace(/\/$/, '')}/r/${token}`);
        } else if (active) {
          console.error('[ReportQR] no token in response', res);
          setFailed(true);
        }
      } catch (e) {
        console.error('[ReportQR] create share failed', e);
        if (active) setFailed(true);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const box: React.CSSProperties = {
    width: size, height: size,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #ccc', fontSize: 9, color: '#999', textAlign: 'center', padding: 2,
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {url ? (
        <QRCodeSVG value={url} size={size} level="M" marginSize={0} />
      ) : (
        <div style={box}>{failed ? 'QR अयशस्वी' : 'QR...'}</div>
      )}
      {label ? <span style={{ fontSize: 9, lineHeight: 1 }}>{label}</span> : null}
    </div>
  );
};

export default ReportQR;

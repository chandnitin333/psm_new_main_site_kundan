import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Smartphone } from 'lucide-react';
import authService from '../../services/authService';

/**
 * "App QR Poster" — a printable poster carrying a QR code that opens the public
 * install page (/install). GP staff print this and stick it in the office / gram
 * sabha, or share it on WhatsApp. Scanning it shows a one-tap "Install App" button.
 *
 * Fully self-contained & additive — touches no existing component.
 */
const AppPoster = () => {
  const { gpName, installUrl } = useMemo(() => {
    let name = '';
    try {
      const u = authService.getCurrentUser() as { gram_panchayat?: string } | null;
      name = (u?.gram_panchayat || '').trim();
    } catch { /* ignore */ }
    const base = (import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin).replace(/\/$/, '');
    const url = `${base}/install${name ? `?gp=${encodeURIComponent(name)}` : ''}`;
    return { gpName: name, installUrl: url };
  }, []);

  return (
    <div id="app-poster-wrap" className="mx-auto max-w-3xl p-4">
      {/* Screen-only toolbar */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">अ‍ॅप QR पोस्टर</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            हे पोस्टर प्रिंट करा व कार्यालयात लावा. नागरिक QR स्कॅन करून अ‍ॅप इन्स्टॉल करू शकतात.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Printer className="h-4 w-4" /> प्रिंट / डाउनलोड
        </button>
      </div>

      {/* The poster (this is what prints) */}
      <div
        id="app-poster"
        className="mx-auto flex flex-col items-center rounded-2xl border-2 border-primary-600 bg-white px-6 py-8 text-center"
        style={{ maxWidth: 480 }}
      >
        <img src="/pwa-192x192.png" alt="App" className="h-20 w-20 rounded-2xl" />
        <h2 className="mt-3 text-2xl font-extrabold text-gray-900">
          ग्रामपंचायत मोबाईल अ‍ॅप
        </h2>
        {gpName ? (
          <p className="mt-1 text-lg font-bold text-primary-700">{gpName}</p>
        ) : null}
        <p className="mt-1 text-sm font-medium text-gray-600">
          कर भरा · पावती · पाणी बिल · तक्रार — मोबाईलवर
        </p>

        {/* QR */}
        <div className="mt-5 rounded-xl border-4 border-gray-900 p-3">
          <QRCodeSVG value={installUrl} size={220} level="M" marginSize={0} />
        </div>

        <p className="mt-4 text-base font-bold text-gray-900">
          मोबाईल कॅमेरा उघडा → QR स्कॅन करा → अ‍ॅप इन्स्टॉल करा
        </p>

        {/* Steps */}
        <div className="mt-4 w-full space-y-2 text-left text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">१</span>
            मोबाईलचा कॅमेरा उघडा
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">२</span>
            वरील QR कोड स्कॅन करा
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">३</span>
            <span className="flex items-center gap-1">
              <Smartphone className="h-4 w-4 text-primary-600" /> &quot;अ‍ॅप इन्स्टॉल करा&quot; बटण दाबा
            </span>
          </div>
        </div>

        <p className="mt-5 break-all text-xs text-gray-400">{installUrl}</p>
      </div>

      {/* Print styles: only the poster prints, centred, with colours preserved.
          Kept in normal flow (no absolute positioning) so it stays centred
          regardless of any positioned ancestor. */}
      <style>{`
        @media print {
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #app-poster, #app-poster * { visibility: visible !important; }
          /* neutralise the on-screen wrappers so the poster centres on the page */
          #app-poster-wrap { display: block !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          #app-poster {
            margin: 0 auto !important;
            width: 460px !important; max-width: 460px !important;
            border: 2px solid #111 !important;
            box-shadow: none !important;
            /* keep the coloured QR border, badges & brand colours in print */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>
    </div>
  );
};

export default AppPoster;

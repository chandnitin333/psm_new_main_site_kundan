import { useState, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { authService } from '../../../services';

/* Shared print frame for every certificate: a government-style double-bordered
   A4 sheet with GP letterhead (district/taluka/GP), title, a body slot (each
   certificate supplies its own format), and a footer with signatures.
   Screen shows the framed sheet + a Print button; print emits a clean single A4. */

interface CertificateLayoutProps {
  title: string;       // certificate title (Marathi)
  subtitle?: string;   // optional small line under title
  children: ReactNode; // the certificate body (per-certificate format)
  outwardNo?: string;  // जावक क्रमांक (optional)
  canPrint?: boolean;  // show the Print button only if the user has print permission
  verifyToken?: string; // QR verification token (present once the certificate is saved)
}

const CertificateLayout = ({ title, subtitle, children, outwardNo, canPrint = true, verifyToken }: CertificateLayoutProps) => {
  const verifyUrl = verifyToken
    ? `${(import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin).replace(/\/$/, '')}/verify/${verifyToken}`
    : '';
  const [loc] = useState(() => {
    const u = authService.getCurrentUser();
    return {
      district: u?.district || '',
      taluka: u?.taluka || '',
      gramPanchayat: u?.gram_panchayat || '',
    };
  });
  const today = new Date().toLocaleDateString('en-GB');

  return (
    <div className="cert-root bg-gray-100 p-4 print:p-0" style={{ colorScheme: 'light' }}>
      <style>{`
        .cert-sheet { width: 210mm; max-width: 100%; margin: 0 auto; background:#fff; box-shadow: 0 2px 12px rgba(0,0,0,.15); }
        .cert-frame { box-sizing: border-box; margin: 8mm; padding: 9mm 10mm;
                      border: 3px double #111;
                      min-height: 277mm;
                      -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { background: transparent !important; }
          .no-print { display:none !important; }
          /* transparent backgrounds so pre-printed government coloured/watermarked
             paper shows through — only the black borders + text get printed */
          .cert-root { background: transparent !important; padding:0 !important; }
          .cert-sheet { width:100% !important; max-width:none !important; box-shadow:none !important; margin:0 !important; background: transparent !important; }
          /* fill the printable height (A4 297 − 2×8mm page margin ≈ 281mm) so the
             border sits the SAME distance from top and bottom */
          .cert-frame { margin:0 !important; padding: 7mm 8mm !important; min-height: 265mm !important; background: transparent !important; }
        }
      `}</style>

      {canPrint && (
        <div className="no-print mb-4 flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-md bg-green-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-green-700"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      )}

      <div className="cert-sheet text-black">
        <div className="cert-frame flex flex-col">
          {/* Letterhead */}
          <div className="text-center">
            <p className="text-[19px] font-bold leading-tight">ग्रामपंचायत कार्यालय, {loc.gramPanchayat || '—'}</p>
            <p className="text-sm">ता. {loc.taluka || '—'} &nbsp;·&nbsp; जि. {loc.district || '—'}</p>
            <div className="my-3 w-full border-t-2 border-black" />
            <p className="inline-block rounded border-2 border-black px-8 py-1 text-base font-bold">{title}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-700">{subtitle}</p>}
          </div>

          {/* Outward no + date */}
          <div className="mt-6 flex justify-between text-sm">
            <span>जावक क्र.: {outwardNo || '________'}</span>
            <span>दिनांक: {today}</span>
          </div>

          {/* Body — per-certificate content */}
          <div className="mt-5 text-[15px] leading-7">{children}</div>

          {/* Standard notes (fills the page + official) */}
          <div className="mt-4 text-[12px] leading-5 text-gray-700">
            <p className="font-semibold">सूचना :</p>
            <p>१. सदर प्रमाणपत्र अर्जदाराने दिलेल्या माहितीच्या व ग्रामपंचायत दप्तरी असलेल्या नोंदींच्या आधारे देण्यात आले आहे.</p>
            <p>२. खोटी अथवा दिशाभूल करणारी माहिती दिल्यास संबंधितांवर कायदेशीर कारवाई होऊ शकते.</p>
            <p>३. हे प्रमाणपत्र शासकीय / निमशासकीय कामकाजासाठी वैध आहे.</p>
          </div>

          {/* Place + date  +  QR authenticity check (once saved) */}
          <div className="mt-3 flex items-end justify-between">
            <div className="text-xs">
              <p>ठिकाण : {loc.gramPanchayat || '—'}</p>
              <p>दिनांक : {today}</p>
            </div>
            {verifyUrl && (
              <div className="flex flex-col items-center text-center">
                <QRCodeSVG value={verifyUrl} size={68} level="M" marginSize={0} />
                <span className="mt-0.5 text-[9px] leading-tight text-gray-600">
                  सत्यता पडताळणीसाठी<br />स्कॅन करा
                </span>
              </div>
            )}
          </div>

          {/* Footer / signatures — kept above the bottom so the office stamp fits below */}
          <div className="mt-12 mb-10 -mx-4 flex items-end justify-between text-sm">
            <div className="pl-2 text-center">
              <div className="mb-1 h-12" />
              <p className="border-t border-black px-4 pt-1">ग्रामसेवक</p>
              <p className="text-xs">ग्रामपंचायत {loc.gramPanchayat}</p>
            </div>
            <div className="pr-2 text-center">
              <div className="mb-1 h-12" />
              <p className="border-t border-black px-4 pt-1">सरपंच</p>
              <p className="text-xs">ग्रामपंचायत {loc.gramPanchayat}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateLayout;

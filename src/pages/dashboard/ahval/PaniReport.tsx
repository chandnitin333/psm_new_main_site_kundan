import { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { commonDdlService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';

/* पाणी व्यवस्था यादी (ward-wise) — same as old `ward-wise-pinyache-pani-list`.
   Ward number is passed via sessionStorage ('paniReportWard') from the Pani List page. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const PaniReport = () => {
  const [ward, setWard] = useState('');
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loc] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        district: u.district || u.district_name || u.jilha || '',
        taluka: u.taluka || u.taluka_name || u.tahsil || '',
        gramPanchayat: u.gram_panchayat || u.gramPanchayat || u.gram_panchayat_name || '',
      };
    } catch {
      return { district: '', taluka: '', gramPanchayat: '' };
    }
  });

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.title = 'पाणी व्यवस्था यादी';
    const w = sessionStorage.getItem('paniReportWard') || '';
    setWard(w);
    (async () => {
      try {
        // Public (scanned-QR) mode: use the embedded snapshot instead of fetching.
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        if (w !== '') {
          const res = await commonDdlService.getAadharWardList(w);
          if (res.success) setRecords((res.data as Row[]) || []);
        }
      } catch (e) {
        console.error('Failed to load pani ward list', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // params kept for the QR share (so a scan re-opens this exact report)
  const shareParams = (() => {
    try { return JSON.parse(sessionStorage.getItem('paniReportWard') || '{}'); } catch { return { ward: sessionStorage.getItem('paniReportWard') || '' }; }
  })();
  const qrUrl = useReportShareUrl({
    reportType: 'pani', sessionKey: 'paniReportWard',
    params: shareParams, data: records, enabled: !isPublicReportMode(),
  });

  const th = 'border border-black px-2 py-1 text-[12px] font-bold text-center bg-gray-100';
  const td = 'border border-black px-2 py-1 text-[12px] text-center align-middle';

  return (
    <div className="pani-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .pani-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 portrait; margin: 20mm 8mm 10mm 14mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .pani-report { padding: 0 !important; min-height: 0; }
          /* print-only: enlarge cell text for readability (screen unaffected) */
          .pani-report th, .pani-report td { font-size: 14px !important; line-height: 1.35 !important; padding: 5px 8px !important; }
          .pani-report thead { display: table-header-group; }
        }`}</style>

      <div className="no-print mb-4 flex items-center gap-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        <div className="text-center">
          <p className="font-bold text-lg">पाणी व्यवस्था यादी</p>
        </div>
        <div className="text-sm font-bold mt-1">वार्ड नं :- {ward}</div>
        <div className="flex justify-between text-sm mt-1 mb-2">
          <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
          <span>तहसील :- {loc.taluka}</span>
          <span className="relative">
            {qrUrl && (
              <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 2, zIndex: 10 }}>
                <QRCodeSVG value={qrUrl} size={56} level="M" marginSize={0} />
              </span>
            )}
            जिल्हा :- {loc.district}
          </span>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>अ.क्र</th>
              <th className={th}>मालमत्ता क्र.</th>
              <th className={th}>खातेधारकाचे नाव</th>
              <th className={th}>भोगवटदाराचे नाव</th>
              <th className={th}>पाण्याची व्यवस्था</th>
              <th className={th}>पान नं.</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className={td} colSpan={6}>
                  {loading ? 'लोड होत आहे...' : 'या वार्डसाठी माहिती उपलब्ध नाही'}
                </td>
              </tr>
            ) : (
              records.map((item, i) => (
                <tr key={i}>
                  <td className={td}>{s(item.anu_kramank)}</td>
                  <td className={td}>{s(item.malmatta_number)}</td>
                  <td className={td}>{s(item.ghar_malkache_nav)}</td>
                  <td className={td}>{s(item.bhogavat_darache_nav)}</td>
                  <td className={td}>{s(item.pinyacha_panyachi_vyavastha)}</td>
                  <td className={td}>1</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaniReport;

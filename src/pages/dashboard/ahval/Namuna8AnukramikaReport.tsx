import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';

/* नमुना ८ अनुक्रमणिका — same as old `namuna-8-anukramika-list`.
   Flat index table of properties. Filters via sessionStorage 'anukramikaParams'. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const Namuna8AnukramikaReport = () => {
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
    document.title = 'नमुना ८ अनुक्रमणिका';
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('anukramikaParams') || '{}');
    } catch {
      params = {};
    }
    setWard(params.ward || '');
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load anukramika', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const th = 'border border-black px-2 py-1 text-[12px] font-bold text-center bg-gray-100';
  const td = 'border border-black px-2 py-1 text-[12px] text-center align-middle';

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('anukramikaParams') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'namuna8-anukramika', sessionKey: 'anukramikaParams', params: shareParams, data: records, enabled: !isPublicReportMode() });

  return (
    <div className="anuk-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .anuk-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 portrait; margin: 20mm 8mm 8mm 8mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .anuk-report { padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }`}</style>

      <div className="no-print mb-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="mx-auto" style={{ maxWidth: '950px' }}>
        <div className="text-center">
          <p className="font-bold text-lg">नमुना ८ अनुक्रमणिका</p>
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
              <th className={th}>वार्ड क्रं.</th>
              <th className={th}>खातेधारकाचे नाव</th>
              <th className={th}>भोगवटदाराचे नाव</th>
              <th className={th}>मिलकत प्रकार</th>
              <th className={th}>पत्ता</th>
              <th className={th}>पान नं.</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className={td} colSpan={8}>
                  {loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}
                </td>
              </tr>
            ) : (
              records.map((item, i) => (
                <tr key={i}>
                  <td className={td}>{s(item.anu_kramank)}</td>
                  <td className={td}>{s(item.malmatta_number)}</td>
                  <td className={td}>{s(item.ward_kramnak)}</td>
                  <td className={td}>{s(item.ghar_malkache_nav)}</td>
                  <td className={td}>{s(item.bhogavat_darache_nav)}</td>
                  <td className={td}>{s(item.milkat_prakar)}</td>
                  <td className={td}>{s(item.patta_nagar_layout_society)}</td>
                  <td className={td}>{s(item.anu_kramank)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Namuna8AnukramikaReport;

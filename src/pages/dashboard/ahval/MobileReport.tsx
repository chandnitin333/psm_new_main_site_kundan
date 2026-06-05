import { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { commonDdlService } from '../../../services';

/* मोबाईल क्रमांक यादी (ward-wise) — same as old `ward-wise-mobile-no-list`.
   Ward number is passed via sessionStorage ('mobileReportWard') from the Mobile List page. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const MobileReport = () => {
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
    document.title = 'मोबाईल क्रमांक यादी';
    const w = sessionStorage.getItem('mobileReportWard') || '';
    setWard(w);
    (async () => {
      try {
        if (w !== '') {
          const res = await commonDdlService.getAadharWardList(w);
          if (res.success) setRecords((res.data as Row[]) || []);
        }
      } catch (e) {
        console.error('Failed to load mobile ward list', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const th = 'border border-black px-2 py-1 text-[12px] font-bold text-center bg-gray-100';
  const td = 'border border-black px-2 py-1 text-[12px] text-center align-middle';

  return (
    <div className="mobile-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .mobile-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .mobile-report { padding: 0 !important; min-height: 0; }
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
          <p className="font-bold text-lg">मोबाईल क्रमांक यादी</p>
        </div>
        <div className="text-sm font-bold mt-1">वार्ड नं :- {ward}</div>
        <div className="flex justify-between text-sm mt-1 mb-2">
          <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
          <span>तहसील :- {loc.taluka}</span>
          <span>जिल्हा :- {loc.district}</span>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>अ.क्र</th>
              <th className={th}>मालमत्ता क्र.</th>
              <th className={th}>खातेधारकाचे नाव</th>
              <th className={th}>भोगवटदाराचे नाव</th>
              <th className={th}>मोबाईल नं.</th>
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
                  <td className={td}>{s(item.mobile_number)}</td>
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

export default MobileReport;

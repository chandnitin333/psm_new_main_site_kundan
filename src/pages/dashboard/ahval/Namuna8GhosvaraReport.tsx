import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { nodniService } from '../../../services';
import { getPublicReportData } from '../../../utils/publicReport';

/* गोषवारा नमुना ८ — same as old `get-namuna-8-ghosvara`.
   Aggregate summary: per tax type, count of properties + total amount. Filters via 'ghosvaraParams'. */

type Row = Record<string, unknown>;

const Namuna8GhosvaraReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cy, setCy] = useState<number>(new Date().getFullYear());
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
    document.title = 'गोषवारा नमुना ८';
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('ghosvaraParams') || '{}');
    } catch {
      params = {};
    }
    if (params.year && !isNaN(Number(params.year))) setCy(Number(params.year));
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load ghosvara', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- aggregate per tax type ----
  const taxOf = (n: Row, id: number) => {
    const ot = (n.other_tax_calculation as Row[]) || [];
    const r = ot.find((t) => Number(t.tax_id) === id);
    return r && r.tax_rate != null ? Number(r.tax_rate) : 0;
  };
  const manoraOf = (n: Row) =>
    ((n.manoryache_kar_aakarani as Row[]) || []).reduce(
      (sum, it) => sum + Number(it.ekun_shetrafal_choras_foot || 0) * Number(it.aakarani_dar || 0) * (Number(it.majla) || 1),
      0,
    );

  const heads = [
    { label: 'गृह व भूमीकर', amt: (n: Row) => Number(n.gruhkar_v_bhumikar || 0) },
    { label: 'दिवाबत्ती कर', amt: (n: Row) => taxOf(n, 1) },
    { label: 'आरोग्य रक्षण कर', amt: (n: Row) => taxOf(n, 2) },
    { label: 'सफाई कर', amt: (n: Row) => taxOf(n, 3) },
    { label: 'सामान्य पाणी कर', amt: (n: Row) => taxOf(n, 4) },
    { label: 'विशेष पाणी कर', amt: (n: Row) => taxOf(n, 5) },
    { label: 'औधोगिक / इतर', amt: (n: Row) => taxOf(n, 6) },
    { label: 'मनोरा', amt: manoraOf },
  ];

  const rows = heads.map((h) => {
    let count = 0;
    let total = 0;
    records.forEach((n) => {
      const v = h.amt(n);
      if (v > 0) count += 1;
      total += v;
    });
    return { label: h.label, count, total };
  });
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const totalHouses = records.length;
  const round = (v: number) => Math.round(v).toString();

  const box = 'border border-black px-2 py-2 text-[14px] text-center flex items-center justify-center min-h-[40px]';


  return (
    <div className="ghos-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .ghos-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 portrait; margin: 24mm 12mm 8mm 12mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .ghos-report { padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }`}</style>

      <div className="no-print mb-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        {/* Title — full-width bordered box (connects to the boxes below) */}
        <div className="w-full border border-black text-center mb-4">
          <p className="font-bold text-[18px] py-1.5 border-b border-black">गोषवारा नमुना ८</p>
          <p className="text-[14px] py-1.5">कर मागणी सन {cy}-{cy + 1} ते {cy + 3}-{cy + 4}</p>
        </div>

        {/* जिल्हा / तहसील / ग्रामपंचायत — 3 separate boxes with gaps (old bootstrap col-md-4) */}
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className={box}>जिल्हा :- {loc.district}</div>
          <div className={box}>तहसील :- {loc.taluka}</div>
          <div className={box}>ग्रामपंचायत :- {loc.gramPanchayat}</div>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className={box}>एकूण घराची संख्या</div>
          <div className={box}>कराचे प्रकार</div>
          <div className={box}>ऐकून रक्कम</div>
        </div>

        {/* Tax rows — each cell its own bordered box, gaps between */}
        {loading ? (
          <p className="text-center text-gray-500 py-4">लोड होत आहे...</p>
        ) : (
          <>
            {rows.map((r) => (
              <div key={r.label} className="grid grid-cols-3 gap-4 mb-2">
                <div className={box}>{r.count}</div>
                <div className={box}>{r.label}</div>
                <div className={box}>{round(r.total)}</div>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div className={box}>{totalHouses}</div>
              <div className={box}>एकुण</div>
              <div className={box}>{round(grandTotal)}</div>
            </div>
          </>
        )}

        <p className="text-center text-[14px] mt-4 leading-relaxed">
          ग्रामपंचायत मासिक सभा दि. ........./........./........... ठराव क्रं. .............. अन्वये गृहकर व भूमीकर, दिवाबत्ती कर, आरोग्य रक्षण कर, सफाई कर व पाणी पट्टी कर सन {cy}-{cy + 1} ते {cy + 3}-{cy + 4} करीत सदर कर आकारणी "कर आकारणी समिती" कडून अंतिम करण्यात येत आहे.
        </p>

        {/* Signature block 1 — 3 columns */}
        <div className="flex justify-between text-[13px] font-medium mt-12 text-center">
          <span className="flex-1">गसरपंच</span>
          <span className="flex-1">सचिव</span>
          <span className="flex-1">विस्तार अधिकारी</span>
        </div>
        <div className="flex justify-between text-[11px] mt-1 text-center">
          <span className="flex-1">गट ग्रामपंचायत डेमो पं. स. नागपूर ग्रामीण</span>
          <span className="flex-1">गट ग्रामपंचायत डेमो पं. स. नागपूर ग्रामीण</span>
          <span className="flex-1">(पंचा)तथा सदस्य कर आकारणी समिती डेमो</span>
        </div>

        {/* Signature block 2 — 5 columns */}
        <div className="flex justify-between text-[12px] font-medium mt-12 text-center gap-2">
          <span className="flex-1">सरपंच तथा अध्यक्ष</span>
          <span className="flex-1">उपसरपंच तथा अध्यक्ष</span>
          <span className="flex-1">शा.अभियंता</span>
          <span className="flex-1">ग्रामसेवक तथा सदस्य व सचिव</span>
          <span className="flex-1">खंड विकास अधिकारी</span>
        </div>
        <div className="flex justify-between text-[10px] mt-1 text-center gap-2">
          <span className="flex-1">कर आकारणी समिती डेमो</span>
          <span className="flex-1">कर आकारणी समिती डेमो</span>
          <span className="flex-1">(जि. प. बांधकाम) तथा सदस्य कर आकारणी समिती डेमो</span>
          <span className="flex-1">कर आकारणी समिती डेमो</span>
          <span className="flex-1">कर आकारणी समिती डेमो</span>
        </div>
      </div>
    </div>
  );
};

export default Namuna8GhosvaraReport;

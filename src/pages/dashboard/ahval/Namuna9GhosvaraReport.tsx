import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';

/* गोषवारा नमुना ९ — same as old `get-namuna-9-ghosvara`.
   Per-tax मागील / चालू / एकुण / चालू खातेदार summary for a ward. Filters via 'namuna9GhosvaraParams'. */

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v || 0);
const r0 = (v: number) => Math.round(v).toString();

const Namuna9GhosvaraReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [ward, setWard] = useState('');
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
    document.title = 'गोषवारा नमुना ९';
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('namuna9GhosvaraParams') || '{}');
    } catch {
      params = {};
    }
    setWard(params.ward || '');
    if (params.year && !isNaN(Number(params.year))) setCy(Number(params.year));
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load namuna-9 ghosvara', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // aggregate one sillak head across all records
  const agg = (key: string) => {
    let magil = 0, chalu = 0, count = 0;
    records.forEach((n) => {
      const sj = (n.sillak_joda as Row) || {};
      const sp = (n.sillak_joda_prev as Row) || {};
      const c = num(sj[key]);
      magil += num(sp[key]);
      chalu += c;
      if (c > 0) count += 1;
    });
    return { magil, chalu, ekun: magil + chalu, count };
  };
  // manora (चालू only — computed per property)
  const manoraAgg = () => {
    let chalu = 0, count = 0;
    records.forEach((n) => {
      const mk = ((n.manoryache_kar_aakarani as Row[]) || []).reduce(
        (sum, it) => sum + num(it.ekun_shetrafal_choras_foot) * num(it.aakarani_dar) * (num(it.majla) || 1),
        0,
      );
      chalu += mk;
      if (mk > 0) count += 1;
    });
    return { magil: 0, chalu, ekun: chalu, count };
  };

  const gruh = agg('gruhkar_v_bhumikar');
  const diva = agg('viz_divabatti_kar');
  const aarogya = agg('aarogya_rakshan_kar');
  const audhogik = agg('etar_fees');
  const mano = manoraAgg();
  const samanya = agg('samanya_pani_kar');
  const vishesh = agg('vishesh_pani_kar');

  type Agg = { magil: number; chalu: number; ekun: number; count: number };
  const sumA = (...as: Agg[]): Agg => as.reduce(
    (t, a) => ({ magil: t.magil + a.magil, chalu: t.chalu + a.chalu, ekun: t.ekun + a.ekun, count: t.count + a.count }),
    { magil: 0, chalu: 0, ekun: 0, count: 0 },
  );
  // distinct खातेदार count — records that have ANY of the given heads > 0 (not a sum of per-tax counts)
  const manoraVal = (n: Row) => ((n.manoryache_kar_aakarani as Row[]) || []).reduce(
    (sum, it) => sum + num(it.ekun_shetrafal_choras_foot) * num(it.aakarani_dar) * (num(it.majla) || 1), 0,
  );
  const distinctCount = (keys: string[], includeManora = false) =>
    records.filter((n) => {
      const sj = (n.sillak_joda as Row) || {};
      return keys.some((k) => num(sj[k]) > 0) || (includeManora && manoraVal(n) > 0);
    }).length;

  const t1 = { ...sumA(gruh, diva, aarogya), count: distinctCount(['gruhkar_v_bhumikar', 'viz_divabatti_kar', 'aarogya_rakshan_kar']) };
  const t2 = { ...sumA(audhogik, mano), count: distinctCount(['etar_fees'], true) };
  const t3 = { ...sumA(samanya, vishesh), count: distinctCount(['samanya_pani_kar', 'vishesh_pani_kar']) };
  const grand = {
    ...sumA(sumA(gruh, diva, aarogya), sumA(audhogik, mano), sumA(samanya, vishesh)),
    count: distinctCount(
      ['gruhkar_v_bhumikar', 'viz_divabatti_kar', 'aarogya_rakshan_kar', 'etar_fees', 'samanya_pani_kar', 'vishesh_pani_kar'],
      true,
    ),
  };

  const th = 'border border-black px-2 py-1 text-[12px] font-bold text-center align-middle bg-gray-100';
  const td = 'border border-black px-2 py-1 text-[12px] text-center align-middle';
  const tdL = 'border border-black px-2 py-1 text-[12px] text-left align-middle font-medium';

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('namuna9GhosvaraParams') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'namuna9-ghosvara', sessionKey: 'namuna9GhosvaraParams', params: shareParams, data: records, enabled: !isPublicReportMode() });

  const Cols = () => (
    <colgroup>
      <col style={{ width: '15%' }} />
      <col style={{ width: '25%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '15%' }} />
    </colgroup>
  );
  const dataRow = (no: string, label: string, a: Agg, bold = false) => (
    <tr className={bold ? 'font-bold' : ''}>
      <td className={td}>{no}</td>
      <td className={tdL}>{label}</td>
      <td className={td}>{r0(a.magil)}</td>
      <td className={td}>{r0(a.chalu)}</td>
      <td className={td}>{r0(a.ekun)}</td>
      <td className={td}>{a.count}</td>
    </tr>
  );
  // summary row — label spans first 2 columns (अनु + कराचे प्रकार)
  const sumRow = (label: string, a: Agg, bold = false) => (
    <tr className={bold ? 'font-bold' : ''}>
      <td className={`${td} font-bold`} colSpan={2}>{label}</td>
      <td className={td}>{r0(a.magil)}</td>
      <td className={td}>{r0(a.chalu)}</td>
      <td className={td}>{r0(a.ekun)}</td>
      <td className={td}>{a.count}</td>
    </tr>
  );

  return (
    <div className="ng9-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .ng9-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 portrait; margin: 24mm 8mm 10mm 14mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .ng9-report { padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          /* print-only: enlarge cell text for readability (screen unaffected) */
          .ng9-report th, .ng9-report td { font-size: 14px !important; line-height: 1.35 !important; padding: 5px 8px !important; }
          .ng9-report thead { display: table-header-group; }
        }`}</style>

      <div className="no-print mb-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="mx-auto relative" style={{ maxWidth: '1100px' }}>
        {qrUrl && (
          <div style={{ position: 'absolute', top: 0, right: 18, zIndex: 10 }}>
            <QRCodeSVG value={qrUrl} size={56} level="M" marginSize={0} />
          </div>
        )}
        <div className="text-center">
          <p className="font-bold text-lg">गोषवारा नमुना ९</p>
          <p className="text-sm">ग्रामपंचायत :- {loc.gramPanchayat} &nbsp; तहसील :- {loc.taluka} &nbsp; जिल्हा :- {loc.district}</p>
          <p className="text-sm">सन {cy} - {cy + 1} मागणी गोषवारा</p>
        </div>
        <div className="text-sm font-bold mt-1 mb-2">वार्ड नं :- {ward}</div>

        {loading ? (
          <p className="text-center text-gray-500 py-6">लोड होत आहे...</p>
        ) : (
          <>
            {/* Table 1 — गृह/दिवा/आरोग्य */}
            <table className="w-full table-fixed border-collapse mb-2">
              <Cols />
              <thead>
                <tr>
                  <th className={th}>अनु.क्रमांक</th>
                  <th className={th}>कराचे प्रकार</th>
                  <th className={th}>मागील</th>
                  <th className={th}>चालू</th>
                  <th className={th}>एकुण</th>
                  <th className={th}>चालू खातेदार</th>
                </tr>
              </thead>
              <tbody>
                {dataRow('1', 'गृहकर व भुमीकर', gruh)}
                {dataRow('2', 'दिवाबत्ती कर', diva)}
                {dataRow('3', 'आरोग्य रक्षण कर', aarogya)}
                {sumRow('एकुण', t1, true)}
              </tbody>
            </table>

            {/* Table 2 — औधोगिक/मनोरा */}
            <table className="w-full table-fixed border-collapse mb-2">
              <Cols />
              <tbody>
                {dataRow('4', 'औधोगिक कर', audhogik)}
                {dataRow('5', 'मनोरा', mano)}
                {sumRow('एकुण', t2, true)}
              </tbody>
            </table>

            {/* Table 3 — पाणी */}
            <table className="w-full table-fixed border-collapse mb-2">
              <Cols />
              <tbody>
                {dataRow('6', 'सामान्य पाणी कर', samanya)}
                {dataRow('7', 'विशेष पाणी कर', vishesh)}
                {sumRow('एकुण', t3, true)}
              </tbody>
            </table>

            {/* Table 4 — grouped summary (label spans 2 columns) */}
            <table className="w-full table-fixed border-collapse mb-2">
              <Cols />
              <tbody>
                {sumRow('गृहकर व भुमीकर, दिवाबत्ती कर, आरोग्य रक्षण कर', t1)}
                {sumRow('औधोगिक कर, मनोरा', t2)}
                {sumRow('सामान्य पाणी कर, विशेष पाणी कर', t3)}
                {sumRow('एकुण', grand, true)}
              </tbody>
            </table>

            <p className="text-center text-[12px] mt-4 leading-relaxed">
              ग्रामपंचायत मासिक सभा दि. ........./........./........... ठराव क्रं. .............. अन्वये गृहकर व भूमीकर, दिवाबत्ती कर, आरोग्य रक्षण कर, सफाई कर, सामान्य पाणी कर व विशेष पाणी कर सन {cy} - {cy + 1} करीत मान्य करण्यात आले आहे.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Namuna9GhosvaraReport;

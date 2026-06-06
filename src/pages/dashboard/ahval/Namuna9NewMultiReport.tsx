import { useEffect, useState } from 'react';
import { nodniService } from '../../../services';

/* नमुना ९ न्यू — same as old `get-namuna-9-new`. One row per property (खातेधारक-wise),
   मागणी/वसुली per-tax मागील/चालू/एकूण columns. Filters via sessionStorage 'namuna9NewParams'. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : Math.round(num).toString();
};
const num = (v: unknown) => Number(v || 0);

const td = 'border border-black px-0.5 py-0.5 text-[9px] align-middle text-center';
const tdL = 'border border-black px-0.5 py-0.5 text-[9px] align-middle text-left';
const th = 'border border-black px-0.5 py-0.5 text-[8.5px] align-middle text-center font-bold bg-gray-100';
const thv = `${th} n9n-vert`;
const colW = [
  28, 38, 110,
  34, 34, 30, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34,
  46,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  46,
];
const tableW = colW.reduce((a, b) => a + b, 0);

const RecordBlock = ({ n }: { n: Row }) => {
  const sj = (n.sillak_joda as Row) || {};
  const sjPrev = (n.sillak_joda_prev as Row) || {};
  const cur = (k: string) => num(sj[k]);
  const prev = (k: string) => num(sjPrev[k]);
  const pcPrev = (k: string) => num(sjPrev[k]);

  // per head: मागील (prev base), चालू (cur base), एकूण = मागील + दंड + (चालू − सूट)
  const ekun = (mKey: string, dandKey: string, sutKey: string) => {
    const m = prev(mKey);
    const c = cur(mKey);
    const d = pcPrev(dandKey);
    const su = num(sj[sutKey]);
    return m + (m * d) / 100 + (c - (c * su) / 100);
  };
  const gMagil = prev('gruhkar_v_bhumikar'), gChalu = cur('gruhkar_v_bhumikar');
  const gDand = pcPrev('5_percent_addition_gvb');
  const gEkun = ekun('gruhkar_v_bhumikar', '5_percent_addition_gvb', '5_percent_discount_gvb');
  const vMagil = prev('viz_divabatti_kar'), vChalu = cur('viz_divabatti_kar');
  const vEkun = ekun('viz_divabatti_kar', '5_percent_addition_vdk', '5_percent_discount_vdk');
  const aMagil = prev('aarogya_rakshan_kar'), aChalu = cur('aarogya_rakshan_kar');
  const aEkun = ekun('aarogya_rakshan_kar', '5_percent_addition_ark', '5_percent_discount_ark');
  const pMagil = prev('samanya_pani_kar') + prev('vishesh_pani_kar');
  const pChalu = cur('samanya_pani_kar') + cur('vishesh_pani_kar');
  const pEkun =
    ekun('samanya_pani_kar', '5_percent_addition_spk', '5_percent_discount_spk') +
    ekun('vishesh_pani_kar', '5_percent_addition_vpk', '5_percent_discount_vpk');

  const name = s(n.milkat_prakar) === 'इमलाकर' ? s(n.bhogavat_darache_nav) : s(n.ghar_malkache_nav);
  const blanks = (key: string, count: number) => Array.from({ length: count }).map((_, k) => <td key={`${key}-${k}`} className={td} />);

  return (
    <tr>
      <td className={td}>{s(n.anu_kramank)}</td>
      <td className={td}>{s(n.malmatta_number)}</td>
      <td className={tdL}>{name}</td>
      {/* मागणी — गृह कर (मागील/चालू/5%दंड/एकूण) */}
      <td className={td}>{f(gMagil)}</td>
      <td className={td}>{f(gChalu)}</td>
      <td className={td}>{f(gDand)}</td>
      <td className={`${td} font-bold`}>{f(gEkun)}</td>
      {/* दिवाबत्ती कर (मागील/चालू/एकूण) */}
      <td className={td}>{f(vMagil)}</td>
      <td className={td}>{f(vChalu)}</td>
      <td className={`${td} font-bold`}>{f(vEkun)}</td>
      {/* आरोग्य रक्षण कर */}
      <td className={td}>{f(aMagil)}</td>
      <td className={td}>{f(aChalu)}</td>
      <td className={`${td} font-bold`}>{f(aEkun)}</td>
      {/* पाणी पट्टी */}
      <td className={td}>{f(pMagil)}</td>
      <td className={td}>{f(pChalu)}</td>
      <td className={`${td} font-bold`}>{f(pEkun)}</td>
      {/* पावती */}
      <td className={td} />
      {/* वसुली side — blank (गृह/दिवा/आरोग्य/पाणी × मागील/चालू/एकूण) */}
      {blanks('v', 12)}
      {/* शेरा */}
      <td className={td} />
    </tr>
  );
};

const Namuna9NewMultiReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cy, setCy] = useState<number>(new Date().getFullYear());
  const [zoom, setZoom] = useState(1.25); // SCREEN-only default zoom (125%); does not affect print
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
    document.title = 'नमुना ९ न्यू';
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('namuna9NewParams') || '{}');
    } catch {
      params = {};
    }
    if (params.year && !isNaN(Number(params.year))) setCy(Number(params.year));
    (async () => {
      try {
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load namuna-9-new', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="n9n-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .n9n-report { min-height: 100vh; background: #fff; }
        .n9n-vert { writing-mode: vertical-rl; text-orientation: mixed; white-space: nowrap; }
        @media print {
          @page { size: A4 landscape; margin: 6mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .n9n-report { zoom: 0.78; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .n9n-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n9n-zoom { zoom: 1 !important; }
        }`}</style>

      <div className="no-print mb-4 flex items-center gap-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors"
        >
          🖨️ Print / Save as PDF
        </button>
        <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
          <span className="px-2 text-sm font-medium text-gray-500 select-none">Zoom</span>
          <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors" title="Zoom out">−</button>
          <span className="w-14 text-center text-sm font-semibold text-gray-700 tabular-nums select-none">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))} className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors" title="Zoom in">+</button>
          <button onClick={() => setZoom(1)} className="ml-1 h-8 rounded px-3 text-xs font-medium text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors" title="Reset zoom">Reset</button>
        </div>
      </div>

      <div className="n9n-wrap overflow-x-auto">
        <div className="n9n-zoom mx-auto" style={{ width: `${tableW}px`, zoom }}>
          <div className="text-center">
            <p className="font-bold text-lg">नमुना ९</p>
            <p className="text-sm">सन. {cy} - {cy + 1} च्या आकारणी केलेल्या करांच्या मागणीचे नोंदणी पुस्तक</p>
          </div>
          <div className="flex justify-between text-sm mt-1 mb-1">
            <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
            <span>तहसील :- {loc.taluka}</span>
            <span>जिल्हा :- {loc.district}</span>
          </div>

          <table className="table-fixed border-collapse" style={{ width: `${tableW}px` }}>
            <colgroup>{colW.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
            <thead>
              <tr>
                <th className={thv} rowSpan={3}>अनु. क्रमांक</th>
                <th className={thv} rowSpan={3}>मालमत्ता क्रमांक</th>
                <th className={th} rowSpan={3}>खातेधारकाचे नाव</th>
                <th className={th} colSpan={7}>मागणी</th>
                <th className={th} colSpan={3} rowSpan={2}>आरोग्य रक्षण कर</th>
                <th className={th} colSpan={3} rowSpan={2}>पाणी पट्टी</th>
                <th className={th} rowSpan={3}>पावती नंबर व तारीख</th>
                <th className={th} colSpan={6}>वसुली</th>
                <th className={th} colSpan={3} rowSpan={2}>आरोग्य रक्षण कर</th>
                <th className={th} colSpan={3} rowSpan={2}>पाणी पट्टी</th>
                <th className={th} rowSpan={3}>शेरा</th>
              </tr>
              <tr>
                <th className={th} colSpan={4}>गृह कर</th>
                <th className={th} colSpan={3}>दिवाबत्ती कर</th>
                <th className={th} colSpan={3}>गृह कर</th>
                <th className={th} colSpan={3}>दिवाबत्ती कर</th>
              </tr>
              <tr>
                <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>५% दंड</th><th className={thv}>एकूण</th>
                <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>एकूण</th>
                <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>एकूण</th>
                <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>एकूण</th>
                <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>एकूण</th>
                <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>एकूण</th>
                <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>एकूण</th>
                <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>एकूण</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td className={td} colSpan={30}>{loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}</td></tr>
              ) : (
                records.map((n, i) => <RecordBlock key={i} n={n} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Namuna9NewMultiReport;

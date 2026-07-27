import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';
import { fyLabel } from '../../../utils/fyConfig';

/* नमुना ९ न्यू — same as old `get-namuna-9-new`. One row per property (खातेधारक-wise),
   मागणी/वसुली per-tax मागील/चालू/एकूण columns. Filters via sessionStorage 'namuna9NewParams'.

   side (front/back) + orientation (portrait/landscape) — optional, from launcher:
   - side === ''      → full report as-is (मागणी + वसुली in one wide table, continuous).
   - side === 'front' → only मागणी columns, paginated (portrait 10 / landscape 6 per page).
   - side === 'back'  → only वसुली columns, paginated (portrait 10 / landscape 6 per page). */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : Math.round(num).toString();
};
const num = (v: unknown) => Number(v || 0);

const td = 'border border-black px-0.5 py-2 text-[9px] align-middle text-center';
const tdL = 'border border-black px-0.5 py-2 text-[9px] align-middle text-left';
const th = 'border border-black px-0.5 py-0.5 text-[8.5px] align-middle text-center font-bold bg-gray-100';
const thv = `${th} n9n-vert`;

/* full (combined) layout column widths — मागणी गृह कर now 3 cols (५% दंड removed) */
const colW = [
  28, 38, 110,
  34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34,
  46,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  46,
];
const tableW = colW.reduce((a, b) => a + b, 0);

/* front (मागणी): अनु | मालमत्ता | नाव | गृह(3) | दिवा(3) | आरोग्य(3) | पाणी(3) | गृह+विज+आरोग्य दंड(3) | सामान्य+विशेष पाणी दंड(3) | पावती  = 22 cols */
const colWFront = [30, 44, 150, 42, 42, 48, 40, 40, 48, 40, 40, 48, 40, 40, 48, 42, 42, 48, 42, 42, 48, 58];
const tableWFront = colWFront.reduce((a, b) => a + b, 0);
/* back (वसुली): अनु | मालमत्ता | नाव | पावती | गृह(3) | दिवा(3) | आरोग्य(3) | पाणी(3) | गृह+विज+आरोग्य दंड(3) | सामान्य+विशेष पाणी दंड(3) | शेरा = 23 cols */
const colWBack = [30, 44, 150, 58, 42, 42, 48, 42, 42, 48, 42, 42, 48, 42, 42, 48, 42, 42, 48, 42, 42, 48, 58];
const tableWBack = colWBack.reduce((a, b) => a + b, 0);

/* shared per-record computation (used by full + front modes) */
const computeVals = (n: Row) => {
  const sj = (n.sillak_joda as Row) || {};
  const sjPrev = (n.sillak_joda_prev as Row) || {};
  const cur = (k: string) => num(sj[k]);
  const prev = (k: string) => num(sjPrev[k]);
  // per head: मागील (prev base), चालू (cur base), एकूण = मागील + दंड + (चालू − सूट)
  const ekun = (mKey: string, dandKey: string, sutKey: string) => {
    const m = prev(mKey);
    const c = cur(mKey);
    const d = prev(dandKey);
    const su = num(sj[sutKey]);
    // round each component (same as 129 बिल / Namuna9 multi) so totals match everywhere
    return Math.round(m) + Math.round((m * d) / 100) + Math.round(c) - Math.round((c * su) / 100);
  };
  const gMagil = prev('gruhkar_v_bhumikar'), gChalu = cur('gruhkar_v_bhumikar');
  const gDand = prev('5_percent_addition_gvb');
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
  // गृह + विज + आरोग्य दंड — combined (मागील/चालू/एकूण = sum of the three heads)
  const gvaMagil = Math.round(gMagil) + Math.round(vMagil) + Math.round(aMagil);
  const gvaChalu = Math.round(gChalu) + Math.round(vChalu) + Math.round(aChalu);
  const gvaEkun = Math.round(gEkun) + Math.round(vEkun) + Math.round(aEkun);
  // सामान्य + विशेष पाणी दंड — combined (मागील/चालू/एकूण = sum of both पाणी heads)
  const pdMagil = Math.round(prev('samanya_pani_kar')) + Math.round(prev('vishesh_pani_kar'));
  const pdChalu = Math.round(cur('samanya_pani_kar')) + Math.round(cur('vishesh_pani_kar'));
  const pdEkun =
    Math.round(ekun('samanya_pani_kar', '5_percent_addition_spk', '5_percent_discount_spk')) +
    Math.round(ekun('vishesh_pani_kar', '5_percent_addition_vpk', '5_percent_discount_vpk'));
  const name = s(n.milkat_prakar) === 'इमलाकर' ? s(n.bhogavat_darache_nav) : s(n.ghar_malkache_nav);
  return {
    anu: s(n.anu_kramank), malmatta: s(n.malmatta_number), name,
    gMagil, gChalu, gDand, gEkun, vMagil, vChalu, vEkun,
    aMagil, aChalu, aEkun, pMagil, pChalu, pEkun,
    gvaMagil, gvaChalu, gvaEkun, pdMagil, pdChalu, pdEkun,
  };
};

/* ---- FULL (combined) row — unchanged behaviour ---- */
const RecordBlock = ({ n }: { n: Row }) => {
  const v = computeVals(n);
  const blanks = (key: string, count: number) => Array.from({ length: count }).map((_, k) => <td key={`${key}-${k}`} className={td} />);
  return (
    <tr>
      <td className={td}>{v.anu}</td>
      <td className={td}>{v.malmatta}</td>
      <td className={tdL}>{v.name}</td>
      {/* मागणी — गृह कर (मागील/चालू/एकूण) */}
      <td className={td}>{f(v.gMagil)}</td>
      <td className={td}>{f(v.gChalu)}</td>
      <td className={`${td} font-bold`}>{f(v.gEkun)}</td>
      {/* दिवाबत्ती कर (मागील/चालू/एकूण) */}
      <td className={td}>{f(v.vMagil)}</td>
      <td className={td}>{f(v.vChalu)}</td>
      <td className={`${td} font-bold`}>{f(v.vEkun)}</td>
      {/* आरोग्य रक्षण कर */}
      <td className={td}>{f(v.aMagil)}</td>
      <td className={td}>{f(v.aChalu)}</td>
      <td className={`${td} font-bold`}>{f(v.aEkun)}</td>
      {/* पाणी पट्टी */}
      <td className={td}>{f(v.pMagil)}</td>
      <td className={td}>{f(v.pChalu)}</td>
      <td className={`${td} font-bold`}>{f(v.pEkun)}</td>
      {/* पावती */}
      <td className={td} />
      {/* वसुली side — blank (गृह/दिवा/आरोग्य/पाणी × मागील/चालू/एकूण) */}
      {blanks('v', 12)}
      {/* शेरा */}
      <td className={td} />
    </tr>
  );
};

/* ---- FRONT (मागणी only) ---- */
const FrontHead = () => (
  <thead>
    <tr>
      <th className={thv} rowSpan={3}>अनु. क्रमांक</th>
      <th className={thv} rowSpan={3}>मालमत्ता क्रमांक</th>
      <th className={th} rowSpan={3}>खातेधारकाचे नाव</th>
      <th className={th} colSpan={12}>मागणी</th>
      <th className={th} colSpan={3} rowSpan={2}>गृह+विज+आरोग्य दंड</th>
      <th className={th} colSpan={3} rowSpan={2}>सामान्य+विशेष पाणी दंड</th>
      <th className={th} rowSpan={3}>पावती नंबर व तारीख</th>
    </tr>
    <tr>
      <th className={th} colSpan={3}>गृह कर</th>
      <th className={th} colSpan={3}>दिवाबत्ती कर</th>
      <th className={th} colSpan={3}>आरोग्य रक्षण कर</th>
      <th className={th} colSpan={3}>पाणी पट्टी</th>
    </tr>
    <tr>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
    </tr>
  </thead>
);

const FrontRow = ({ n }: { n: Row }) => {
  const v = computeVals(n);
  return (
    <tr>
      <td className={td}>{v.anu}</td>
      <td className={td}>{v.malmatta}</td>
      <td className={tdL}>{v.name}</td>
      <td className={td}>{f(v.gMagil)}</td><td className={td}>{f(v.gChalu)}</td><td className={`${td} font-bold`}>{f(v.gEkun)}</td>
      <td className={td}>{f(v.vMagil)}</td><td className={td}>{f(v.vChalu)}</td><td className={`${td} font-bold`}>{f(v.vEkun)}</td>
      <td className={td}>{f(v.aMagil)}</td><td className={td}>{f(v.aChalu)}</td><td className={`${td} font-bold`}>{f(v.aEkun)}</td>
      <td className={td}>{f(v.pMagil)}</td><td className={td}>{f(v.pChalu)}</td><td className={`${td} font-bold`}>{f(v.pEkun)}</td>
      {/* गृह+विज+आरोग्य दंड (मागील/चालू/एकूण) */}
      <td className={td}>{f(v.gvaMagil)}</td><td className={td}>{f(v.gvaChalu)}</td><td className={`${td} font-bold`}>{f(v.gvaEkun)}</td>
      {/* सामान्य+विशेष पाणी दंड (मागील/चालू/एकूण) */}
      <td className={td}>{f(v.pdMagil)}</td><td className={td}>{f(v.pdChalu)}</td><td className={`${td} font-bold`}>{f(v.pdEkun)}</td>
      <td className={td} />
    </tr>
  );
};

/* ---- BACK (वसुली only — blank columns to fill on recovery) ---- */
const BackHead = () => (
  <thead>
    <tr>
      <th className={thv} rowSpan={3}>अनु. क्रमांक</th>
      <th className={thv} rowSpan={3}>मालमत्ता क्रमांक</th>
      <th className={th} rowSpan={3}>खातेधारकाचे नाव</th>
      <th className={th} rowSpan={3}>पावती नंबर व तारीख</th>
      <th className={th} colSpan={12}>वसुली</th>
      <th className={th} colSpan={3} rowSpan={2}>गृह+विज+आरोग्य दंड</th>
      <th className={th} colSpan={3} rowSpan={2}>सामान्य+विशेष पाणी दंड</th>
      <th className={th} rowSpan={3}>शेरा</th>
    </tr>
    <tr>
      <th className={th} colSpan={3}>गृह कर</th>
      <th className={th} colSpan={3}>दिवाबत्ती कर</th>
      <th className={th} colSpan={3}>आरोग्य रक्षण कर</th>
      <th className={th} colSpan={3}>पाणी पट्टी</th>
    </tr>
    <tr>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
      <th className={th}>मागील</th><th className={th}>चालू</th><th className={th}>एकूण</th>
    </tr>
  </thead>
);

const BackRow = ({ n }: { n: Row }) => {
  const v = computeVals(n);
  return (
    <tr>
      <td className={td}>{v.anu}</td>
      <td className={td}>{v.malmatta}</td>
      <td className={tdL}>{v.name}</td>
      <td className={td} />{/* पावती */}
      {Array.from({ length: 12 }).map((_, k) => <td key={k} className={td} />)}
      {/* गृह+विज+आरोग्य दंड + सामान्य+विशेष पाणी दंड (मागील/चालू/एकूण ×2) — blank for manual recovery entry */}
      {Array.from({ length: 6 }).map((_, k) => <td key={`d${k}`} className={td} />)}
      <td className={td} />{/* शेरा */}
    </tr>
  );
};

type Loc = { district: string; taluka: string; gramPanchayat: string };

const Heading = ({ cy, loc, qrUrl }: { cy: number; loc: Loc; qrUrl?: string }) => (
  <>
    <div className="text-center">
      <p className="font-bold text-lg">नमुना ९</p>
      <p className="text-sm">सन. {fyLabel(cy)} च्या आकारणी केलेल्या करांच्या मागणीचे नोंदणी पुस्तक</p>
    </div>
    <div className="flex justify-between text-[11px] mt-1 mb-1">
      <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
      <span>तहसील :- {loc.taluka}</span>
      <span className="relative">
        {qrUrl && (
          <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 0, zIndex: 10 }}>
            <QRCodeSVG value={qrUrl} size={44} level="M" marginSize={0} />
          </span>
        )}
        जिल्हा :- {loc.district}
      </span>
    </div>
  </>
);

/* one printed page = heading + table of `rows` records (front or back) */
const ReportPage = ({ rows, side, cy, loc, qrUrl }: { rows: Row[]; side: 'front' | 'back'; cy: number; loc: Loc; qrUrl?: string }) => {
  const cols = side === 'front' ? colWFront : colWBack;
  const w = side === 'front' ? tableWFront : tableWBack;
  return (
    <div className="n9n-page mx-auto" style={{ width: `${w}px` }}>
      <Heading cy={cy} loc={loc} qrUrl={qrUrl} />
      <table className="table-fixed border-collapse" style={{ width: `${w}px` }}>
        <colgroup>{cols.map((cw, i) => <col key={i} style={{ width: `${cw}px` }} />)}</colgroup>
        {side === 'front' ? <FrontHead /> : <BackHead />}
        <tbody>
          {rows.map((n, i) => (side === 'front' ? <FrontRow key={i} n={n} /> : <BackRow key={i} n={n} />))}
        </tbody>
      </table>
    </div>
  );
};

const Namuna9NewMultiReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cy, setCy] = useState<number>(new Date().getFullYear());
  const [zoom, setZoom] = useState(1.25); // SCREEN-only default zoom (125%); does not affect print
  const [ndOpen, setNdOpen] = useState(false); // "नवीन डिझाईन" dropdown
  const [side, setSide] = useState<'' | 'front' | 'back'>('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [loc] = useState<Loc>(() => {
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
    let params: { ward?: string; start?: string; end?: string; year?: string; side?: string; orientation?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('namuna9NewParams') || '{}');
    } catch {
      params = {};
    }
    if (params.year && !isNaN(Number(params.year))) setCy(Number(params.year));
    if (params.side === 'front' || params.side === 'back') setSide(params.side);
    if (params.orientation === 'landscape' || params.orientation === 'portrait') setOrientation(params.orientation);
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load namuna-9-new', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('namuna9NewParams') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'namuna9-new', sessionKey: 'namuna9NewParams', params: shareParams, data: records, enabled: !isPublicReportMode() });

  // pagination for front/back modes: portrait 10 / landscape 6 records per page
  const perPage = orientation === 'landscape' ? 6 : 10;
  // print font — portrait front/back is zoomed down the most (0.66), so it needs a bigger base font
  const tdFont = side === '' ? 13 : (orientation === 'landscape' ? 13 : 15);
  const thFont = side === '' ? 12 : (orientation === 'landscape' ? 12 : 13);
  const chunks: Row[][] = [];
  if (side) {
    for (let i = 0; i < records.length; i += perPage) chunks.push(records.slice(i, i + perPage));
  }

  // print CSS — full mode = landscape as before; front/back follow chosen orientation
  const printInner = side === ''
    ? `@page { size: A4 landscape; margin: 24mm 3mm 8mm 15mm; }
       .n9n-report { zoom: 0.95; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`
    : `@page { size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'}; margin: ${orientation === 'landscape' ? '20mm 4mm 8mm 4mm' : '10mm 3mm 8mm 3mm'}; }
       .n9n-report { zoom: ${orientation === 'landscape' ? 0.9 : 0.66}; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       .n9n-page { page-break-after: always; page-break-inside: avoid; }
       .n9n-page:last-child { page-break-after: auto; }`;

  return (
    <div className="n9n-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .n9n-report { min-height: 100vh; background: #fff; }
        .n9n-vert { writing-mode: vertical-rl; text-orientation: mixed; white-space: nowrap; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .n9n-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n9n-zoom { zoom: 1 !important; }
          /* print-only: enlarge dense cell text for readability (screen unaffected) */
          .n9n-report td { font-size: ${tdFont}px !important; }
          .n9n-report th { font-size: ${thFont}px !important; }
          ${printInner}
        }`}</style>

      <div className="no-print mb-4 flex items-center gap-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors"
        >
          🖨️ Print / Save as PDF
        </button>
        {side && (
          <span className="text-sm font-medium text-gray-600">
            {side === 'front' ? 'पुढील बाजू (मागणी)' : 'मागील बाजू (वसुली)'} · {orientation === 'landscape' ? 'Landscape · 6/page' : 'Portrait · 10/page'}
          </span>
        )}
        <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
          <span className="px-2 text-sm font-medium text-gray-500 select-none">Zoom</span>
          <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors" title="Zoom out">−</button>
          <span className="w-14 text-center text-sm font-semibold text-gray-700 tabular-nums select-none">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))} className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors" title="Zoom in">+</button>
          <button onClick={() => setZoom(1)} className="ml-1 h-8 rounded px-3 text-xs font-medium text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors" title="Reset zoom">Reset</button>
        </div>
        {!isPublicReportMode() && (
          <div className="relative">
            <button
              onClick={() => setNdOpen((o) => !o)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium shadow-sm transition-colors"
            >
              🎨 नवीन डिझाईन (New Design) ▾
            </button>
            {ndOpen && (
              <div className="absolute left-0 z-20 mt-1 w-64 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {([
                  ['front', 'portrait', '📥 मागणी — Portrait (10/पान)'],
                  ['front', 'landscape', '📥 मागणी — Landscape (6/पान)'],
                  ['back', 'portrait', '📤 वसुली — Portrait (10/पान)'],
                  ['back', 'landscape', '📤 वसुली — Landscape (6/पान)'],
                ] as const).map(([sd, or, label]) => (
                  <button
                    key={`${sd}-${or}`}
                    onClick={() => {
                      try {
                        sessionStorage.setItem('dharkachiYadiCardData', JSON.stringify(records));
                        sessionStorage.setItem('dharkachiYadiCardMeta', JSON.stringify({ year: cy, loc, qrUrl }));
                      } catch { /* ignore quota */ }
                      window.open(`/view-namuna9-new-card?side=${sd}&orient=${or}`, '_blank');
                      setNdOpen(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-indigo-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="n9n-wrap overflow-x-auto">
        <div className="n9n-zoom" style={{ zoom }}>
          {side === '' ? (
            /* ---- FULL combined report (as-is) ---- */
            <div className="mx-auto" style={{ width: `${tableW}px` }}>
              <Heading cy={cy} loc={loc} qrUrl={qrUrl} />
              <table className="table-fixed border-collapse" style={{ width: `${tableW}px` }}>
                <colgroup>{colW.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
                <thead>
                  <tr>
                    <th className={thv} rowSpan={3}>अनु. क्रमांक</th>
                    <th className={thv} rowSpan={3}>मालमत्ता क्रमांक</th>
                    <th className={th} rowSpan={3}>खातेधारकाचे नाव</th>
                    <th className={th} colSpan={6}>मागणी</th>
                    <th className={th} colSpan={3} rowSpan={2}>आरोग्य रक्षण कर</th>
                    <th className={th} colSpan={3} rowSpan={2}>पाणी पट्टी</th>
                    <th className={th} rowSpan={3}>पावती नंबर व तारीख</th>
                    <th className={th} colSpan={6}>वसुली</th>
                    <th className={th} colSpan={3} rowSpan={2}>आरोग्य रक्षण कर</th>
                    <th className={th} colSpan={3} rowSpan={2}>पाणी पट्टी</th>
                    <th className={th} rowSpan={3}>शेरा</th>
                  </tr>
                  <tr>
                    <th className={th} colSpan={3}>गृह कर</th>
                    <th className={th} colSpan={3}>दिवाबत्ती कर</th>
                    <th className={th} colSpan={3}>गृह कर</th>
                    <th className={th} colSpan={3}>दिवाबत्ती कर</th>
                  </tr>
                  <tr>
                    <th className={thv}>मागील</th><th className={thv}>चालू</th><th className={thv}>एकूण</th>
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
                    <tr><td className={td} colSpan={29}>{loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}</td></tr>
                  ) : (
                    records.map((n, i) => <RecordBlock key={i} n={n} />)
                  )}
                </tbody>
              </table>
            </div>
          ) : records.length === 0 ? (
            <p className="text-center text-gray-500 py-10">{loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}</p>
          ) : (
            /* ---- FRONT / BACK paginated report ---- */
            <div className="space-y-8 print:space-y-0">
              {chunks.map((chunk, pi) => (
                <ReportPage key={pi} rows={chunk} side={side} cy={cy} loc={loc} qrUrl={qrUrl} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Namuna9NewMultiReport;

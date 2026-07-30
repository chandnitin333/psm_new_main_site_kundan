import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { fyLabel } from '../../../utils/fyConfig';
import { HeaderStyleControl, headerVars } from './reportHeaderStyle';

/* नमुना ९ न्यू — नवीन (styled register) डिझाईन. Multi-row register (ओळ per मालमत्ता).
   side=front(मागणी) / back(वसुली) · orient=portrait(10/page) / landscape(6/page).
   Data opener कडून sessionStorage('dharkachiYadiCardData'); नसल्यास 'namuna9NewParams'. */

type Row = Record<string, unknown>;
type Loc = { district: string; taluka: string; gramPanchayat: string };
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return isNaN(n) ? String(v) : Math.round(n).toLocaleString('en-IN');
};
const num = (v: unknown) => Number(v || 0);

const computeVals = (n: Row) => {
  const sj = (n.sillak_joda as Row) || {};
  const sjPrev = (n.sillak_joda_prev as Row) || {};
  const cur = (k: string) => num(sj[k]);
  const prev = (k: string) => num(sjPrev[k]);
  const ekun = (mKey: string, dandKey: string, sutKey: string) => {
    const m = prev(mKey), c = cur(mKey), d = prev(dandKey), su = num(sj[sutKey]);
    return Math.round(m) + Math.round((m * d) / 100) + Math.round(c) - Math.round((c * su) / 100);
  };
  const gMagil = prev('gruhkar_v_bhumikar'), gChalu = cur('gruhkar_v_bhumikar');
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
  const gvaMagil = Math.round(gMagil) + Math.round(vMagil) + Math.round(aMagil);
  const gvaChalu = Math.round(gChalu) + Math.round(vChalu) + Math.round(aChalu);
  const gvaEkun = Math.round(gEkun) + Math.round(vEkun) + Math.round(aEkun);
  const pdMagil = Math.round(prev('samanya_pani_kar')) + Math.round(prev('vishesh_pani_kar'));
  const pdChalu = Math.round(cur('samanya_pani_kar')) + Math.round(cur('vishesh_pani_kar'));
  const pdEkun =
    Math.round(ekun('samanya_pani_kar', '5_percent_addition_spk', '5_percent_discount_spk')) +
    Math.round(ekun('vishesh_pani_kar', '5_percent_addition_vpk', '5_percent_discount_vpk'));
  const name = s(n.milkat_prakar) === 'इमलाकर' ? s(n.bhogavat_darache_nav) : s(n.ghar_malkache_nav);
  return {
    anu: s(n.anu_kramank), malmatta: s(n.malmatta_number), name,
    gMagil, gChalu, gEkun, vMagil, vChalu, vEkun, aMagil, aChalu, aEkun,
    pMagil, pChalu, pEkun, gvaMagil, gvaChalu, gvaEkun, pdMagil, pdChalu, pdEkun,
  };
};

// fixed column widths (px) — table fixed-width, print zoom fits it to page (no scroll/cut)
const COLS_FRONT = [40, 48, 180, 46, 46, 52, 46, 46, 52, 46, 46, 52, 46, 46, 52, 46, 46, 52, 46, 46, 52, 94];
const COLS_BACK = [40, 48, 150, 62, 46, 46, 52, 46, 46, 52, 46, 46, 52, 46, 46, 52, 46, 46, 52, 46, 46, 52, 62];
const W_FRONT = COLS_FRONT.reduce((a, b) => a + b, 0);
const W_BACK = COLS_BACK.reduce((a, b) => a + b, 0);

const KAR3 = (m: unknown, c: unknown, e: unknown) => (
  <>
    <td>{f(m)}</td><td>{f(c)}</td><td className="ek">{f(e)}</td>
  </>
);

const Head = ({ side }: { side: 'front' | 'back' }) => (
  <thead>
    <tr>
      <th rowSpan={3} className="nn-l">अनु.<br />क्र.</th>
      <th rowSpan={3} className="nn-l">मालमत्ता<br />क्र.</th>
      <th rowSpan={3} className="nn-name">खातेधारकाचे नाव</th>
      {side === 'back' && <th rowSpan={3}>पावती नं. व तारीख</th>}
      <th colSpan={12} className="nn-grp">{side === 'front' ? 'मागणी' : 'वसुली'}</th>
      <th colSpan={3} rowSpan={2} className="nn-grp">गृह+विज+आरोग्य दंड</th>
      <th colSpan={3} rowSpan={2} className="nn-grp">सा.+वि. पाणी दंड</th>
      <th rowSpan={3}>{side === 'front' ? 'पावती नं. व तारीख' : 'शेरा'}</th>
    </tr>
    <tr>
      <th colSpan={3} className="nn-sub">गृह कर</th>
      <th colSpan={3} className="nn-sub">दिवाबत्ती कर</th>
      <th colSpan={3} className="nn-sub">आरोग्य रक्षण कर</th>
      <th colSpan={3} className="nn-sub">पाणी पट्टी</th>
    </tr>
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <>
          <th key={`m${i}`}>मागील</th><th key={`c${i}`}>चालू</th><th key={`e${i}`}>एकूण</th>
        </>
      ))}
    </tr>
  </thead>
);

const FrontRow = ({ n, i }: { n: Row; i: number }) => {
  const v = computeVals(n);
  return (
    <tr className={i % 2 ? 'alt' : ''}>
      <td>{v.anu}</td><td>{v.malmatta}</td><td className="nn-name nn-l">{v.name}</td>
      {KAR3(v.gMagil, v.gChalu, v.gEkun)}
      {KAR3(v.vMagil, v.vChalu, v.vEkun)}
      {KAR3(v.aMagil, v.aChalu, v.aEkun)}
      {KAR3(v.pMagil, v.pChalu, v.pEkun)}
      {KAR3(v.gvaMagil, v.gvaChalu, v.gvaEkun)}
      {KAR3(v.pdMagil, v.pdChalu, v.pdEkun)}
      <td />
    </tr>
  );
};

const BackRow = ({ n, i }: { n: Row; i: number }) => {
  const v = computeVals(n);
  return (
    <tr className={i % 2 ? 'alt' : ''}>
      <td>{v.anu}</td><td>{v.malmatta}</td><td className="nn-name nn-l">{v.name}</td>
      <td />
      {Array.from({ length: 12 }).map((_, k) => <td key={k} />)}
      {Array.from({ length: 6 }).map((_, k) => <td key={`d${k}`} />)}
      <td />
    </tr>
  );
};

const Page = ({ rows, side, cy, loc, qrUrl, startIdx }: { rows: Row[]; side: 'front' | 'back'; cy: number; loc: Loc; qrUrl?: string; startIdx: number }) => (
  <div className="nn-page">
    <header className="nn-head">
      {qrUrl && <span className="nn-qr"><QRCodeSVG value={qrUrl} size={46} level="M" marginSize={0} /></span>}
      <div className="nn-head-main">
        <h1>नमुना ९ — {side === 'front' ? 'मागणी' : 'वसुली'}</h1>
        <p className="nn-sub2">सन {fyLabel(cy)} — आकारणी केलेल्या करांच्या {side === 'front' ? 'मागणीचे' : 'वसुलीचे'} नोंदणी पुस्तक</p>
        <p className="nn-loc"><span>जिल्हा: <b>{loc.district || '—'}</b></span><span>तहसील: <b>{loc.taluka || '—'}</b></span><span>ग्रामपंचायत: <b>{loc.gramPanchayat || '—'}</b></span></p>
      </div>
    </header>
    <div className="nn-tablewrap">
      <table className="nn-table" style={{ width: `${side === 'front' ? W_FRONT : W_BACK}px` }}>
        <colgroup>{(side === 'front' ? COLS_FRONT : COLS_BACK).map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
        <Head side={side} />
        <tbody>
          {rows.map((n, i) => side === 'front'
            ? <FrontRow key={i} n={n} i={startIdx + i} />
            : <BackRow key={i} n={n} i={startIdx + i} />)}
        </tbody>
      </table>
    </div>
  </div>
);

const Namuna9NewCard = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cy, setCy] = useState<number>(new Date().getFullYear());
  const [loc, setLoc] = useState<Loc>({ district: '', taluka: '', gramPanchayat: '' });
  const [hdrColor, setHdrColor] = useState('');

  const qp = new URLSearchParams(window.location.search);
  const side: 'front' | 'back' = qp.get('side') === 'back' ? 'back' : 'front';
  const orient: 'portrait' | 'landscape' = qp.get('orient') === 'landscape' ? 'landscape' : 'portrait';
  const perPage = orient === 'landscape' ? 6 : 10;

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.body.classList.add('hide-gv-floats');
    document.title = `नमुना ९ ${side === 'front' ? 'मागणी' : 'वसुली'} — नवीन`;
    try {
      const raw = sessionStorage.getItem('dharkachiYadiCardData');
      const meta = JSON.parse(sessionStorage.getItem('dharkachiYadiCardMeta') || '{}');
      if (meta.year && !isNaN(Number(meta.year))) setCy(Number(meta.year));
      if (meta.loc) setLoc(meta.loc);
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        if (Array.isArray(parsed) && parsed.length) { setRecords(parsed); setLoading(false); return; }
      }
    } catch { /* fall through */ }
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try { params = JSON.parse(sessionStorage.getItem('namuna9NewParams') || '{}'); } catch { params = {}; }
    if (params.year && !isNaN(Number(params.year))) setCy(Number(params.year));
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setLoc({
        district: u.district || u.district_name || u.jilha || '',
        taluka: u.taluka || u.taluka_name || u.tahsil || '',
        gramPanchayat: u.gram_panchayat || u.gramPanchayat || u.gram_panchayat_name || '',
      });
    } catch { /* ignore */ }
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) { console.error('Failed to load namuna9-new (card)', e); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chunks: Row[][] = [];
  for (let i = 0; i < records.length; i += perPage) chunks.push(records.slice(i, i + perPage));

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('namuna9NewParams') || '{}'); } catch { return {}; } })();
  // qrUrl skipped for simplicity in new card (report already has share); keep undefined unless meta had it
  let qrUrl: string | undefined;
  try { qrUrl = JSON.parse(sessionStorage.getItem('dharkachiYadiCardMeta') || '{}').qrUrl; } catch { /* ignore */ }
  void shareParams;

  return (
    <div className={`nn-report nn-${orient}${hdrColor ? ' hdr-custom' : ''}`} style={headerVars(hdrColor)}>
      <style>{NN_CSS}</style>
      <style>{orient === 'landscape' ? NN_PRINT_LAND : NN_PRINT_PORT}</style>
      {!isPublicReportMode() && (
        <div className="nn-toolbar no-print">
          <button onClick={() => window.print()} className="nn-print-btn">🖨️ Print / Save as PDF</button>
          <span className="nn-tag">{side === 'front' ? '📥 मागणी' : '📤 वसुली'} · {orient === 'landscape' ? 'Landscape · 6/पान' : 'Portrait · 10/पान'}</span>
          <HeaderStyleControl color={hdrColor} onChange={setHdrColor} />
        </div>
      )}
      {records.length === 0 ? (
        <p className="nn-loading">{loading ? 'लोड होत आहे…' : 'या निवडीसाठी माहिती उपलब्ध नाही'}</p>
      ) : (
        chunks.map((chunk, pi) => (
          <Page key={pi} rows={chunk} side={side} cy={cy} loc={loc} qrUrl={pi === 0 ? qrUrl : undefined} startIdx={pi * perPage} />
        ))
      )}
    </div>
  );
};

const NN_CSS = `
  :root { --ink:#1e293b; --muted:#64748b; --faint:#94a3b8; --line:#cbd5e1; --accent:#4338ca; --accent2:#6366f1; --soft:#eef2ff; --emerald:#047857; }
  html, body { background:#f1f5f9 !important; }
  .nn-report { min-height:100vh; padding:24px 16px 48px; font-family:'Inter','Noto Sans',system-ui,sans-serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .nn-toolbar { margin:0 auto 18px; max-width:1100px; display:flex; align-items:center; gap:12px; }
  .nn-print-btn { background:var(--accent); color:#fff; border:none; padding:11px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(67,56,202,.28); }
  .nn-print-btn:hover { background:#3730a3; }
  .nn-tag { font-size:13px; font-weight:600; color:var(--muted); }
  .nn-loading { text-align:center; color:var(--muted); padding:64px 0; }

  /* page table-रुंदी नुसार (1226px), center — scroll नको, side space centered राहते */
  .nn-page { width:max-content; max-width:100%; margin:0 auto 26px; background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(2,6,23,.07); }

  .nn-head { position:relative; text-align:center; padding:12px 18px; background:linear-gradient(120deg,var(--accent),var(--accent2)); color:#fff; }
  .nn-head h1 { margin:0; font-size:18px; font-weight:800; }
  .nn-sub2 { margin:2px 0 0; font-size:11.5px; opacity:.95; }
  .nn-loc { display:flex; flex-wrap:wrap; justify-content:center; gap:2px 18px; margin:5px 0 0; font-size:12px; opacity:.95; }
  .nn-qr { position:absolute; top:10px; right:12px; background:#fff; padding:3px; border-radius:6px; line-height:0; }

  .nn-tablewrap { overflow-x:auto; }
  .nn-table { border-collapse:collapse; table-layout:fixed; font-size:11px; margin:0 auto; }
  .nn-table th { background:#eef2ff; color:var(--accent); font-weight:700; font-size:9.5px; padding:4px 3px; text-align:center; border:1px solid var(--line); line-height:1.15; }
  .nn-table th.nn-grp { background:#e0e7ff; font-size:10px; }
  .nn-table th.nn-sub { background:#eef2ff; }
  .nn-table th.nn-name, .nn-table td.nn-name { min-width:120px; }
  .nn-table td { padding:5px 3px; text-align:center; border:1px solid var(--line); font-variant-numeric:tabular-nums; }
  .nn-table td.nn-l, .nn-table th.nn-l { text-align:left; }
  .nn-table tr.alt td { background:#f8fafc; }
  .nn-table td.ek { font-weight:800; color:var(--emerald); }

  @media screen and (max-width:900px){
    .nn-report{ overflow-x:auto; }
  }
`;
const NN_PRINT_PORT = `@media print {
  @page { size:A4 portrait; margin:12mm 5mm 8mm 5mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .nn-report { padding:0; }
  /* fixed-width table (1226px) ला page ची पूर्ण रुंदी वापरून बसवण्यासाठी zoom; scroll नको, side space कमी */
  .nn-tablewrap { overflow:visible !important; }
  .nn-page { box-shadow:none; margin:0 auto; max-width:none; zoom:0.61; page-break-after:always; page-break-inside:avoid; }
  .nn-page:last-child { page-break-after:auto; }
  .nn-table td, .nn-table th { font-size:14px !important; }
}`;
const NN_PRINT_LAND = `@media print {
  @page { size:A4 landscape; margin:12mm 6mm 8mm 10mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .nn-report { padding:0; }
  .nn-tablewrap { overflow:visible !important; }
  .nn-page { box-shadow:none; margin:0 auto; max-width:none; zoom:0.85; page-break-after:always; page-break-inside:avoid; }
  .nn-page:last-child { page-break-after:auto; }
  .nn-table td, .nn-table th { font-size:13px !important; }
}`;

export default Namuna9NewCard;

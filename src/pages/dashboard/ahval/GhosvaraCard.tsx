import { useEffect, useState } from 'react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { fyLabel } from '../../../utils/fyConfig';
import { HeaderStyleControl, headerVars } from './reportHeaderStyle';

/* गोषवारा नमुना ८ — नवीन (card) डिझाईन. Aggregate summary: प्रत्येक कर प्रकाराची घरसंख्या + एकूण रक्कम.
   Data opener कडून sessionStorage('dharkachiYadiCardData'); नसल्यास 'ghosvaraParams' वरून fetch. */

type Row = Record<string, unknown>;
type Loc = { district: string; taluka: string; gramPanchayat: string };
const money = (v: number) => `₹ ${Math.round(v).toLocaleString('en-IN')}`;

const GhosvaraCard = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hdrColor, setHdrColor] = useState('');
  const [cy, setCy] = useState<number>(new Date().getFullYear());
  const [loc, setLoc] = useState<Loc>({ district: '', taluka: '', gramPanchayat: '' });

  const orient: 'portrait' | 'landscape' =
    new URLSearchParams(window.location.search).get('orient') === 'landscape' ? 'landscape' : 'portrait';

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.body.classList.add('hide-gv-floats');
    document.title = 'गोषवारा नमुना ८ — नवीन';
    // 1) opener कडून थेट data
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
    // 2) fallback — fetch
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try { params = JSON.parse(sessionStorage.getItem('ghosvaraParams') || '{}'); } catch { params = {}; }
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
      } catch (e) { console.error('Failed to load ghosvara (card)', e); }
      finally { setLoading(false); }
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
      (sum, it) => sum + Number(it.ekun_shetrafal_choras_foot || 0) * Number(it.aakarani_dar || 0) * (Number(it.majla) || 1), 0);
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
    let count = 0, total = 0;
    records.forEach((n) => { const v = h.amt(n); if (v > 0) count += 1; total += v; });
    return { label: h.label, count, total };
  });
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const totalHouses = records.length;

  // auto-fit → एका पानात
  useEffect(() => {
    if (loading) return;
    const isLand = orient === 'landscape';
    const printW = isLand ? 1035 : 688;
    const budgetH = (isLand ? 703 : 1009) - 6;
    const card = document.querySelector('.gc-card');
    if (!card) return;
    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.cssText = `position:absolute;left:-9999px;top:0;width:${printW}px;max-width:${printW}px;zoom:1`;
    document.body.appendChild(clone);
    const h = clone.getBoundingClientRect().height;
    document.body.removeChild(clone);
    if (h > 0) {
      const z = Math.max(0.5, Math.min(1, Math.floor((budgetH / h) * 1000) / 1000));
      document.documentElement.style.setProperty('--gpz', String(z));
    }
    return () => { document.documentElement.style.removeProperty('--gpz'); };
  }, [loading, records, orient]);

  const SIGN1 = [
    { t: 'सरपंच', s: 'गट ग्रामपंचायत' },
    { t: 'सचिव', s: 'गट ग्रामपंचायत' },
    { t: 'विस्तार अधिकारी', s: 'तथा सदस्य, कर आकारणी समिती' },
  ];
  const SIGN2 = [
    { t: 'सरपंच तथा अध्यक्ष', s: 'कर आकारणी समिती' },
    { t: 'उपसरपंच तथा सदस्य', s: 'कर आकारणी समिती' },
    { t: 'शा. अभियंता', s: '(जि.प. बांधकाम) तथा सदस्य' },
    { t: 'ग्रामसेवक तथा सदस्य व सचिव', s: 'कर आकारणी समिती' },
    { t: 'खंड विकास अधिकारी', s: 'कर आकारणी समिती' },
  ];

  return (
    <div className={`gc-report${orient === 'landscape' ? ' gc-land' : ''}${hdrColor ? ' hdr-custom' : ''}`} style={headerVars(hdrColor)}>
      <style>{GC_CSS}</style>
      <style>{orient === 'landscape' ? GC_PRINT_LAND : GC_PRINT_PORT}</style>
      {!isPublicReportMode() && (
        <div className="gc-toolbar no-print">
          <button onClick={() => window.print()} className="gc-print-btn">🖨️ Print / Save as PDF</button>
          <span className="gc-tag">{orient === 'landscape' ? '🖥️ Landscape' : '📄 Vertical'}</span>
          <HeaderStyleControl color={hdrColor} onChange={setHdrColor} />
        </div>
      )}
      {loading ? (
        <p className="gc-loading">लोड होत आहे…</p>
      ) : (
        <article className="gc-card">
          <header className="gc-head">
            <h1>गोषवारा नमुना ८</h1>
            <p className="gc-sub">कर मागणी सन {fyLabel(cy)} ते {fyLabel(cy + 3)}</p>
            <p className="gc-loc">
              <span>जिल्हा: <b>{loc.district || '—'}</b></span>
              <span>तहसील: <b>{loc.taluka || '—'}</b></span>
              <span>ग्रामपंचायत: <b>{loc.gramPanchayat || '—'}</b></span>
            </p>
          </header>

          <div className="gc-body">
            <div className="gc-stats">
              <div className="gc-stat"><span className="gc-stat-v">{totalHouses}</span><span className="gc-stat-k">एकूण घरे</span></div>
              <div className="gc-stat gc-stat-em"><span className="gc-stat-v">{money(grandTotal)}</span><span className="gc-stat-k">एकूण कर मागणी</span></div>
            </div>

            <table className="gc-table">
              <thead>
                <tr><th>कराचे प्रकार</th><th className="gc-r">घरे</th><th className="gc-r">रक्कम</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td className="gc-r">{r.count || '—'}</td>
                    <td className="gc-r">{r.total ? money(r.total) : '—'}</td>
                  </tr>
                ))}
                <tr className="gc-total">
                  <td>एकूण</td>
                  <td className="gc-r">{totalHouses}</td>
                  <td className="gc-r">{money(grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            <p className="gc-note">
              ग्रामपंचायत मासिक सभा दि. ....../....../.......... ठराव क्रं. .......... अन्वये गृहकर व भूमीकर, दिवाबत्ती कर,
              आरोग्य रक्षण कर, सफाई कर व पाणीपट्टी कर सन {fyLabel(cy)} ते {fyLabel(cy + 3)} करिता सदर कर आकारणी
              "कर आकारणी समिती" कडून अंतिम करण्यात येत आहे.
            </p>

            <div className="gc-signs">
              {SIGN1.map((x) => (
                <div key={x.t} className="gc-sign"><span className="gc-sign-line" /><b>{x.t}</b><i>{x.s}</i></div>
              ))}
            </div>
            <div className="gc-signs gc-signs-5">
              {SIGN2.map((x) => (
                <div key={x.t} className="gc-sign"><span className="gc-sign-line" /><b>{x.t}</b><i>{x.s}</i></div>
              ))}
            </div>
          </div>
        </article>
      )}
    </div>
  );
};

const GC_CSS = `
  :root { --ink:#1e293b; --muted:#64748b; --faint:#94a3b8; --line:#e2e8f0; --accent:#4338ca; --accent2:#6366f1; --soft:#eef2ff; --emerald:#047857; --emeraldbg:#ecfdf5; }
  html, body { background:#f1f5f9 !important; }
  .gc-report { min-height:100vh; padding:28px 16px 56px; font-family:'Inter','Noto Sans',system-ui,sans-serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .gc-toolbar { max-width:840px; margin:0 auto 20px; display:flex; align-items:center; gap:12px; }
  .gc-print-btn { background:var(--accent); color:#fff; border:none; padding:11px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(67,56,202,.28); }
  .gc-print-btn:hover { background:#3730a3; }
  .gc-tag { font-size:13px; font-weight:600; color:var(--muted); }
  .gc-loading { text-align:center; color:var(--muted); padding:64px 0; }

  .gc-card { max-width:840px; margin:0 auto; background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(2,6,23,.07); }
  .gc-land .gc-card { max-width:1000px; }

  .gc-head { text-align:center; padding:18px 24px; background:linear-gradient(120deg,var(--accent),var(--accent2)); color:#fff; }
  .gc-head h1 { margin:0; font-size:22px; font-weight:800; }
  .gc-sub { margin:3px 0 0; font-size:14px; opacity:.95; }
  .gc-loc { display:flex; flex-wrap:wrap; justify-content:center; gap:4px 20px; margin:10px 0 0; font-size:13px; opacity:.95; }

  .gc-body { padding:20px 24px 24px; }
  .gc-stats { display:grid; grid-template-columns:1fr 1.4fr; gap:14px; margin-bottom:18px; }
  .gc-stat { border:1px solid var(--line); border-radius:12px; padding:14px 16px; text-align:center; display:flex; flex-direction:column; gap:4px; background:#f8fafc; }
  .gc-stat-em { background:var(--emeraldbg); border-color:#a7f3d0; }
  .gc-stat-v { font-size:24px; font-weight:800; color:var(--ink); }
  .gc-stat-em .gc-stat-v { color:var(--emerald); }
  .gc-stat-k { font-size:12px; color:var(--muted); font-weight:600; }

  .gc-table { width:100%; border-collapse:collapse; font-size:14px; }
  .gc-table th { background:#f1f5f9; color:var(--muted); font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:.3px; padding:10px 14px; text-align:left; border-bottom:1px solid var(--line); }
  .gc-table td { padding:9px 14px; border-bottom:1px solid #f1f5f9; }
  .gc-table .gc-r { text-align:right; font-variant-numeric:tabular-nums; }
  .gc-table tbody tr:nth-child(even) td { background:#fafbfc; }
  .gc-total td { background:var(--soft) !important; font-weight:800; color:var(--accent); font-size:15px; border-top:2px solid #c7d2fe; }

  .gc-note { margin:18px 0 0; padding:12px 16px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; font-size:13px; line-height:1.6; color:#78350f; text-align:center; }

  .gc-signs { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:34px; }
  .gc-signs-5 { grid-template-columns:repeat(5,1fr); margin-top:40px; }
  .gc-sign { display:flex; flex-direction:column; align-items:center; text-align:center; gap:2px; }
  .gc-sign-line { width:100%; border-top:1px solid var(--ink); margin-bottom:5px; }
  .gc-sign b { font-size:12px; font-weight:700; color:var(--ink); }
  .gc-sign i { font-style:normal; font-size:9.5px; color:var(--muted); line-height:1.3; }

  @media screen and (max-width:860px){
    .gc-report{ overflow-x:auto; -webkit-overflow-scrolling:touch; padding:16px 12px 44px; }
    .gc-card{ min-width:680px; }
    .gc-land .gc-card{ min-width:960px; }
  }
`;
const GC_PRINT_PORT = `@media print {
  @page { size:A4 portrait; margin:18mm 8mm 12mm 20mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .gc-report { padding:0; }
  .gc-card { box-shadow:none; margin:0 auto; max-width:100%; zoom:var(--gpz,0.95); }
}`;
const GC_PRINT_LAND = `@media print {
  @page { size:A4 landscape; margin:16mm 7mm 8mm 16mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .gc-report { padding:0; }
  .gc-card { box-shadow:none; margin:0 auto; max-width:100%; zoom:var(--gpz,0.85); }
}`;

export default GhosvaraCard;

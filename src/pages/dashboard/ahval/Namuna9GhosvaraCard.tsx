import { useEffect, useState } from 'react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { fyLabel } from '../../../utils/fyConfig';
import { HeaderStyleControl, headerVars } from './reportHeaderStyle';

/* गोषवारा नमुना ९ — नवीन (card) डिझाईन. प्रत्येक कर प्रकाराची मागील/चालू/एकूण मागणी + चालू खातेदार संख्या. */

type Row = Record<string, unknown>;
type Loc = { district: string; taluka: string; gramPanchayat: string };
const num = (v: unknown) => Number(v || 0);
const money = (v: number) => (v ? `₹ ${Math.round(v).toLocaleString('en-IN')}` : '—');
const nz = (v: number) => (v ? Math.round(v).toLocaleString('en-IN') : '—');

type Agg = { magil: number; chalu: number; ekun: number; count: number };

const Namuna9GhosvaraCard = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cy, setCy] = useState<number>(new Date().getFullYear());
  const [ward, setWard] = useState('');
  const [loc, setLoc] = useState<Loc>({ district: '', taluka: '', gramPanchayat: '' });
  const [hdrColor, setHdrColor] = useState('');

  const orient: 'portrait' | 'landscape' =
    new URLSearchParams(window.location.search).get('orient') === 'landscape' ? 'landscape' : 'portrait';

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.body.classList.add('hide-gv-floats');
    document.title = 'गोषवारा नमुना ९ — नवीन';
    try {
      const raw = sessionStorage.getItem('dharkachiYadiCardData');
      const meta = JSON.parse(sessionStorage.getItem('dharkachiYadiCardMeta') || '{}');
      if (meta.year && !isNaN(Number(meta.year))) setCy(Number(meta.year));
      if (meta.loc) setLoc(meta.loc);
      if (meta.ward) setWard(String(meta.ward));
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        if (Array.isArray(parsed) && parsed.length) { setRecords(parsed); setLoading(false); return; }
      }
    } catch { /* fall through */ }
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try { params = JSON.parse(sessionStorage.getItem('namuna9GhosvaraParams') || '{}'); } catch { params = {}; }
    if (params.year && !isNaN(Number(params.year))) setCy(Number(params.year));
    setWard(params.ward || '');
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
      } catch (e) { console.error('Failed to load namuna9 ghosvara (card)', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const agg = (key: string): Agg => {
    let magil = 0, chalu = 0, count = 0;
    records.forEach((n) => {
      const sj = (n.sillak_joda as Row) || {};
      const sp = (n.sillak_joda_prev as Row) || {};
      const c = num(sj[key]);
      magil += num(sp[key]); chalu += c;
      if (c > 0) count += 1;
    });
    return { magil, chalu, ekun: magil + chalu, count };
  };
  const manoraVal = (n: Row) => ((n.manoryache_kar_aakarani as Row[]) || []).reduce(
    (sum, it) => sum + num(it.ekun_shetrafal_choras_foot) * num(it.aakarani_dar) * (num(it.majla) || 1), 0);
  const manoraAgg = (): Agg => {
    let chalu = 0, count = 0;
    records.forEach((n) => { const mk = manoraVal(n); chalu += mk; if (mk > 0) count += 1; });
    return { magil: 0, chalu, ekun: chalu, count };
  };
  const sumA = (...as: Agg[]): Agg => as.reduce(
    (t, a) => ({ magil: t.magil + a.magil, chalu: t.chalu + a.chalu, ekun: t.ekun + a.ekun, count: t.count + a.count }),
    { magil: 0, chalu: 0, ekun: 0, count: 0 });
  const distinctCount = (keys: string[], incManora = false) =>
    records.filter((n) => {
      const sj = (n.sillak_joda as Row) || {};
      return keys.some((k) => num(sj[k]) > 0) || (incManora && manoraVal(n) > 0);
    }).length;

  const gruh = agg('gruhkar_v_bhumikar'), diva = agg('viz_divabatti_kar'), aarogya = agg('aarogya_rakshan_kar');
  const audhogik = agg('etar_fees'), mano = manoraAgg();
  const samanya = agg('samanya_pani_kar'), vishesh = agg('vishesh_pani_kar');
  const t1 = { ...sumA(gruh, diva, aarogya), count: distinctCount(['gruhkar_v_bhumikar', 'viz_divabatti_kar', 'aarogya_rakshan_kar']) };
  const t2 = { ...sumA(audhogik, mano), count: distinctCount(['etar_fees'], true) };
  const t3 = { ...sumA(samanya, vishesh), count: distinctCount(['samanya_pani_kar', 'vishesh_pani_kar']) };
  const grand = { ...sumA(t1, t2, t3), count: distinctCount(['gruhkar_v_bhumikar', 'viz_divabatti_kar', 'aarogya_rakshan_kar', 'etar_fees', 'samanya_pani_kar', 'vishesh_pani_kar'], true) };

  const rows: { no?: string; label: string; a: Agg; sub?: boolean }[] = [
    { no: '1', label: 'गृहकर व भुमीकर', a: gruh },
    { no: '2', label: 'दिवाबत्ती कर', a: diva },
    { no: '3', label: 'आरोग्य रक्षण कर', a: aarogya },
    { label: 'उप-एकूण (गृह/दिवा/आरोग्य)', a: t1, sub: true },
    { no: '4', label: 'औधोगिक कर', a: audhogik },
    { no: '5', label: 'मनोरा', a: mano },
    { label: 'उप-एकूण (औधोगिक/मनोरा)', a: t2, sub: true },
    { no: '6', label: 'सामान्य पाणी कर', a: samanya },
    { no: '7', label: 'विशेष पाणी कर', a: vishesh },
    { label: 'उप-एकूण (पाणी)', a: t3, sub: true },
  ];

  useEffect(() => {
    if (loading) return;
    const isLand = orient === 'landscape';
    const printW = isLand ? 1016 : 688;
    const budgetH = (isLand ? 703 : 1009) - 6;
    const card = document.querySelector('.n9g-card');
    if (!card) return;
    const holder = document.createElement('div');
    holder.className = `n9g-report${isLand ? ' n9g-land' : ''}`;
    holder.style.cssText = `position:absolute;left:-9999px;top:0;width:${printW}px`;
    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.cssText = `width:${printW}px;max-width:${printW}px;zoom:1`;
    holder.appendChild(clone);
    document.body.appendChild(holder);
    const h = clone.getBoundingClientRect().height;
    document.body.removeChild(holder);
    if (h > 0) {
      const z = Math.max(0.5, Math.min(1, Math.floor((budgetH / h) * 1000) / 1000));
      document.documentElement.style.setProperty('--n9gpz', String(z));
    }
    return () => { document.documentElement.style.removeProperty('--n9gpz'); };
  }, [loading, records, orient]);

  return (
    <div className={`n9g-report${orient === 'landscape' ? ' n9g-land' : ''}${hdrColor ? ' hdr-custom' : ''}`} style={headerVars(hdrColor)}>
      <style>{N9G_CSS}</style>
      <style>{orient === 'landscape' ? N9G_PRINT_LAND : N9G_PRINT_PORT}</style>
      {!isPublicReportMode() && (
        <div className="n9g-toolbar no-print">
          <button onClick={() => window.print()} className="n9g-print-btn">🖨️ Print / Save as PDF</button>
          <span className="n9g-tag">{orient === 'landscape' ? '🖥️ Landscape' : '📄 Vertical'}</span>
          <HeaderStyleControl color={hdrColor} onChange={setHdrColor} />
        </div>
      )}
      {loading ? (
        <p className="n9g-loading">लोड होत आहे…</p>
      ) : (
        <article className="n9g-card">
          <header className="n9g-head">
            <h1>गोषवारा नमुना ९</h1>
            <p className="n9g-sub">सन {fyLabel(cy)} — कराची मागणी गोषवारा{ward ? ` · वार्ड ${ward}` : ''}</p>
            <p className="n9g-loc"><span>जिल्हा: <b>{loc.district || '—'}</b></span><span>तहसील: <b>{loc.taluka || '—'}</b></span><span>ग्रामपंचायत: <b>{loc.gramPanchayat || '—'}</b></span></p>
          </header>
          <div className="n9g-body">
            <div className="n9g-stats">
              <div className="n9g-stat"><span className="n9g-stat-v">{grand.count}</span><span className="n9g-stat-k">एकूण खातेदार</span></div>
              <div className="n9g-stat"><span className="n9g-stat-v">{nz(grand.magil)}</span><span className="n9g-stat-k">मागील थकबाकी</span></div>
              <div className="n9g-stat"><span className="n9g-stat-v">{nz(grand.chalu)}</span><span className="n9g-stat-k">चालू मागणी</span></div>
              <div className="n9g-stat n9g-stat-em"><span className="n9g-stat-v">{money(grand.ekun)}</span><span className="n9g-stat-k">एकूण मागणी</span></div>
            </div>

            <table className="n9g-table">
              <thead>
                <tr><th className="n9g-l">कराचे प्रकार</th><th>मागील</th><th>चालू</th><th>एकूण</th><th>चालू खातेदार</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={r.sub ? 'n9g-subrow' : ''}>
                    <td className="n9g-l">{r.no ? `${r.no}. ` : ''}{r.label}</td>
                    <td>{nz(r.a.magil)}</td><td>{nz(r.a.chalu)}</td><td className="n9g-ek">{nz(r.a.ekun)}</td><td>{r.a.count || '—'}</td>
                  </tr>
                ))}
                <tr className="n9g-total">
                  <td className="n9g-l">एकूण</td>
                  <td>{nz(grand.magil)}</td><td>{nz(grand.chalu)}</td><td className="n9g-ek">{nz(grand.ekun)}</td><td>{grand.count}</td>
                </tr>
              </tbody>
            </table>

            <p className="n9g-note">
              ग्रामपंचायत मासिक सभा दि. ....../....../.......... ठराव क्रं. .......... अन्वये गृहकर व भूमीकर, दिवाबत्ती कर,
              आरोग्य रक्षण कर, सामान्य पाणी कर व विशेष पाणी कर सन {fyLabel(cy)} करिता मान्य करण्यात आले आहे.
            </p>

            <div className="n9g-signs">
              {['सरपंच', 'सचिव', 'विस्तार अधिकारी'].map((t) => (
                <div key={t} className="n9g-sign"><span className="n9g-sign-line" /><b>{t}</b><i>कर आकारणी समिती</i></div>
              ))}
            </div>
          </div>
        </article>
      )}
    </div>
  );
};

const N9G_CSS = `
  :root { --ink:#1e293b; --muted:#64748b; --faint:#94a3b8; --line:#e2e8f0; --accent:#4338ca; --accent2:#6366f1; --soft:#eef2ff; --emerald:#047857; --emeraldbg:#ecfdf5; }
  html, body { background:#f1f5f9 !important; }
  .n9g-report { min-height:100vh; padding:28px 16px 56px; font-family:'Inter','Noto Sans',system-ui,sans-serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .n9g-toolbar { max-width:860px; margin:0 auto 20px; display:flex; align-items:center; gap:12px; }
  .n9g-print-btn { background:var(--accent); color:#fff; border:none; padding:11px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(67,56,202,.28); }
  .n9g-print-btn:hover { background:#3730a3; }
  .n9g-tag { font-size:13px; font-weight:600; color:var(--muted); }
  .n9g-loading { text-align:center; color:var(--muted); padding:64px 0; }

  .n9g-card { max-width:860px; margin:0 auto; background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(2,6,23,.07); }
  .n9g-land .n9g-card { max-width:1020px; }

  .n9g-head { text-align:center; padding:18px 24px; background:linear-gradient(120deg,var(--accent),var(--accent2)); color:#fff; }
  .n9g-head h1 { margin:0; font-size:22px; font-weight:800; }
  .n9g-sub { margin:3px 0 0; font-size:13.5px; opacity:.95; }
  .n9g-loc { display:flex; flex-wrap:wrap; justify-content:center; gap:4px 20px; margin:9px 0 0; font-size:13px; opacity:.95; }

  .n9g-body { padding:20px 24px 24px; }
  .n9g-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
  .n9g-stat { border:1px solid var(--line); border-radius:12px; padding:12px 10px; text-align:center; display:flex; flex-direction:column; gap:3px; background:#f8fafc; }
  .n9g-stat-em { background:var(--emeraldbg); border-color:#a7f3d0; }
  .n9g-stat-v { font-size:19px; font-weight:800; color:var(--ink); }
  .n9g-stat-em .n9g-stat-v { color:var(--emerald); }
  .n9g-stat-k { font-size:11px; color:var(--muted); font-weight:600; }

  .n9g-table { width:100%; border-collapse:collapse; font-size:14px; }
  .n9g-table th { background:#f1f5f9; color:var(--muted); font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:.3px; padding:9px 12px; text-align:right; border-bottom:1px solid var(--line); }
  .n9g-table th.n9g-l { text-align:left; }
  .n9g-table td { padding:8px 12px; text-align:right; border-bottom:1px solid #f1f5f9; font-variant-numeric:tabular-nums; }
  .n9g-table td.n9g-l { text-align:left; }
  .n9g-ek { font-weight:700; color:var(--emerald); }
  .n9g-subrow td { background:#f8fafc; font-weight:700; color:var(--muted); }
  .n9g-total td { background:var(--soft) !important; font-weight:800; color:var(--accent); font-size:15px; border-top:2px solid #c7d2fe; }
  .n9g-total .n9g-ek { color:var(--accent); }

  .n9g-note { margin:18px 0 0; padding:12px 16px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; font-size:12.5px; line-height:1.6; color:#78350f; text-align:center; }

  .n9g-signs { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:36px; }
  .n9g-sign { display:flex; flex-direction:column; align-items:center; text-align:center; gap:2px; }
  .n9g-sign-line { width:100%; border-top:1px solid var(--ink); margin-bottom:5px; }
  .n9g-sign b { font-size:12px; font-weight:700; }
  .n9g-sign i { font-style:normal; font-size:10px; color:var(--muted); }

  @media screen and (max-width:860px){
    .n9g-report{ overflow-x:auto; -webkit-overflow-scrolling:touch; padding:16px 12px 44px; }
    .n9g-card{ min-width:680px; }
  }
`;
const N9G_PRINT_PORT = `@media print {
  @page { size:A4 portrait; margin:16mm 12mm 12mm 16mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .n9g-report { padding:0; }
  .n9g-card { box-shadow:none; margin:0 auto; max-width:100%; zoom:var(--n9gpz,0.95); }
}`;
const N9G_PRINT_LAND = `@media print {
  @page { size:A4 landscape; margin:14mm 12mm 10mm 16mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .n9g-report { padding:0; }
  .n9g-card { box-shadow:none; margin:0 auto; max-width:100%; zoom:var(--n9gpz,0.85); }
}`;

export default Namuna9GhosvaraCard;

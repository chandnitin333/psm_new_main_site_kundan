import { useEffect, useState } from 'react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { fyLabel } from '../../../utils/fyConfig';
import { HeaderStyleControl, headerVars } from './reportHeaderStyle';

/* नमुना ९ — नवीन (card) डिझाईन. प्रत्येक मालमत्तेची कराची मागणी + वसुली नोंदवही.
   Data opener कडून sessionStorage('dharkachiYadiCardData'); नसल्यास 'namuna9Params' वरून fetch. */

type Row = Record<string, unknown>;
type Loc = { district: string; taluka: string; gramPanchayat: string };
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const numOr0 = (v: unknown) => (v === '' || v == null ? 0 : Number(v) || 0);

const RecordCard = ({ n, loc, cy, blank = false }: { n: Row; loc: Loc; cy: number; blank?: boolean }) => {
  const sj = (n.sillak_joda as Row) || {};
  const sjPrev = (n.sillak_joda_prev as Row) || {};
  const cur = (k: string) => numOr0(sj[k]);
  const prev = (k: string) => numOr0(sjPrev[k]);
  const ekun = (magil: number, chalu: number, addPct: number, discPct: number) =>
    Math.round(magil) + Math.round((magil * addPct) / 100) + Math.round(chalu) - Math.round((chalu * discPct) / 100);

  type TR = { label: string; m: number; c: number; dand: number; sut: number; ek: number };
  const mk = (label: string, ck: string, addK: string, discK: string): TR => {
    const m = prev(ck), c = cur(ck);
    const addPct = prev(addK), discPct = cur(discK);
    return {
      label, m, c,
      dand: Math.round(m * addPct / 100),
      sut: Math.round(c * discPct / 100),
      ek: ekun(m, c, addPct, discPct),
    };
  };
  const base: TR[] = [
    mk('गृहकर व भूमीकर', 'gruhkar_v_bhumikar', '5_percent_addition_gvb', '5_percent_discount_gvb'),
    mk('दिवाबत्ती / वीज कर', 'viz_divabatti_kar', '5_percent_addition_vdk', '5_percent_discount_vdk'),
    mk('आरोग्य रक्षण कर', 'aarogya_rakshan_kar', '5_percent_addition_ark', '5_percent_discount_ark'),
    mk('सफाई कर', 'safae_kar', '5_percent_addition_sk', '5_percent_discount_sk'),
    mk('सामान्य पाणी कर', 'samanya_pani_kar', '5_percent_addition_spk', '5_percent_discount_spk'),
    mk('विशेष पाणी कर', 'vishesh_pani_kar', '5_percent_addition_vpk', '5_percent_discount_vpk'),
  ];
  const etar: TR = { label: 'इतर फी', m: prev('etar_fees'), c: cur('etar_fees'), dand: 0, sut: 0, ek: Math.round(prev('etar_fees')) + Math.round(cur('etar_fees')) };
  const notice: TR = { label: 'नोटीस फी', m: prev('notice_fees'), c: cur('notice_fees'), dand: 0, sut: 0, ek: Math.round(prev('notice_fees')) + Math.round(cur('notice_fees')) };
  const rows: TR[] = [...base];
  if (blank || etar.m || etar.c) rows.push(etar);
  if (blank || notice.m || notice.c) rows.push(notice);

  const tot = rows.reduce((a, r) => ({ m: a.m + r.m, c: a.c + r.c, dand: a.dand + r.dand, sut: a.sut + r.sut, ek: a.ek + r.ek }), { m: 0, c: 0, dand: 0, sut: 0, ek: 0 });
  const bv = (v: number) => (blank ? ' ' : (v ? Math.round(v).toLocaleString('en-IN') : '—'));

  return (
    <article className="n9c-card">
      <header className="n9c-head">
        <div className="n9c-badges">
          <span className="n9c-badge"><i>अनु.क्र</i><b>{blank ? ' ' : (s(n.anu_kramank) || '—')}</b></span>
          <span className="n9c-badge"><i>वार्ड</i><b>{blank ? ' ' : (s(n.ward_kramnak) || '—')}</b></span>
        </div>
        <div className="n9c-head-main">
          <h1>नमुना ९</h1>
          <p className="n9c-sub">सन {fyLabel(cy)} — आकारणी केलेल्या कराची मागणी व वसुली नोंदवही</p>
          <p className="n9c-loc">
            <span>जिल्हा: <b>{loc.district || '—'}</b></span>
            <span>तालुका: <b>{loc.taluka || '—'}</b></span>
            <span>ग्रामपंचायत: <b>{loc.gramPanchayat || '—'}</b></span>
          </p>
        </div>
      </header>

      <div className="n9c-body">
        {/* identity */}
        <div className="n9c-ident">
          {[
            ['खातेधारकाचे नाव', n.ghar_malkache_nav], ['भोगवटदाराचे नाव', n.bhogavat_darache_nav],
            ['मालमत्ता क्र.', n.malmatta_number], ['मिलकत प्रकार', n.milkat_prakar],
            ['खसरा क्र.', n.khasara_number], ['सर्वे क्र.', n.survey_number], ['प्लॉट क्र.', n.plot_number],
            ['पत्ता', n.patta_nagar_layout_society],
          ].map(([k, v]) => (
            <div key={String(k)} className="n9c-field"><span className="n9c-label">{String(k)}:</span><span className="n9c-value">{blank ? ' ' : (s(v) || '—')}</span></div>
          ))}
        </div>

        <div className="n9c-tables">
        {/* मागणी table */}
        <div className="n9c-tsec">
        <h2 className="n9c-h2">कराची मागणी</h2>
        <div className="n9c-tablewrap">
          <table className="n9c-table">
            <thead>
              <tr>
                <th className="n9c-l">करांचे नाव</th>
                <th>मागील</th><th>चालू</th><th>5% दंड</th><th>5% सूट</th><th>एकूण</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="n9c-l">{r.label}</td>
                  <td>{bv(r.m)}</td><td>{bv(r.c)}</td><td>{bv(r.dand)}</td><td>{bv(r.sut)}</td><td className="n9c-ek">{bv(r.ek)}</td>
                </tr>
              ))}
              <tr className="n9c-total">
                <td className="n9c-l">एकूण मागणी</td>
                <td>{bv(tot.m)}</td><td>{bv(tot.c)}</td><td>{bv(tot.dand)}</td><td>{bv(tot.sut)}</td><td className="n9c-ek">{bv(tot.ek)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>

        {/* वसुली table — हाताने भरण्यासाठी (blank) */}
        <div className="n9c-tsec">
        <h2 className="n9c-h2">वसुली (भरणा नोंद)</h2>
        <div className="n9c-tablewrap">
          <table className="n9c-table">
            <thead>
              <tr>
                <th className="n9c-l">करांचे नाव</th>
                <th>पावती क्र.</th><th>दिनांक</th><th>वसूल रक्कम</th><th>एकूण भरणा</th><th>बाकी</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} style={{ height: '22px' }}>
                  <td className="n9c-l">{r.label}</td>
                  <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                </tr>
              ))}
              <tr className="n9c-total" style={{ height: '22px' }}>
                <td className="n9c-l">एकूण वसुली</td>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        </div>
      </div>

      <footer className="n9c-foot">
        <span>नमुना ९ — मागणी नोंदवही · सन {fyLabel(cy)}{blank ? ' · कोरी नोंदवही' : ''}</span>
        <span>पान नंबर: {blank ? ' ' : (s(n.anu_kramank) || '—')}</span>
      </footer>
    </article>
  );
};

const Namuna9Card = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cy, setCy] = useState<number>(new Date().getFullYear());
  const [loc, setLoc] = useState<Loc>({ district: '', taluka: '', gramPanchayat: '' });
  const [hdrColor, setHdrColor] = useState('');

  const orient: 'portrait' | 'landscape' =
    new URLSearchParams(window.location.search).get('orient') === 'landscape' ? 'landscape' : 'portrait';

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.body.classList.add('hide-gv-floats');
    document.title = 'नमुना ९ — नवीन';
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
    try { params = JSON.parse(sessionStorage.getItem('namuna9Params') || '{}'); } catch { params = {}; }
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
      } catch (e) { console.error('Failed to load namuna9 (card)', e); }
      finally { setLoading(false); }
    })();
  }, []);

  // auto-fit → प्रत्येक record एका पानात
  useEffect(() => {
    if (!records.length) return;
    const isLand = orient === 'landscape';
    const printW = isLand ? 1016 : 681;   // portrait card 180mm ≈ 681px, centered (equal left/right)
    const budgetH = (isLand ? 703 : 1013) - 6;
    let maxH = 0;
    // holder ला योग्य class (landscape → side-by-side tables) जेणेकरून मोजलेली height बरोबर येते
    const holder = document.createElement('div');
    holder.className = `n9c-report${isLand ? ' n9c-land' : ''}`;
    holder.style.cssText = `position:absolute;left:-9999px;top:0;width:${printW}px`;
    document.body.appendChild(holder);
    document.querySelectorAll('.n9c-card').forEach((card) => {
      const clone = card.cloneNode(true) as HTMLElement;
      clone.style.cssText = `width:${printW}px;max-width:${printW}px;zoom:1`;
      holder.appendChild(clone);
      maxH = Math.max(maxH, clone.getBoundingClientRect().height);
      holder.removeChild(clone);
    });
    document.body.removeChild(holder);
    if (maxH > 0) {
      const z = Math.max(0.5, Math.min(1, Math.floor((budgetH / maxH) * 1000) / 1000));
      document.documentElement.style.setProperty('--n9pz', String(z));
    }
    return () => { document.documentElement.style.removeProperty('--n9pz'); };
  }, [records, orient]);

  return (
    <div className={`n9c-report${orient === 'landscape' ? ' n9c-land' : ''}${hdrColor ? ' hdr-custom' : ''}`} style={headerVars(hdrColor)}>
      <style>{N9C_CSS}</style>
      <style>{orient === 'landscape' ? N9C_PRINT_LAND : N9C_PRINT_PORT}</style>
      {!isPublicReportMode() && (
        <div className="n9c-toolbar no-print">
          <button onClick={() => window.print()} className="n9c-print-btn">🖨️ Print / Save as PDF</button>
          <span className="n9c-tag">{orient === 'landscape' ? '🖥️ Landscape' : '📄 Vertical'}</span>
          <HeaderStyleControl color={hdrColor} onChange={setHdrColor} />
        </div>
      )}
      {records.length === 0 ? (
        <p className="n9c-loading">{loading ? 'लोड होत आहे…' : 'या निवडीसाठी माहिती उपलब्ध नाही'}</p>
      ) : (
        <>
          {records.map((n, i) => <RecordCard key={i} n={n} loc={loc} cy={cy} />)}
          <RecordCard key="blank" n={{}} loc={loc} cy={cy} blank />
        </>
      )}
    </div>
  );
};

const N9C_CSS = `
  :root { --ink:#1e293b; --muted:#64748b; --faint:#94a3b8; --line:#e2e8f0; --accent:#4338ca; --accent2:#6366f1; --soft:#eef2ff; --emerald:#047857; --emeraldbg:#ecfdf5; }
  html, body { background:#f1f5f9 !important; }
  .n9c-report { min-height:100vh; padding:28px 16px 56px; font-family:'Inter','Noto Sans',system-ui,sans-serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .n9c-toolbar { max-width:900px; margin:0 auto 20px; display:flex; align-items:center; gap:12px; }
  .n9c-print-btn { background:var(--accent); color:#fff; border:none; padding:11px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(67,56,202,.28); }
  .n9c-print-btn:hover { background:#3730a3; }
  .n9c-tag { font-size:13px; font-weight:600; color:var(--muted); }
  .n9c-loading { text-align:center; color:var(--muted); padding:64px 0; }

  .n9c-card { max-width:900px; margin:0 auto 26px; background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(2,6,23,.07); }
  .n9c-land .n9c-card { max-width:1040px; }

  .n9c-head { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:84px; padding:12px 20px; background:linear-gradient(120deg,var(--accent),var(--accent2)); color:#fff; }
  .n9c-head-main { text-align:center; padding:0 100px; }
  .n9c-head h1 { margin:0; font-size:20px; font-weight:800; }
  .n9c-sub { margin:2px 0 0; font-size:12px; opacity:.95; }
  .n9c-loc { display:flex; flex-wrap:wrap; justify-content:center; gap:2px 16px; margin:5px 0 0; font-size:12px; opacity:.95; }
  .n9c-badges { position:absolute; top:14px; left:16px; display:flex; flex-direction:column; gap:5px; }
  .n9c-badge { display:flex; flex-direction:column; align-items:flex-start; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.25); border-radius:7px; padding:2px 9px; min-width:66px; line-height:1.2; }
  .n9c-badge i { font-style:normal; font-size:8px; text-transform:uppercase; letter-spacing:.4px; opacity:.85; }
  .n9c-badge b { font-size:14px; font-weight:800; }

  .n9c-body { padding:14px 22px 6px; }
  .n9c-ident { display:grid; grid-template-columns:repeat(4,1fr); gap:6px 16px; margin-bottom:12px; }
  .n9c-field { display:flex; align-items:baseline; gap:6px; min-width:0; }
  .n9c-label { font-size:10px; color:var(--faint); font-weight:600; flex-shrink:0; text-transform:uppercase; letter-spacing:.3px; }
  .n9c-value { font-size:13px; color:var(--ink); font-weight:600; overflow-wrap:break-word; min-width:0; }

  .n9c-h2 { margin:10px 0 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:var(--accent); display:flex; align-items:center; gap:8px; }
  .n9c-h2::after { content:''; flex:1; height:1px; background:var(--line); }

  /* stacked (portrait) / side-by-side (landscape) — landscape मध्ये height अर्धी → एका पानात + मोठा font */
  .n9c-tables { display:flex; flex-direction:column; }
  .n9c-land .n9c-tables { flex-direction:row; gap:20px; align-items:flex-start; }
  .n9c-land .n9c-tsec { flex:1; min-width:0; }

  .n9c-tablewrap { border:1px solid var(--line); border-radius:10px; overflow:hidden; }
  /* table-layout:fixed → columns page मध्ये बसतात, उजवीकडून cut होत नाही */
  .n9c-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:12.5px; }
  .n9c-table th { background:#f1f5f9; color:var(--muted); font-weight:700; font-size:11px; padding:6px 6px; text-align:right; border-bottom:1px solid var(--line); overflow-wrap:break-word; overflow:hidden; }
  .n9c-table td { padding:5px 6px; text-align:right; border-bottom:1px solid #f1f5f9; font-variant-numeric:tabular-nums; overflow-wrap:break-word; overflow:hidden; }
  .n9c-table th:first-child, .n9c-table td:first-child { width:30%; }
  .n9c-land .n9c-table { font-size:13.5px; }
  .n9c-land .n9c-table th { font-size:12px; }
  .n9c-table .n9c-l { text-align:left; }
  .n9c-table tbody tr:nth-child(even) td { background:#fafbfc; }
  .n9c-table tr:last-child td { border-bottom:none; }
  .n9c-ek { font-weight:800; color:var(--emerald); }
  .n9c-total td { background:var(--soft) !important; font-weight:800; color:var(--accent); border-top:2px solid #c7d2fe; }
  .n9c-total .n9c-ek { color:var(--accent); }

  .n9c-foot { display:flex; justify-content:space-between; padding:10px 22px; background:#f8fafc; border-top:1px solid var(--line); font-size:11px; color:var(--muted); }

  @media screen and (max-width:860px){
    .n9c-report{ overflow-x:auto; -webkit-overflow-scrolling:touch; padding:16px 12px 44px; }
    .n9c-card{ min-width:720px; }
    .n9c-land .n9c-card{ min-width:1040px; }
  }
`;
const N9C_PRINT_PORT = `@media print {
  @page { size:A4 portrait; margin:16mm 13mm 12mm 13mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .n9c-report { padding:0; }
  .n9c-card { box-shadow:none; margin:0 auto; width:180mm; max-width:180mm; overflow:hidden; zoom:var(--n9pz,0.9); page-break-after:always; break-after:page; page-break-inside:avoid; break-inside:avoid; }
  .n9c-card:last-child { page-break-after:auto; break-after:auto; }
}`;
const N9C_PRINT_LAND = `@media print {
  @page { size:A4 landscape; margin:16mm 7mm 8mm 16mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .n9c-report { padding:0; }
  .n9c-card { box-shadow:none; margin:0 auto; max-width:1016px; overflow:hidden; zoom:var(--n9pz,0.85); page-break-after:always; break-after:page; page-break-inside:avoid; break-inside:avoid; }
  .n9c-card:last-child { page-break-after:auto; break-after:auto; }
}`;

export default Namuna9Card;

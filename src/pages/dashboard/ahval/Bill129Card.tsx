import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { fyLabel } from '../../../utils/fyConfig';
import { HeaderStyleControl, headerVars } from './reportHeaderStyle';

/* कराची मागणी पावती १२९(१) — नवीन (card) डिझाईन. प्रति मालमत्ता दोन प्रती (खातेधारक + कार्यालय).
   landscape = दोन प्रती शेजारी (default); portrait = एकाखाली एक. Data 'dharkachiYadiCardData' / 'bill129_1Params'. */

type Row = Record<string, unknown>;
type Loc = { district: string; taluka: string; gramPanchayat: string };
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const num = (v: unknown) => Number(v || 0);
const nz = (v: number) => (v ? Math.round(v).toLocaleString('en-IN') : '—');

type TaxRow = { label: string; thak: number; chalu: number; vadh: number; sut: number; ekun: number };
const computeRows = (n: Row): { rows: TaxRow[]; tot: TaxRow } => {
  const sj = (n.sillak_joda as Row) || {};
  const sp = (n.sillak_joda_prev as Row) || {};
  const head = (b: string, a: string, d: string, label: string): TaxRow => {
    const thak = Math.round(num(sp[b])), chalu = Math.round(num(sj[b]));
    const vadh = Math.round((num(sp[b]) * num(sp[a])) / 100);
    const sut = Math.round((num(sj[b]) * num(sj[d])) / 100);
    return { label, thak, chalu, vadh, sut, ekun: thak + vadh + chalu - sut };
  };
  const fee = (k: string, label: string): TaxRow => {
    const thak = Math.round(num(sp[k])), chalu = Math.round(num(sj[k]));
    return { label, thak, chalu, vadh: 0, sut: 0, ekun: thak + chalu };
  };
  const rows: TaxRow[] = [
    head('gruhkar_v_bhumikar', '5_percent_addition_gvb', '5_percent_discount_gvb', 'गृह व भूमीकर'),
    head('viz_divabatti_kar', '5_percent_addition_vdk', '5_percent_discount_vdk', 'दिवाबत्ती / वीज कर'),
    head('aarogya_rakshan_kar', '5_percent_addition_ark', '5_percent_discount_ark', 'आरोग्य रक्षण कर'),
    head('safae_kar', '5_percent_addition_sk', '5_percent_discount_sk', 'सफाई कर'),
    head('samanya_pani_kar', '5_percent_addition_spk', '5_percent_discount_spk', 'सामान्य पाणी कर'),
    head('vishesh_pani_kar', '5_percent_addition_vpk', '5_percent_discount_vpk', 'विशेष पाणी कर'),
    fee('etar_fees', 'इतर फी'),
    fee('notice_fees', 'नोटीस फी'),
  ];
  const tot = rows.reduce((t, r) => ({ label: 'एकूण मागणी', thak: t.thak + r.thak, chalu: t.chalu + r.chalu, vadh: t.vadh + r.vadh, sut: t.sut + r.sut, ekun: t.ekun + r.ekun }),
    { label: 'एकूण मागणी', thak: 0, chalu: 0, vadh: 0, sut: 0, ekun: 0 } as TaxRow);
  return { rows, tot };
};

const Receipt = ({ n, loc, cy, dates, bharna, copy, qrUrl, blank = false, sec = '१२९(१)' }: {
  n: Row; loc: Loc; cy: number; dates: { start: string; end: string }; bharna: string;
  copy: 'khatedar' | 'office'; qrUrl?: string; blank?: boolean; sec?: string;
}) => {
  const rv = (v: number) => (blank ? ' ' : nz(v));
  const sv = (v: unknown) => (blank ? ' ' : (s(v) || '—'));
  const { rows, tot } = computeRows(n);
  return (
    <article className="b1-copy">
      <header className="b1-head">
        {qrUrl && !blank && <span className="b1-qr"><QRCodeSVG value={qrUrl} size={58} level="M" marginSize={0} /></span>}
        <div className="b1-copytag">{copy === 'khatedar' ? 'खातेधारक प्रत' : 'कार्यालय प्रत'}</div>
        <h1>कराची मागणी पावती</h1>
        <p className="b1-sub">सन {fyLabel(cy)} · मुंबई ग्रा.प. कायदा १९५९ कलम {sec}</p>
        <p className="b1-loc"><span>ग्रा.पं: <b>{loc.gramPanchayat || '—'}</b></span><span>ता: <b>{loc.taluka || '—'}</b></span><span>जि: <b>{loc.district || '—'}</b></span></p>
      </header>
      <div className="b1-body">
        <div className="b1-ident">
          {[['अ.क्र', n.anu_kramank], ['मालमत्ता', n.malmatta_number], ['वार्ड', n.ward_kramnak], ['प्लॉट', n.plot_number], ['खसरा', n.khasara_number], ['सर्वे', n.survey_number]].map(([k, v]) => (
            <div key={String(k)} className="b1-f"><span>{String(k)}</span><b>{sv(v)}</b></div>
          ))}
        </div>
        <div className="b1-names">
          <div className="b1-nf"><span>खातेधारक</span><b>{sv(n.ghar_malkache_nav)}</b></div>
          <div className="b1-nf"><span>भोगवटदार</span><b>{sv(n.bhogavat_darache_nav)}</b></div>
          <div className="b1-nf"><span>पत्ता</span><b>{sv(n.patta_nagar_layout_society)}</b></div>
        </div>
        <div className="b1-dates">कर भरण्याची अंतिम तारीख: <b>{blank ? ' ' : (dates.start || '—')}</b> ते <b>{blank ? ' ' : (dates.end || '—')}</b></div>

        <table className="b1-table">
          <thead>
            <tr><th className="b1-l">करांचे नाव</th><th>थकबाकी</th><th>चालू</th><th>5% दंड</th><th>5% सूट</th><th>एकूण</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}><td className="b1-l">{r.label}</td><td>{rv(r.thak)}</td><td>{rv(r.chalu)}</td><td>{rv(r.vadh)}</td><td>{rv(r.sut)}</td><td className="b1-ek">{rv(r.ekun)}</td></tr>
            ))}
            <tr className="b1-total"><td className="b1-l">एकूण मागणी</td><td>{rv(tot.thak)}</td><td>{rv(tot.chalu)}</td><td>{rv(tot.vadh)}</td><td>{rv(tot.sut)}</td><td className="b1-ek">{rv(tot.ekun)}</td></tr>
          </tbody>
        </table>

        {copy === 'office' && (
          <div className="b1-terms">
            <p>हे बिल प्राप्त झाल्यापासून देय रकमेचा भरणा <b>{blank ? '__' : (bharna || '__')}</b> दिवसांत करावा, अन्यथा कलम १२९(२) अन्वये मागणी बजावली जाईल.</p>
            <p>टीप: ३० सप्टेंबरपूर्वी भरणा केल्यास चालू गृहकरात ५% सूट; थकीत गृहकरावर ५% दंड.</p>
          </div>
        )}
        <div className="b1-sign">{copy === 'office' ? 'सरपंच / सचिव सही' : 'खातेधारकाची सही'}</div>
      </div>
    </article>
  );
};

const Bill129Card = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cy, setCy] = useState<number>(new Date().getFullYear());
  const [dates, setDates] = useState({ start: '', end: '' });
  const [bharna, setBharna] = useState('');
  const [hdrColor, setHdrColor] = useState('');
  const [loc, setLoc] = useState<Loc>({ district: '', taluka: '', gramPanchayat: '' });

  const orient: 'portrait' | 'landscape' =
    new URLSearchParams(window.location.search).get('orient') === 'portrait' ? 'portrait' : 'landscape';
  const section = new URLSearchParams(window.location.search).get('section') === '2' ? '2' : '1';
  const secDev = section === '2' ? '१२९(२)' : '१२९(१)';

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.body.classList.add('hide-gv-floats');
    document.title = `कराची मागणी पावती ${new URLSearchParams(window.location.search).get('section') === '2' ? '१२९(२)' : '१२९(१)'} — नवीन`;
    try {
      const raw = sessionStorage.getItem('dharkachiYadiCardData');
      const meta = JSON.parse(sessionStorage.getItem('dharkachiYadiCardMeta') || '{}');
      if (meta.year && !isNaN(Number(meta.year))) setCy(Number(meta.year));
      if (meta.loc) setLoc(meta.loc);
      if (meta.dates) setDates(meta.dates);
      if (meta.bharna) setBharna(String(meta.bharna));
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        if (Array.isArray(parsed) && parsed.length) { setRecords(parsed); setLoading(false); return; }
      }
    } catch { /* fall through */ }
    let p: { ward?: string; start?: string; end?: string; year?: string; startDate?: string; endDate?: string; bharna?: string } = {};
    const key = new URLSearchParams(window.location.search).get('section') === '2' ? 'bill129_2Params' : 'bill129_1Params';
    try { p = JSON.parse(sessionStorage.getItem(key) || '{}'); } catch { p = {}; }
    if (p.year && !isNaN(Number(p.year))) setCy(Number(p.year));
    setDates({ start: p.startDate || '', end: p.endDate || '' });
    setBharna(p.bharna || '');
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
        const res = await nodniService.getDharkachiYadi(p.ward, p.start, p.end, '', p.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) { console.error('Failed to load bill129 (card)', e); }
      finally { setLoading(false); }
    })();
  }, []);

  // प्रत्येक record चा UNIQUE QR — deterministic public-bill link (client-side, upload नाही → 5000 records fast)
  const gpId = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').gram_panchayat_id || ''; } catch { return ''; } })();
  const recQr = (n: Row) =>
    `${window.location.origin}/public-bill?gp=${gpId}&malmatta=${encodeURIComponent(s(n.malmatta_number))}&ward=${encodeURIComponent(s(n.ward_kramnak))}&anu=${encodeURIComponent(s(n.anu_kramank))}&year=${cy}`;

  // performance: screen वर pagination (fast); print ला सर्व records
  const PER = 50;
  const [pg, setPg] = useState(0);
  const [printing, setPrinting] = useState(false);
  const totalPages = Math.max(1, Math.ceil(records.length / PER));
  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => { window.print(); setPrinting(false); }, 250);
    return () => clearTimeout(t);
  }, [printing]);

  const allItems: (Row | null)[] = [...records, null]; // null = blank (शेवटी)
  const items: (Row | null)[] = printing
    ? allItems
    : (pg + 1 >= totalPages ? [...records.slice(pg * PER), null] : records.slice(pg * PER, pg * PER + PER));

  return (
    <div className={`b1-report b1-${orient}${hdrColor ? ' hdr-custom' : ''}`} style={headerVars(hdrColor)}>
      <style>{B1_CSS}</style>
      <style>{orient === 'landscape' ? B1_PRINT_LAND : B1_PRINT_PORT}</style>
      {!isPublicReportMode() && (
        <div className="b1-toolbar no-print">
          <button onClick={() => setPrinting(true)} className="b1-print-btn">🖨️ Print / Save as PDF (सर्व {records.length})</button>
          <span className="b1-tag">{orient === 'landscape' ? '🖥️ Landscape (2 प्रती शेजारी)' : '📄 Portrait'}</span>
          <HeaderStyleControl color={hdrColor} onChange={setHdrColor} />
          {records.length > PER && (
            <span className="b1-pager">
              <button onClick={() => setPg((p) => Math.max(0, p - 1))} disabled={pg === 0}>‹ मागे</button>
              <b>पान {pg + 1}/{totalPages}</b>
              <button onClick={() => setPg((p) => Math.min(totalPages - 1, p + 1))} disabled={pg + 1 >= totalPages}>पुढे ›</button>
              <i>({pg * PER + 1}–{Math.min((pg + 1) * PER, records.length)} / {records.length})</i>
            </span>
          )}
        </div>
      )}
      {records.length === 0 ? (
        <p className="b1-loading">{loading ? 'लोड होत आहे…' : 'या निवडीसाठी माहिती उपलब्ध नाही'}</p>
      ) : (
        items.map((n, i) => (
          <div key={i} className="b1-page">
            <Receipt n={n || {}} loc={loc} cy={cy} dates={dates} bharna={bharna} copy="khatedar" qrUrl={n ? recQr(n) : undefined} blank={!n} sec={secDev} />
            <Receipt n={n || {}} loc={loc} cy={cy} dates={dates} bharna={bharna} copy="office" qrUrl={n ? recQr(n) : undefined} blank={!n} sec={secDev} />
          </div>
        ))
      )}
    </div>
  );
};

const B1_CSS = `
  :root { --ink:#1e293b; --muted:#64748b; --faint:#94a3b8; --line:#e2e8f0; --accent:#4338ca; --accent2:#6366f1; --soft:#eef2ff; --emerald:#047857; }
  html, body { background:#f1f5f9 !important; }
  .b1-report { min-height:100vh; padding:24px 16px 48px; font-family:'Inter','Noto Sans',system-ui,sans-serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .b1-toolbar { max-width:1100px; margin:0 auto 18px; display:flex; align-items:center; gap:12px; }
  .b1-print-btn { background:var(--accent); color:#fff; border:none; padding:11px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(67,56,202,.28); }
  .b1-print-btn:hover { background:#3730a3; }
  .b1-tag { font-size:13px; font-weight:600; color:var(--muted); }
  .b1-pager { display:inline-flex; align-items:center; gap:8px; font-size:13px; color:var(--ink); }
  .b1-pager button { background:#fff; border:1px solid var(--line); border-radius:8px; padding:5px 10px; font-size:13px; font-weight:600; cursor:pointer; color:var(--accent); }
  .b1-pager button:disabled { color:var(--faint); cursor:default; }
  .b1-pager i { font-style:normal; color:var(--muted); font-size:12px; }
  .b1-loading { text-align:center; color:var(--muted); padding:64px 0; }

  .b1-page { display:grid; gap:16px; margin:0 auto 22px; max-width:1180px; }
  .b1-landscape .b1-page { grid-template-columns:1fr 1fr; }
  .b1-portrait .b1-page { grid-template-columns:1fr; max-width:620px; }

  .b1-copy { background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; box-shadow:0 6px 24px rgba(2,6,23,.07); }
  .b1-head { position:relative; text-align:center; padding:12px 16px 10px; background:linear-gradient(120deg,var(--accent),var(--accent2)); color:#fff; }
  .b1-copytag { position:absolute; top:8px; left:12px; font-size:9px; font-weight:700; background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3); border-radius:6px; padding:2px 8px; }
  .b1-qr { position:absolute; top:8px; right:10px; background:#fff; padding:3px; border-radius:6px; line-height:0; }
  .b1-head h1 { margin:0; font-size:17px; font-weight:800; }
  .b1-sub { margin:2px 0 0; font-size:10.5px; opacity:.95; }
  .b1-loc { display:flex; flex-wrap:wrap; justify-content:center; gap:2px 14px; margin:5px 0 0; font-size:11px; opacity:.95; }

  .b1-body { padding:12px 16px 14px; }
  .b1-ident { display:grid; grid-template-columns:repeat(3,1fr); gap:5px 10px; margin-bottom:8px; }
  .b1-f { display:flex; align-items:baseline; gap:5px; font-size:12px; }
  .b1-f span { color:var(--faint); font-size:10px; font-weight:600; }
  .b1-f b { font-weight:700; }
  .b1-names { display:flex; flex-direction:column; gap:4px; margin-bottom:8px; padding:8px 10px; background:#f8fafc; border-radius:8px; }
  .b1-nf { display:flex; gap:6px; font-size:12.5px; }
  .b1-nf span { color:var(--faint); font-size:10px; font-weight:600; min-width:64px; }
  .b1-nf b { font-weight:700; }
  .b1-dates { font-size:11px; color:var(--muted); margin-bottom:8px; }
  .b1-dates b { color:var(--ink); }

  .b1-table { width:100%; border-collapse:collapse; font-size:12px; }
  .b1-table th { background:#f1f5f9; color:var(--muted); font-weight:700; font-size:10.5px; padding:5px 6px; text-align:right; border-bottom:1px solid var(--line); }
  .b1-table th.b1-l { text-align:left; }
  .b1-table td { padding:4px 6px; text-align:right; border-bottom:1px solid #f1f5f9; font-variant-numeric:tabular-nums; }
  .b1-table td.b1-l { text-align:left; }
  .b1-ek { font-weight:800; color:var(--emerald); }
  .b1-total td { background:var(--soft) !important; font-weight:800; color:var(--accent); border-top:2px solid #c7d2fe; }
  .b1-total .b1-ek { color:var(--accent); }

  .b1-terms { margin-top:9px; font-size:9.5px; line-height:1.5; color:#78350f; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:8px 10px; }
  .b1-terms p { margin:0 0 3px; }
  .b1-sign { margin-top:52px; text-align:right; font-weight:700; font-size:11px; color:var(--ink); }

  @media screen and (max-width:900px){
    .b1-report{ overflow-x:auto; }
    .b1-landscape .b1-page{ min-width:840px; }
  }
`;
const B1_PRINT_PORT = `@media print {
  @page { size:A4 portrait; margin:18mm 8mm 10mm 16mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .b1-report { padding:0; }
  .b1-page { max-width:100%; margin:0 auto; zoom:0.92; page-break-after:always; page-break-inside:avoid; }
  .b1-page:last-child { page-break-after:auto; }
}`;
const B1_PRINT_LAND = `@media print {
  @page { size:A4 landscape; margin:18mm 6mm 10mm 16mm; }
  html, body { background:#fff !important; }
  .no-print { display:none !important; }
  .b1-report { padding:0; }
  .b1-page { max-width:100%; margin:0 auto; zoom:0.9; page-break-after:always; page-break-inside:avoid; }
  .b1-page:last-child { page-break-after:auto; }
}`;

export default Bill129Card;

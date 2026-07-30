import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';
import { HeaderStyleControl, headerVars } from './reportHeaderStyle';

/* अनुक्रमणिका / यादी — नवीन (styled index) डिझाईन. Flat index reports. Portrait only.
   variant नुसार columns/title बदलतात (imlakar, aadhar, mobile, pani, shouchalay, namuna9anu). */

type Row = Record<string, unknown>;
type Loc = { district: string; taluka: string; gramPanchayat: string };
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return isNaN(n) ? String(v) : Math.round(n).toLocaleString('en-IN');
};

type Col = { h: string; k: string; L?: boolean; num?: boolean; w?: number; nw?: boolean };
const C = (h: string, k: string, opt: Partial<Col> = {}): Col => ({ h, k, ...opt });
const wt = (c: Col) => c.w ?? (c.L ? 3 : 1.3);
const ANU = C('अ.क्र', 'anu_kramank', { w: 1 });
const WARD = C('वार्ड', 'ward_kramnak', { w: 1 });
const MAL = C('मालमत्ता क्र.', 'malmatta_number', { w: 1.4 });
const GHAR = C('खातेधारकाचे नाव', 'ghar_malkache_nav', { L: true });
const BHOG = C('भोगवटदाराचे नाव', 'bhogavat_darache_nav', { L: true });
const PATTA = C('पत्ता', 'patta_nagar_layout_society', { L: true });
const PAN = C('पान नं.', 'anu_kramank', { w: 1.1 });

const CFG: Record<string, { title: string; imlaOnly?: boolean; cols: Col[] }> = {
  imlakar: { title: 'इमलाकार अनुक्रमणिका', imlaOnly: true, cols: [ANU, WARD, MAL, GHAR, BHOG, PATTA, PAN] },
  aadhar: { title: 'आधार कार्ड व वोटर कार्ड यादी', cols: [ANU, MAL, GHAR, BHOG, C('आधार कार्ड', 'aadahar_card_number', { w: 2, nw: true }), C('वोटर कार्ड', 'matdar_card_number', { w: 1.7, nw: true }), PAN] },
  mobile: { title: 'मोबाईल क्रमांक यादी', cols: [ANU, MAL, GHAR, BHOG, C('मोबाईल नं.', 'mobile_number', { w: 1.9, nw: true }), PAN] },
  pani: { title: 'पाणी व्यवस्था यादी', cols: [ANU, MAL, GHAR, BHOG, C('पाण्याची व्यवस्था', 'pinyacha_panyachi_vyavastha', { w: 1.8 }), PAN] },
  shouchalay: { title: 'शौचालय यादी', cols: [ANU, MAL, GHAR, BHOG, C('शौचालय', 'ghari_souychalaya', { w: 1.4 }), PAN] },
  namuna9anu: { title: 'नमुना ९ अनुक्रमणिका', cols: [ANU, MAL, WARD, GHAR, BHOG, PATTA, C('एकूण कर', 'ekun_kar_bharne', { num: true, w: 1.4, nw: true }), PAN] },
  namuna8anu: { title: 'नमुना ८ अनुक्रमणिका', cols: [ANU, MAL, WARD, GHAR, BHOG, C('मिलकत प्रकार', 'milkat_prakar', { w: 1.6 }), PATTA, PAN] },
};

const AnukramikaCard = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [ward, setWard] = useState('');
  const [loc, setLoc] = useState<Loc>({ district: '', taluka: '', gramPanchayat: '' });
  const [hdrColor, setHdrColor] = useState('');

  const variant = new URLSearchParams(window.location.search).get('variant') || 'imlakar';
  const cfg = CFG[variant] || CFG.imlakar;

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.body.classList.add('hide-gv-floats');
    document.title = `${cfg.title} — नवीन`;
    const isImla = (n: Row) => { const v = s(n.milkat_prakar).trim().toLowerCase(); return v === 'imlakar' || v === 'इमलाकर'; };
    try {
      const raw = sessionStorage.getItem('dharkachiYadiCardData');
      const meta = JSON.parse(sessionStorage.getItem('dharkachiYadiCardMeta') || '{}');
      if (meta.loc) setLoc(meta.loc);
      if (meta.ward) setWard(String(meta.ward));
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        if (Array.isArray(parsed) && parsed.length) { setRecords(parsed); setLoading(false); return; }
      }
    } catch { /* fall through */ }
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try { params = JSON.parse(sessionStorage.getItem('anukramikaParams') || '{}'); } catch { params = {}; }
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
        if (res.success) {
          const all = (res.data as Row[]) || [];
          setRecords(cfg.imlaOnly ? all.filter(isImla) : all);
        }
      } catch (e) { console.error('Failed to load anukramika (card)', e); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('anukramikaParams') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'anukramika', sessionKey: 'anukramikaParams', params: shareParams, data: records, enabled: !isPublicReportMode() });

  const PER = 100;
  const [pg, setPg] = useState(0);
  const [printing, setPrinting] = useState(false);
  const totalPages = Math.max(1, Math.ceil(records.length / PER));
  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => { window.print(); setPrinting(false); }, 200);
    return () => clearTimeout(t);
  }, [printing]);
  const visible = printing ? records : records.slice(pg * PER, pg * PER + PER);

  return (
    <div className={`ak-report${hdrColor ? ' hdr-custom' : ''}`} style={headerVars(hdrColor)}>
      <style>{AK_CSS}</style>
      {!isPublicReportMode() && (
        <div className="ak-toolbar no-print">
          <button onClick={() => setPrinting(true)} className="ak-print-btn">🖨️ Print / Save as PDF (सर्व {records.length})</button>
          <HeaderStyleControl color={hdrColor} onChange={setHdrColor} />
          {records.length > PER && (
            <span className="ak-pager">
              <button onClick={() => setPg((p) => Math.max(0, p - 1))} disabled={pg === 0}>‹ मागे</button>
              <b>पान {pg + 1}/{totalPages}</b>
              <button onClick={() => setPg((p) => Math.min(totalPages - 1, p + 1))} disabled={pg + 1 >= totalPages}>पुढे ›</button>
              <i>({pg * PER + 1}–{Math.min((pg + 1) * PER, records.length)} / {records.length})</i>
            </span>
          )}
        </div>
      )}
      <article className="ak-card">
        <header className="ak-head">
          {qrUrl && <span className="ak-qr"><QRCodeSVG value={qrUrl} size={52} level="M" marginSize={0} /></span>}
          <h1>{cfg.title}</h1>
          <p className="ak-loc"><span>जिल्हा: <b>{loc.district || '—'}</b></span><span>तालुका: <b>{loc.taluka || '—'}</b></span><span>ग्रामपंचायत: <b>{loc.gramPanchayat || '—'}</b></span>{ward ? <span>वार्ड: <b>{ward}</b></span> : null}</p>
        </header>
        <div className="ak-body">
          {records.length === 0 ? (
            <p className="ak-loading">{loading ? 'लोड होत आहे…' : 'या निवडीसाठी माहिती उपलब्ध नाही'}</p>
          ) : (
            <table className="ak-table">
              <colgroup>{(() => { const sum = cfg.cols.reduce((a, x) => a + wt(x), 0); return cfg.cols.map((c, i) => <col key={i} style={{ width: `${(wt(c) / sum) * 100}%` }} />); })()}</colgroup>
              <thead>
                <tr>{cfg.cols.map((c, i) => <th key={i} className={c.L ? 'ak-l' : ''}>{c.h}</th>)}</tr>
              </thead>
              <tbody>
                {visible.map((n, i) => (
                  <tr key={i}>
                    {cfg.cols.map((c, j) => (
                      <td key={j} className={`${c.L ? 'ak-l' : ''}${c.nw ? ' ak-nw' : ''}`}>{c.num ? f(n[c.k]) : (s(n[c.k]) || '—')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>
    </div>
  );
};

const AK_CSS = `
  :root { --ink:#1e293b; --muted:#64748b; --faint:#94a3b8; --line:#e2e8f0; --accent:#4338ca; --accent2:#6366f1; --soft:#eef2ff; }
  html, body { background:#f1f5f9 !important; }
  .ak-report { min-height:100vh; padding:28px 16px 56px; font-family:'Inter','Noto Sans',system-ui,sans-serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .ak-toolbar { max-width:940px; margin:0 auto 18px; display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  .ak-print-btn { background:var(--accent); color:#fff; border:none; padding:11px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(67,56,202,.28); }
  .ak-print-btn:hover { background:#3730a3; }
  .ak-pager { display:inline-flex; align-items:center; gap:8px; font-size:13px; }
  .ak-pager button { background:#fff; border:1px solid var(--line); border-radius:8px; padding:5px 10px; font-weight:600; color:var(--accent); cursor:pointer; }
  .ak-pager button:disabled { color:var(--faint); cursor:default; }
  .ak-pager i { font-style:normal; color:var(--muted); font-size:12px; }
  .ak-loading { text-align:center; color:var(--muted); padding:48px 0; }

  .ak-card { max-width:940px; margin:0 auto; background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(2,6,23,.07); }
  .ak-head { position:relative; text-align:center; padding:16px 22px; background:linear-gradient(120deg,var(--accent),var(--accent2)); color:#fff; }
  .ak-head h1 { margin:0; font-size:20px; font-weight:800; }
  .ak-loc { display:flex; flex-wrap:wrap; justify-content:center; gap:3px 18px; margin:7px 0 0; font-size:12.5px; opacity:.95; }
  .ak-qr { position:absolute; top:12px; right:14px; background:#fff; padding:3px; border-radius:7px; line-height:0; }

  .ak-body { padding:6px 0 0; }
  .ak-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:13px; }
  .ak-table th { background:#f1f5f9; color:var(--accent); font-weight:700; font-size:11px; padding:7px 8px; text-align:center; border-bottom:1px solid var(--line); line-height:1.25; white-space:normal; word-break:keep-all; overflow-wrap:normal; vertical-align:middle; }
  .ak-table th.ak-l { text-align:left; }
  .ak-table td { padding:7px 8px; text-align:center; border-bottom:1px solid #f1f5f9; overflow-wrap:break-word; line-height:1.3; }
  .ak-table td.ak-l { text-align:left; }
  .ak-table td.ak-nw { white-space:nowrap; overflow-wrap:normal; }
  .ak-table tbody tr:nth-child(even) td { background:#fafbfc; }

  @media screen and (max-width:820px){ .ak-report{ overflow-x:auto; } .ak-card{ min-width:720px; } }

  @media print {
    @page { size:A4 portrait; margin:16mm 10mm 12mm 14mm; }
    html, body { background:#fff !important; }
    .no-print { display:none !important; }
    .ak-report { padding:0; }
    .ak-card { box-shadow:none; border:none; margin:0; max-width:100%; border-radius:0; }
    .ak-head { border-radius:0; }
    .ak-table thead { display:table-header-group; }
    .ak-table td, .ak-table th { font-size:12.5px !important; }
  }
`;

export default AnukramikaCard;

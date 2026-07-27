import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';

/* सरकारी नमुना ८ (multiple) — same layout as /namuna-8-sarkari-1, one block per property/page.
   Filters via sessionStorage 'sarkari8Params' from the Namuna 8 ahval page. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : Math.round(num).toString();
};

const sqmOf = (it: Row) => Number(it.ekun_shetrafal_choras_foot || 0) * 0.092903;
const landBhandvali = (it: Row) => sqmOf(it) * Number(it.jaminiche_varshik_mulya || 0);
const consBhandvali = (it: Row) =>
  sqmOf(it) * Number(it.imaratiche_varshik_mulya || 0) * Number(it.bharank || 0);
const manoraKar = (it: Row) =>
  Number(it.ekun_shetrafal_choras_foot || 0) * Number(it.aakarani_dar || 0) * (Number(it.majla) || 1);

const td = 'border border-black px-1.5 py-1 text-[11px] align-middle text-center';
const thc = `${td} font-bold bg-gray-100`;
const colW = [55, 70, 80, 75, 90, 75, 75, 85, 75, 90, 70, 80, 80, 75, 90];
const tableW = colW.reduce((x, y) => x + y, 0);

const RecordBlock = ({ n, loc, qrUrl, blank = false }: { n: Row; loc: { district: string; taluka: string; gramPanchayat: string }; qrUrl?: string; blank?: boolean }) => {
  // blank form: value cells रिकामे (0 सुद्धा नको), header dynamic
  const sv = (v: unknown) => (blank ? '' : s(v));
  const fv = (v: unknown) => (blank ? '' : f(v));
  const blankH = blank ? { height: '30px' } : undefined;
  const BLANK_DESC_ROWS = 8;
  const land = blank ? [] : ((n.khula_bhukhand_kar_aakarani as Row[]) || []);
  const cons = blank ? [] : ((n.bandkamachi_kar_aakarani as Row[]) || []);
  const manora = blank ? [] : ((n.manoryache_kar_aakarani as Row[]) || []);
  const otherTax = (n.other_tax_calculation as Row[]) || [];
  const taxAmt = (id: number) => {
    const r = otherTax.find((t) => Number(t.tax_id) === id);
    return r && r.tax_rate != null ? Number(r.tax_rate) : 0;
  };
  const vizAmt = taxAmt(1);
  const aarogyaAmt = taxAmt(2);
  const samanyaPaniAmt = taxAmt(4);
  const visheshPaniAmt = taxAmt(5);
  const landRows = land.length ? land : [{} as Row];
  const a = landRows.length + cons.length + manora.length;

  return (
    <div className="n8sm-page mx-auto relative" style={{ width: `${tableW}px` }}>
      {qrUrl && (
        <span style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
          <QRCodeSVG value={qrUrl} size={56} level="M" marginSize={0} />
        </span>
      )}
      <div className="text-center">
        <p className="font-bold text-[22px]">नमुना ८</p>
      </div>
      <div className="text-[16px] font-bold mt-1">ग्रामपंचायत कार्यालय :- {loc.gramPanchayat}</div>
      <div className="flex justify-between text-[16px] mt-1 mb-1">
        <span>जिल्हा :- {loc.district}</span>
        <span>तालुका :- {loc.taluka}</span>
        <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
      </div>

      <table className="table-fixed border-collapse" style={{ width: `${tableW}px` }}>
        <colgroup>{colW.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
        <tbody>
          {/* Section 1 header */}
          <tr>
            <td className={thc} rowSpan={2}>अनु क्रं.</td>
            <td className={thc} rowSpan={2}>रस्त्याचे नाव</td>
            <td className={thc} rowSpan={2}>सिटी सर्वे नं.</td>
            <td className={thc} rowSpan={2}>मालमत्ता क्र</td>
            <td className={thc} rowSpan={2} colSpan={3}>घर मालकाचे नाव</td>
            <td className={thc} rowSpan={2} colSpan={2}>भोगवटदाराचे नाव</td>
            <td className={thc} rowSpan={2}>मालमत्तेचे वर्णन</td>
            <td className={thc} rowSpan={2}>बांधकामाचे वय / वर्ष</td>
            <td className={thc} rowSpan={2}>क्षेत्रफळ ( चौ . फु .)</td>
            <td className={thc} colSpan={3}>रेडीरेकनर दरानुसार प्रति चौरस मीटर रुपये</td>
          </tr>
          <tr>
            <td className={thc}>जमीन</td>
            <td className={thc}>इमारत</td>
            <td className={thc}>बांधकाम</td>
          </tr>

          {/* blank form: हाताने भरण्यासाठी रिकाम्या ओळी (15 columns) */}
          {blank && Array.from({ length: BLANK_DESC_ROWS }).map((_, i) => (
            <tr key={`blank-desc-${i}`} style={{ height: '28px' }}>
              <td className={td} colSpan={2}>&nbsp;</td>
              {Array.from({ length: 11 }).map((__, j) => <td key={j} className={td}>&nbsp;</td>)}
              <td className={td} colSpan={2}>&nbsp;</td>
            </tr>
          ))}
          {landRows.map((it, i) => (
            <tr key={`l1-${i}`} style={blankH}>
              {i === 0 && (
                <>
                  <td className={td} rowSpan={a}>{sv(n.anu_kramank)}</td>
                  <td className={td} rowSpan={a} />
                  <td className={td} rowSpan={a}>{sv(n.survey_number)}</td>
                  <td className={td} rowSpan={a}>{sv(n.malmatta_number)}</td>
                  <td className={td} rowSpan={a} colSpan={3}>{sv(n.ghar_malkache_nav)}</td>
                  <td className={td} rowSpan={a} colSpan={2}>{sv(n.bhogavat_darache_nav)}</td>
                </>
              )}
              <td className={td}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td} />
              <td className={td}>{fv(it.ekun_shetrafal_choras_foot)}<br />{fv(sqmOf(it))}</td>
              <td className={td}>{fv(it.jaminiche_varshik_mulya)}</td>
              <td className={td} />
              <td className={td} />
            </tr>
          ))}
          {cons.map((it, i) => (
            <tr key={`c1-${i}`} style={blankH}>
              <td className={td}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td}>{sv(it.vayoman)}</td>
              <td className={td}>{fv(it.ekun_shetrafal_choras_foot)}<br />{fv(sqmOf(it))}</td>
              <td className={td} />
              <td className={td}>{fv(it.imaratiche_varshik_mulya)}</td>
              <td className={td}>{sv(it.bandkam_majla_name)}</td>
            </tr>
          ))}
          {manora.map((it, i) => (
            <tr key={`m1-${i}`} style={blankH}>
              <td className={td}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td} />
              <td className={td}>{fv(it.ekun_shetrafal_choras_foot)}<br />{fv(sqmOf(it))}</td>
              <td className={td} />
              <td className={td} />
              <td className={td}>{sv(it.manoryache_bhag_name)}</td>
            </tr>
          ))}

          {/* Section 2 header */}
          <tr>
            <td className={thc} rowSpan={2}>घसारा</td>
            <td className={thc} rowSpan={2}>भारांक</td>
            <td className={thc} rowSpan={2}>भांडवली मूल्य</td>
            <td className={thc}>कराचा दार</td>
            <td className={thc} colSpan={5}>कराची रक्कम</td>
            <td className={thc} colSpan={5}>अपिलाचे निकाल आणि त्यानंतर केलेले फेरफार ( रुपये )</td>
            <td className={thc} rowSpan={2}>नंतर वळ किंवा घाट बदलचा शेरा</td>
          </tr>
          <tr>
            <td className={thc}>रुपये</td>
            <td className={thc}>गृह व भूमीकर</td>
            <td className={thc}>वीज कर</td>
            <td className={thc}>आरक्षण</td>
            <td className={thc}>पाणीपट्टी कर</td>
            <td className={thc}>एकूण</td>
            <td className={thc}>गृह व भूमीकर</td>
            <td className={thc}>वीज कर</td>
            <td className={thc}>आरक्षण</td>
            <td className={thc}>पाणीपट्टी कर</td>
            <td className={thc}>एकूण</td>
          </tr>

          {landRows.map((it, i) => (
            <tr key={`l2-${i}`} style={blankH}>
              <td className={td} />
              <td className={td} />
              <td className={td}>{fv(landBhandvali(it))}</td>
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td}>{fv(landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
              {i === 0 && (
                <>
                  <td className={td} rowSpan={a}>{fv(vizAmt)}</td>
                  <td className={td} rowSpan={a}>{fv(aarogyaAmt)}</td>
                  <td className={td} rowSpan={a}>{fv(samanyaPaniAmt)}<br /><br />{fv(visheshPaniAmt)}</td>
                  <td className={td} rowSpan={a}>{fv(n.ekun_kar_bharne)}</td>
                  <td className={td} rowSpan={a} />
                  <td className={td} rowSpan={a} />
                  <td className={td} rowSpan={a} />
                  <td className={td} rowSpan={a} />
                  <td className={td} rowSpan={a} />
                  <td className={td} rowSpan={a} />
                </>
              )}
            </tr>
          ))}
          {cons.map((it, i) => (
            <tr key={`c2-${i}`} style={blankH}>
              <td className={td}>{sv(it.ghasara_dar)}</td>
              <td className={td}>{sv(it.bharank)}</td>
              <td className={td}>{fv(consBhandvali(it))}</td>
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td}>{fv(consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}
          {manora.map((it, i) => (
            <tr key={`m2-${i}`} style={blankH}>
              <td className={td} />
              <td className={td} />
              <td className={td} />
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td}>{fv(manoraKar(it))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right text-sm mt-1">पान नंबर : {sv(n.anu_kramank)}</div>
    </div>
  );
};

const Namuna8SarkariMultiReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1.1);
  const [ndOpen, setNdOpen] = useState(false); // "नवीन डिझाईन" dropdown
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
    document.title = 'सरकारी नमुना ८';
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('sarkari8Params') || '{}');
    } catch {
      params = {};
    }
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load sarkari multi', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('sarkari8Params') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'namuna8-sarkari', sessionKey: 'sarkari8Params', params: shareParams, data: records, enabled: !isPublicReportMode() });

  return (
    <div className="n8sm-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .n8sm-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 24mm 4mm 8mm 16mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .n8sm-report { zoom: 0.85; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .n8sm-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n8sm-zoom { zoom: 1 !important; }
          .n8sm-page { page-break-after: always; page-break-inside: avoid; break-inside: avoid; }
          .n8sm-page:last-child { page-break-after: auto; }
          /* print-only: enlarge cell text for readability (screen unaffected) */
          .n8sm-report td { font-size: 15px !important; line-height: 1.15 !important; }
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
        {!isPublicReportMode() && (
          <div className="relative">
            <button
              onClick={() => setNdOpen((o) => !o)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium shadow-sm transition-colors"
            >
              🎨 नवीन डिझाईन (New Design) ▾
            </button>
            {ndOpen && (
              <div className="absolute left-0 z-20 mt-1 w-60 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {([['portrait', '📄 नवीन डिझाईन — Vertical'], ['landscape', '🖥️ नवीन डिझाईन — Landscape']] as const).map(([o, label]) => (
                  <button
                    key={o}
                    onClick={() => {
                      let yr = new Date().getFullYear();
                      try {
                        const p = JSON.parse(sessionStorage.getItem('sarkari8Params') || '{}');
                        if (p.year && !isNaN(Number(p.year))) yr = Number(p.year);
                        sessionStorage.setItem('dharkachiYadiCardData', JSON.stringify(records));
                        sessionStorage.setItem('dharkachiYadiCardMeta', JSON.stringify({ year: yr, loc, qrUrl }));
                      } catch { /* ignore quota */ }
                      window.open(`/view-dharkachi-yadi-card?orient=${o}&variant=sarkari`, '_blank');
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

      <div className="n8sm-wrap overflow-x-auto">
        <div className="n8sm-zoom space-y-10 print:space-y-0" style={{ zoom }}>
          {records.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              {loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}
            </p>
          ) : (
            <>
              {records.map((n, i) => <RecordBlock key={i} n={n} loc={loc} qrUrl={qrUrl} />)}
              {/* शेवटी एक कोरी (blank) यादी — जिल्हा/तालुका/ग्रा.पं. dynamic, बाकी हाताने भरण्यासाठी रिकामी */}
              <RecordBlock key="blank" n={{}} loc={loc} blank />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Namuna8SarkariMultiReport;

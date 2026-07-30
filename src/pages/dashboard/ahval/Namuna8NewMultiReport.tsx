import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';
import { fyLabel } from '../../../utils/fyConfig';

/* नमुना ८ नवीन आवृत्ती (multiple) — नमुना ८ नियम ३२(१), one block per property/page.
   Filters via sessionStorage 'namuna8NewParams' from the Namuna 8 ahval page. */

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

const td = 'border border-black px-0.5 py-0.5 text-[9px] align-middle text-center';
const tdL = 'border border-black px-0.5 py-0.5 text-[9px] align-middle text-left';
const th = 'border border-black px-0.5 py-0.5 text-[8.5px] align-middle text-center font-bold bg-gray-100';
const thv = `${th} n8n-vert`;
const tdv = `${td} n8n-vert`;
const colW = [30, 26, 26, 40, 80, 80, 110, 26, 50, 24, 24, 24, 24, 24, 26, 24, 38, 24, 24, 26, 40, 38, 24, 24, 24, 40, 60];
const tableW = colW.reduce((x, y) => x + y, 0);
const sumBase = Math.floor(tableW / 6);
const sumW = [sumBase, sumBase, sumBase, sumBase, sumBase, tableW - sumBase * 5];

const area = (it: Row) => (
  <>{f(sqmOf(it))}<br />( {f(it.ekun_shetrafal_choras_foot)} चौ,फू )</>
);
const dims = (it: Row) => `( लांबी ${f(it.shetrafal_purv_paschim_foot)} x रुंदी ${f(it.shetrafal_uttar_dakshin_foot)} )`;

const RecordBlock = ({ n, loc, cy, qrUrl, blank = false }: { n: Row; loc: { district: string; taluka: string; gramPanchayat: string }; cy: number; qrUrl?: string; blank?: boolean }) => {
  // blank form: value cells रिकामे (0 सुद्धा नको), header dynamic
  const sv = (v: unknown) => (blank ? '' : s(v));
  const fv = (v: unknown) => (blank ? '' : f(v));
  const blankH = blank ? { height: '30px' } : undefined;
  const BLANK_DESC_ROWS = 8;
  const land = blank ? [] : ((n.khula_bhukhand_kar_aakarani as Row[]) || []);
  const cons = blank ? [] : ((n.bandkamachi_kar_aakarani as Row[]) || []);
  const manora = blank ? [] : ((n.manoryache_kar_aakarani as Row[]) || []);
  const landRows = blank ? [] : (land.length ? land : [{} as Row]);
  const otherTax = (n.other_tax_calculation as Row[]) || [];
  const taxAmt = (id: number) => {
    const r = otherTax.find((t) => Number(t.tax_id) === id);
    return r && r.tax_rate != null ? Number(r.tax_rate) : 0;
  };
  const gruhkarAmt = Number(n.gruhkar_v_bhumikar || 0);
  const vizAmt = taxAmt(1);
  const aarogyaAmt = taxAmt(2);
  const safaiAmt = taxAmt(3);
  const samanyaPaniAmt = taxAmt(4);
  const visheshPaniAmt = taxAmt(5);
  const paniAmt = samanyaPaniAmt !== 0 ? samanyaPaniAmt : visheshPaniAmt;

  return (
    <div className="n8nm-page mx-auto" style={{ width: `${tableW}px` }}>
      <div className="text-center">
        <p className="font-bold text-base">नमुना ८ नियम ३२ (१)</p>
        <p className="text-sm">सन. {fyLabel(cy)} साठी कर आकारणी नोंदवही (वैयक्तिक असेसमेंट उतारा पाहण्याकरीता)</p>
      </div>
      <div className="flex justify-between text-xs mt-1 mb-1">
        <span className="relative">
          {qrUrl && (
            <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 2, zIndex: 10 }}>
              <QRCodeSVG value={qrUrl} size={40} level="M" marginSize={0} />
            </span>
          )}
          ग्रामपंचायत :- {loc.gramPanchayat}
        </span>
        <span>तालुका :- {loc.taluka}</span>
        <span>जिल्हा :- {loc.district}</span>
        <span>वार्ड नं. {sv(n.ward_kramnak)}</span>
      </div>

      <table className="table-fixed border-collapse" style={{ width: `${tableW}px` }}>
        <colgroup>{colW.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
        <thead>
          <tr>
            <th className={th} rowSpan={2}>अ.क्र.</th>
            <th className={thv} rowSpan={2}>रस्त्याचे नाव गल्लीचे नाव</th>
            <th className={thv} rowSpan={2}>गट क्र. भूमापन क्र.</th>
            <th className={th} rowSpan={2}>मालमत्ता क्रमांक</th>
            <th className={th} rowSpan={2}>मालकाचे नाव (धारण करणाऱ्याचे नाव)</th>
            <th className={th} rowSpan={2}>भोगवटा करणाऱ्याचे नाव</th>
            <th className={th} rowSpan={2}>मालमत्तेचे वर्णन</th>
            <th className={thv} rowSpan={2}>मिळकत बांधकामाचे वर्ष (वयोमान वर्षामध्ये)</th>
            <th className={th} rowSpan={2}>क्षेत्रफळ चौ मी / (चौ.फू)</th>
            <th className={th} colSpan={3}>रेडीरेकनर दर प्रति चौ मी</th>
            <th className={thv} rowSpan={2}>घसारा</th>
            <th className={thv} rowSpan={2}>इ. वापरानुसार भारांक</th>
            <th className={thv} rowSpan={2}>भांडवली मूल्य</th>
            <th className={thv} rowSpan={2}>कराचा दर</th>
            <th className={th} colSpan={5}>वार्षिक कराची रक्कम (रुपयात)</th>
            <th className={th} colSpan={5}>अपीलाचे निकाल व त्यावर केलेले फेरफार</th>
            <th className={th} rowSpan={2}>नंतर वाढ किंवा घट झालेल्या बाबतीत आदेशाच्या संदर्भात शेरा</th>
          </tr>
          <tr>
            <th className={thv}>जमीन</th>
            <th className={thv}>इमारत</th>
            <th className={thv}>बांधकाम</th>
            <th className={th}>इमारत कर</th>
            <th className={thv}>दिवाबत्ती कर</th>
            <th className={thv}>आरोग्य कर</th>
            <th className={thv}>सार्व/खास पा.पट्टी</th>
            <th className={th}>एकूण</th>
            <th className={th}>इमारत कर</th>
            <th className={thv}>दिवाबत्ती कर</th>
            <th className={thv}>आरोग्य कर</th>
            <th className={thv}>सार्व. पा. पट्टी</th>
            <th className={thv}>एकूण</th>
          </tr>
          <tr>
            {Array.from({ length: 27 }).map((_, i) => (
              <th key={i} className={th}>{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* blank form: हाताने भरण्यासाठी रिकाम्या ओळी (27 columns) */}
          {blank && Array.from({ length: BLANK_DESC_ROWS }).map((_, i) => (
            <tr key={`blank-desc-${i}`} style={{ height: '28px' }}>
              <td className={td} colSpan={2}>&nbsp;</td>
              {Array.from({ length: 23 }).map((__, j) => <td key={j} className={td}>&nbsp;</td>)}
              <td className={td} colSpan={2}>&nbsp;</td>
            </tr>
          ))}
          {landRows.map((it, i) => (
            <tr key={`l${i}`}>
              <td className={td}>{i === 0 ? sv(n.anu_kramank) : ''}</td>
              <td className={td} />
              <td className={td} />
              <td className={td}>{i === 0 ? sv(n.malmatta_number) : ''}</td>
              <td className={tdL}>{i === 0 ? sv(n.ghar_malkache_nav) : ''}</td>
              <td className={tdL}>{i === 0 ? sv(n.bhogavat_darache_nav) : ''}</td>
              <td className={tdL}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td} />
              <td className={td}>{area(it)}</td>
              <td className={tdv}>{fv(it.jaminiche_varshik_mulya)}</td>
              <td className={td} />
              <td className={td} />
              <td className={td} />
              <td className={td} />
              <td className={tdv}>{fv(landBhandvali(it))}</td>
              <td className={tdv}>{sv(it.aakarani_dar)}</td>
              <td className={td}>{fv(landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
              <td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={td} />
            </tr>
          ))}
          {cons.map((it, i) => (
            <tr key={`c${i}`}>
              <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={tdL}>
                {sv(it.malmatteche_varnan_name)}, {sv(it.vapar_prakar)}, {sv(it.bandkam_majla_name)}<br />{dims(it)}
              </td>
              <td className={tdv}>{sv(it.vayoman)}</td>
              <td className={td}>{area(it)}</td>
              <td className={td} />
              <td className={td} />
              <td className={tdv}>{fv(it.imaratiche_varshik_mulya)}</td>
              <td className={tdv}>{sv(it.ghasara_dar)}</td>
              <td className={tdv}>{sv(it.bharank)}</td>
              <td className={tdv}>{fv(consBhandvali(it))}</td>
              <td className={tdv}>{sv(it.aakarani_dar)}</td>
              <td className={td}>{fv(consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
              <td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={td} />
            </tr>
          ))}
          {manora.map((it, i) => (
            <tr key={`m${i}`}>
              <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={tdL}>
                {sv(it.vapar_prakar)}, {sv(it.manoryache_bhag_name)}<br />{dims(it)}
              </td>
              <td className={td} />
              <td className={td}>{area(it)}</td>
              <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={tdv}>{sv(it.aakarani_dar)}</td>
              <td className={td}>{fv(manoraKar(it))}</td>
              <td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={td} />
            </tr>
          ))}
        </tbody>
      </table>

      <table className="table-fixed border-collapse mt-2" style={{ width: `${tableW}px` }}>
        <colgroup>{sumW.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
        <thead>
          <tr>
            <th className={th}>एकूण इमारत कर</th>
            <th className={th}>एकूण दिवाबत्ती कर</th>
            <th className={th}>एकूण आरोग्य कर</th>
            <th className={th}>एकूण पाणीपट्टी</th>
            <th className={th}>एकूण पडसर कर</th>
            <th className={th}>एकूण कराची रक्कम</th>
          </tr>
        </thead>
        <tbody>
          <tr style={blankH}>
            <td className={td}>{fv(gruhkarAmt)}</td>
            <td className={td}>{fv(vizAmt)}</td>
            <td className={td}>{fv(aarogyaAmt)}</td>
            <td className={td}>{fv(paniAmt)}</td>
            <td className={td}>{fv(safaiAmt)}</td>
            <td className={td}>{fv(n.ekun_kar_bharne)}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-[10px] leading-snug mt-2 space-y-1">
        <p>1. सदरचा उतारा हा मालकी हक्काचा नसून कर आकारणीचा आहे, सदरच्या उताऱ्यावरून खरेदी विक्रीचा व्यवहार झालेस त्यास ग्रामपंचायत जबाबदार राहणार नाही.</p>
        <p>2. शासन परिपत्रक क्र VTM२६०३/ प्र.क्र. २०६८ / पं.रा. ४ दि २० नोव्हेंबर २०२३ नुसार ग्रामीण भागातील घरांची नोंदणी पती-पत्नी यांच्या संयुक्त नावे करण्याबाबत निर्देशित करण्यात आलेले आहे.</p>
        <p className="text-red-600">3. सदर वैयक्तिक असेसमेंट उतारा पाहण्याकरीता आपणास सादर करण्याकरीता देण्यात आलेला आहे.</p>
      </div>
      <div className="text-right text-sm mt-2">पान नंबर : {blank ? '   ' : sv(n.anu_kramank)}</div>
    </div>
  );
};

const Namuna8NewMultiReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [zoom, setZoom] = useState(1.3); // SCREEN-only default zoom (130%); does not affect print
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
    document.title = 'नमुना ८ नवीन आवृत्ती';
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('namuna8NewParams') || '{}');
    } catch {
      params = {};
    }
    if (params.year && !isNaN(Number(params.year))) setReportYear(Number(params.year));
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load namuna-8-new multi', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('namuna8NewParams') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'namuna8-new', sessionKey: 'namuna8NewParams', params: shareParams, data: records, enabled: !isPublicReportMode() });

  return (
    <div className="n8nm-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .n8nm-report { min-height: 100vh; background: #fff; }
        .n8n-vert { writing-mode: vertical-rl; text-orientation: mixed; white-space: nowrap; }
        @media print {
          @page { size: A4 landscape; margin: 24mm 4mm 8mm 12mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .n8nm-report { zoom: 0.9; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .n8nm-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n8nm-zoom { zoom: 1 !important; }   /* ignore screen zoom while printing */
          /* each report must stay on a single page */
          .n8nm-page { page-break-after: always; page-break-inside: avoid; break-inside: avoid; }
          .n8nm-page:last-child { page-break-after: auto; }
          /* print-only: enlarge dense cell text for readability (screen unaffected) */
          .n8nm-report td { font-size: 11px !important; line-height: 1.15 !important; }
          .n8nm-report th { font-size: 10px !important; }
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
                      try {
                        sessionStorage.setItem('dharkachiYadiCardData', JSON.stringify(records));
                        sessionStorage.setItem('dharkachiYadiCardMeta', JSON.stringify({ year: reportYear, loc, qrUrl }));
                      } catch { /* ignore quota */ }
                      window.open(`/view-dharkachi-yadi-card?orient=${o}&variant=namuna8new`, '_blank');
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

      <div className="n8nm-wrap overflow-x-auto">
        <div className="n8nm-zoom space-y-10 print:space-y-0" style={{ zoom }}>
          {records.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              {loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}
            </p>
          ) : (
            <>
              {records.map((n, i) => <RecordBlock key={i} n={n} loc={loc} cy={reportYear} qrUrl={qrUrl} />)}
              {/* शेवटी एक कोरी (blank) यादी — जिल्हा/तालुका/ग्रा.पं. dynamic, बाकी हाताने भरण्यासाठी रिकामी */}
              <RecordBlock key="blank" n={{}} loc={loc} cy={reportYear} blank />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Namuna8NewMultiReport;

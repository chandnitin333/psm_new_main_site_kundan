import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';

/* नमुना ८ नवीन आवृत्ती — नमुना ८ नियम ३२(१) कर आकारणी नोंदवही (वैयक्तिक असेसमेंट उतारा).
   Opened from the Print modal: /namuna-8-new-1?id=<nodni_id>. Same full nodni record source. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : Math.round(num).toString();
};

const Namuna8NewPrint = () => {
  const [n, setN] = useState<Row>({});
  const [land, setLand] = useState<Row[]>([]);
  const [cons, setCons] = useState<Row[]>([]);
  const [manora, setManora] = useState<Row[]>([]);
  const [zoom, setZoom] = useState(1.3); // SCREEN-only default zoom (≈ नमुना ८ width); does not affect print
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
  const cy = new Date().getFullYear();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.title = 'नमुना ८ नवीन आवृत्ती';
    const id = Number(new URLSearchParams(window.location.search).get('id'));
    // Public (scanned-QR) mode: use the embedded snapshot instead of fetching (no ?id in URL).
    const pub = getPublicReportData<Row>();
    if (pub) {
      setN(pub);
      setLand((pub.khula_bhukhand_kar_aakarani as Row[]) || []);
      setCons((pub.bandkamachi_kar_aakarani as Row[]) || []);
      setManora((pub.manoryache_kar_aakarani as Row[]) || []);
      return;
    }
    if (!id) return;
    (async () => {
      try {
        const res = await nodniService.getById(id);
        if (res.success && res.data) {
          const d = res.data as Row;
          setN(d);
          setLand((d.khula_bhukhand_kar_aakarani as Row[]) || []);
          setCons((d.bandkamachi_kar_aakarani as Row[]) || []);
          setManora((d.manoryache_kar_aakarani as Row[]) || []);
        }
      } catch (e) {
        console.error('Failed to load namuna-8-new data', e);
      }
    })();
  }, []);

  const __id = new URLSearchParams(window.location.search).get('id') || '';
  const qrUrl = useReportShareUrl({ reportType: 'namuna8-new-single', sessionKey: undefined, params: { id: __id }, data: n, enabled: !isPublicReportMode() && !!n.anu_kramank });

  // ---- formulas (same as नमुना ८) ----
  const sqmOf = (it: Row) => Number(it.ekun_shetrafal_choras_foot || 0) * 0.092903;
  const landBhandvali = (it: Row) => sqmOf(it) * Number(it.jaminiche_varshik_mulya || 0);
  const consBhandvali = (it: Row) =>
    sqmOf(it) * Number(it.imaratiche_varshik_mulya || 0) * Number(it.bharank || 0);
  const manoraKar = (it: Row) =>
    Number(it.ekun_shetrafal_choras_foot || 0) * Number(it.aakarani_dar || 0) * (Number(it.majla) || 1);

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

  const landRows = land.length ? land : [{} as Row];

  const td = 'border border-black px-0.5 py-0.5 text-[9px] align-middle text-center';
  const tdL = 'border border-black px-0.5 py-0.5 text-[9px] align-middle text-left';
  const th = 'border border-black px-0.5 py-0.5 text-[8.5px] align-middle text-center font-bold bg-gray-100';
  const thv = `${th} n8n-vert`; // vertical (rotated) header — for narrow many columns
  const tdv = `${td} n8n-vert`; // vertical (rotated) value — for narrow columns (e.g. भांडवली मूल्य)

  // 27-column fixed grid — vertical-label columns are narrow, text columns wider
  const colW = [30, 26, 26, 40, 80, 80, 110, 26, 50, 24, 24, 24, 24, 24, 26, 24, 38, 24, 24, 26, 40, 38, 24, 24, 24, 40, 60];
  const tableW = colW.reduce((x, y) => x + y, 0);
  // summary table spans the SAME total width as the main table (6 equal-ish columns)
  const sumTableW = tableW;
  const sumBase = Math.floor(tableW / 6);
  const sumW = [sumBase, sumBase, sumBase, sumBase, sumBase, tableW - sumBase * 5];

  const area = (it: Row) => (
    <>{f(sqmOf(it))}<br />( {f(it.ekun_shetrafal_choras_foot)} चौ,फू )</>
  );
  const dims = (it: Row) => `( लांबी ${f(it.shetrafal_purv_paschim_foot)} x रुंदी ${f(it.shetrafal_uttar_dakshin_foot)} )`;

  return (
    <div className="namuna8n-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .namuna8n-report { min-height: 100vh; background: #fff; }
        .n8n-vert { writing-mode: vertical-rl; text-orientation: mixed; white-space: nowrap; }
        @media print {
          @page { size: A4 landscape; margin: 24mm 4mm 8mm 16mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .namuna8n-report { zoom: 1.0; padding: 0 !important; min-height: 0; }   /* 1.05 overflowed to a 2nd page; content is 646px tall vs 673px usable — 1.0 fits with margin */
          .n8n-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n8n-zoom { zoom: 1 !important; page-break-inside: avoid; break-inside: avoid; }   /* ignore screen zoom while printing; keep report on one page */
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
          <button
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Zoom out"
          >
            −
          </button>
          <span className="w-14 text-center text-sm font-semibold text-gray-700 tabular-nums select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
            className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="ml-1 h-8 rounded px-3 text-xs font-medium text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>

        {/* नवीन डिझाईन (card) — view-namuna8-new-multi सारखेच; एकच record [n] पाठवतो */}
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
                        sessionStorage.setItem('dharkachiYadiCardData', JSON.stringify([n]));
                        sessionStorage.setItem('dharkachiYadiCardMeta', JSON.stringify({ year: cy, loc, qrUrl }));
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

      <div className="n8n-wrap overflow-x-auto">
      <div className="n8n-zoom mx-auto relative" style={{ width: `${tableW}px`, zoom }}>
        <div className="text-center">
          <p className="font-bold text-base">नमुना ८ नियम ३२ (१)</p>
          <p className="text-sm">सन. {cy}-{cy + 1} साठी कर आकारणी नोंदवही (वैयक्तिक असेसमेंट उतारा पाहण्याकरीता)</p>
        </div>
        <div className="flex justify-between text-xs mt-1 mb-1">
          <span className="relative">
            {qrUrl && (
              <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 2, zIndex: 10 }}>
                <QRCodeSVG value={qrUrl} size={44} level="M" marginSize={0} />
              </span>
            )}
            ग्रामपंचायत :- {loc.gramPanchayat}
          </span>
          <span>तालुका :- {loc.taluka}</span>
          <span>जिल्हा :- {loc.district}</span>
          <span>वार्ड नं. {s(n.ward_kramnak)}</span>
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
            {/* Land (खुला भूखंड) rows */}
            {landRows.map((it, i) => (
              <tr key={`l${i}`}>
                <td className={td}>{i === 0 ? s(n.anu_kramank) : ''}</td>
                <td className={td} />
                <td className={td} />
                <td className={td}>{i === 0 ? s(n.malmatta_number) : ''}</td>
                <td className={tdL}>{i === 0 ? s(n.ghar_malkache_nav) : ''}</td>
                <td className={tdL}>{i === 0 ? s(n.bhogavat_darache_nav) : ''}</td>
                <td className={tdL}>{s(it.malmatteche_varnan_name)}</td>
                <td className={td} />
                <td className={td}>{area(it)}</td>
                <td className={tdv}>{f(it.jaminiche_varshik_mulya)}</td>
                <td className={td} />
                <td className={td} />
                <td className={td} />
                <td className={td} />
                <td className={tdv}>{f(landBhandvali(it))}</td>
                <td className={tdv}>{s(it.aakarani_dar)}</td>
                <td className={td}>{f(landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
                <td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={td} />
              </tr>
            ))}
            {/* Construction (बांधकाम) rows */}
            {cons.map((it, i) => (
              <tr key={`c${i}`}>
                <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={tdL}>
                  {s(it.malmatteche_varnan_name)}, {s(it.vapar_prakar)}, {s(it.bandkam_majla_name)}<br />{dims(it)}
                </td>
                <td className={tdv}>{s(it.vayoman)}</td>
                <td className={td}>{area(it)}</td>
                <td className={td} />
                <td className={td} />
                <td className={tdv}>{f(it.imaratiche_varshik_mulya)}</td>
                <td className={tdv}>{s(it.ghasara_dar)}</td>
                <td className={tdv}>{s(it.bharank)}</td>
                <td className={tdv}>{f(consBhandvali(it))}</td>
                <td className={tdv}>{s(it.aakarani_dar)}</td>
                <td className={td}>{f(consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
                <td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={td} />
              </tr>
            ))}
            {/* Manora (मनोरा) rows */}
            {manora.map((it, i) => (
              <tr key={`m${i}`}>
                <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={tdL}>
                  {s(it.vapar_prakar)}, {s(it.manoryache_bhag_name)}<br />{dims(it)}
                </td>
                <td className={td} />
                <td className={td}>{area(it)}</td>
                <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={tdv}>{s(it.aakarani_dar)}</td>
                <td className={td}>{f(manoraKar(it))}</td>
                <td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
                <td className={td} />
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== Summary table ===== */}
        <table className="table-fixed border-collapse mt-2" style={{ width: `${sumTableW}px` }}>
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
            <tr>
              <td className={td}>{f(gruhkarAmt)}</td>
              <td className={td}>{f(vizAmt)}</td>
              <td className={td}>{f(aarogyaAmt)}</td>
              <td className={td}>{f(paniAmt)}</td>
              <td className={td}>{f(safaiAmt)}</td>
              <td className={td}>{f(n.ekun_kar_bharne)}</td>
            </tr>
          </tbody>
        </table>

        <div className="text-[10px] leading-snug mt-2 space-y-1">
          <p>1. सदरचा उतारा हा मालकी हक्काचा नसून कर आकारणीचा आहे, सदरच्या उताऱ्यावरून खरेदी विक्रीचा व्यवहार झालेस त्यास ग्रामपंचायत जबाबदार राहणार नाही.</p>
          <p>2. शासन परिपत्रक क्र VTM२६०३/ प्र.क्र. २०६८ / पं.रा. ४ दि २० नोव्हेंबर २०२३ नुसार ग्रामीण भागातील घरांची नोंदणी पती-पत्नी यांच्या संयुक्त नावे करण्याबाबत निर्देशित करण्यात आलेले आहे.</p>
          <p className="text-red-600">3. सदर वैयक्तिक असेसमेंट उतारा पाहण्याकरीता आपणास सादर करण्याकरीता देण्यात आलेला आहे.</p>
        </div>
        <div className="text-right text-sm mt-2">पान नंबर : {s(n.anu_kramank)}</div>
      </div>
      </div>
    </div>
  );
};

export default Namuna8NewPrint;

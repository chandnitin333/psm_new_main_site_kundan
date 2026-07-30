import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import config from '../../../config';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';
import { fyLabel } from '../../../utils/fyConfig';

/* इमलाकर मोजमाप यादी — नमुना-८ style block per property (one per printed page), now with
   a property-image box on the right (same fixed-grid layout as नमुना ८ चित्रे so everything
   fits). Only इमलाकर properties (मिलकत प्रकार = इमलाकर). Filters via sessionStorage 'imlakarParams'. */

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

const td = 'border border-black px-1 py-0.5 text-[11px] align-middle text-center';
const tdb = `${td} font-bold`;
const COLS = 29;
const pageW = 1450;
const backendBase = config.api.baseUrl.replace(/\/api$/, '');

const RecordBlock = ({ n, loc, cy, qrUrl, blank = false }: { n: Row; loc: { district: string; taluka: string; gramPanchayat: string }; cy: number; qrUrl?: string; blank?: boolean }) => {
  // blank form: value cells रिकामे (0 सुद्धा नको), header dynamic
  const sv = (v: unknown) => (blank ? '' : s(v));
  const fv = (v: unknown) => (blank ? '' : f(v));
  const blankH = blank ? { height: '30px' } : undefined;
  const BLANK_DESC_ROWS = 5;
  const land = blank ? [] : ((n.khula_bhukhand_kar_aakarani as Row[]) || []);
  const cons = blank ? [] : ((n.bandkamachi_kar_aakarani as Row[]) || []);
  const manora = blank ? [] : ((n.manoryache_kar_aakarani as Row[]) || []);
  const imgs = blank ? [] : ((n.images as Row[]) || []).filter((im) => im && im.image_path);
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
  const itarAmt = taxAmt(6);
  const ekunTaxAmt = vizAmt + aarogyaAmt + safaiAmt + samanyaPaniAmt + visheshPaniAmt + itarAmt;

  return (
    <div className="ik-page mx-auto" style={{ width: `${pageW}px` }}>
      <div className="text-center">
        <p className="font-bold text-lg">इमलाकर मोजमाप यादी</p>
        <p className="text-sm">
          सन {fyLabel(cy)} ते {fyLabel(cy + 3)} या वर्षासाठी करास पात्र असलेल्या इमारती व जमिनी (खुला भूखंड) यांची कर आकारणी नोंदवही.
        </p>
        <p className="text-sm">सदर नोंद ग्रामपंचायत नमुना ८ पान क्रमांक __{blank ? '   ' : sv(n.anu_kramank)}__ वरून घेण्यात आली</p>
      </div>
      <div className="flex justify-between text-sm mt-1 mb-1">
        <span>जिल्हा :- {loc.district}</span>
        <span>तालुका :- {loc.taluka}</span>
        <span className="relative">
          {qrUrl && (
            <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 2, zIndex: 10 }}>
              <QRCodeSVG value={qrUrl} size={56} level="M" marginSize={0} />
            </span>
          )}
          ग्रामपंचायत :- {loc.gramPanchayat}
        </span>
      </div>

      <table className="table-fixed w-full border-collapse">
        <colgroup>{Array.from({ length: COLS }).map((_, i) => <col key={i} style={{ width: `${pageW / COLS}px` }} />)}</colgroup>
        <tbody>
          <tr style={blankH}>
            <td className={td}>अ.क्र</td>
            <td className={td}>{sv(n.anu_kramank)}</td>
            <td className={td} colSpan={2}>मालमत्ता क्र.</td>
            <td className={td} colSpan={2}>{sv(n.malmatta_number)}</td>
            <td className={td} colSpan={2}>वार्ड क्र.</td>
            <td className={td}>{sv(n.ward_kramnak)}</td>
            <td className={td} colSpan={2}>प्लॉट क्र.</td>
            <td className={td}>{sv(n.plot_number)}</td>
            <td className={td} colSpan={2}>खसरा न.</td>
            <td className={td}>{sv(n.khasara_number)}</td>
            <td className={td} colSpan={2}>सर्वे क्र.</td>
            <td className={td}>{sv(n.survey_number)}</td>
            <td className={td} colSpan={2}>पाणी व्यवस्ता</td>
            <td className={td} colSpan={2}>{sv(n.pinyacha_panyachi_vyavastha)}</td>
            <td className={td} colSpan={2}>शौचालय</td>
            <td className={td}>{sv(n.ghari_souychalaya)}</td>
            <td className={td} colSpan={2}>मिलकत प्रकार</td>
            <td className={td} colSpan={2}>{sv(n.milkat_prakar) || '-'}</td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td className={tdb} colSpan={2}>घरमालकाचे नाव</td>
            <td className={td} colSpan={11}>{sv(n.ghar_malkache_nav)}</td>
            <td className={td} colSpan={9}>आधार कार्ड / वोटर कार्ड</td>
            <td className={`${td} p-1 align-middle`} colSpan={7} rowSpan={8} style={{ height: '264px' }}>
              {imgs.length > 0 ? (
                <div className="flex h-full flex-col gap-1" style={{ height: '262px' }}>
                  {imgs.map((im, i) => (
                    <img
                      key={i}
                      src={`${backendBase}/${im.image_path}`}
                      alt={`चित्र ${i + 1}`}
                      className="bg-white"
                      style={{ width: '100%', flex: '1 1 0', minHeight: 0, objectFit: 'fill', display: 'block' }}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 text-xs">{blank ? 'चित्र' : ' '}</span>
              )}
            </td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td className={tdb} colSpan={2}>पत्नी / मुलांचे नाव</td>
            <td className={td} colSpan={11}>{sv(n.patni_mulache_nav)}</td>
            <td className={td} colSpan={9}>{sv(n.aadahar_card_number)} &nbsp; {sv(n.matdar_card_number)}</td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td className={tdb} colSpan={2}>भोगवटदाराचे नाव</td>
            <td className={td} colSpan={11}>{sv(n.bhogavat_darache_nav)}</td>
            <td className={td} colSpan={9}>मोबाईल</td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td className={tdb} colSpan={2}>पत्ता</td>
            <td className={td} colSpan={11}>{sv(n.patta_nagar_layout_society)}</td>
            <td className={td} colSpan={9}>{sv(n.mobile_number)}</td>
          </tr>
          <tr style={{ height: '36px' }}>
            <td className={tdb} colSpan={2} rowSpan={2}>चतुर : सीमा</td>
            <td className={td} colSpan={5}>पूर्वेस</td>
            <td className={td} colSpan={5}>पश्चिमेस</td>
            <td className={td} colSpan={5}>उत्तरेस</td>
            <td className={td} colSpan={5}>दक्षिणेस</td>
          </tr>
          <tr style={{ height: '36px' }}>
            <td className={td} colSpan={5}>{sv(n.purv) || '-'}</td>
            <td className={td} colSpan={5}>{sv(n.paschim) || '-'}</td>
            <td className={td} colSpan={5}>{sv(n.uttar) || '-'}</td>
            <td className={td} colSpan={5}>{sv(n.dakshin) || '-'}</td>
          </tr>
          <tr style={{ height: '36px' }}>
            <td className={tdb} colSpan={2} rowSpan={2}>एकूण जागेचे क्षेत्रफळ</td>
            <td className={td} colSpan={3}>लांबी (चौ.फु.)</td>
            <td className={td} colSpan={3}>रुंदी (चौ.फु.)</td>
            <td className={td} colSpan={3}>क्षेत्रफळ (चौ.फु.)</td>
            <td className={td} colSpan={3}>क्षेत्रफळ (चौ.मीटर)</td>
            <td className={td} colSpan={4}>उर्वरितखाली जागा (चौ. फु.)</td>
            <td className={td} colSpan={4}>उर्वरितखाली जागा (चौ. मीटर)</td>
          </tr>
          <tr style={{ height: '36px' }}>
            <td className={td} colSpan={3}>{fv(n.lambi)}</td>
            <td className={td} colSpan={3}>{fv(n.rundi)}</td>
            <td className={td} colSpan={3}>{fv(n.shetrafal_choras_foot)}</td>
            <td className={td} colSpan={3}>{fv(n.shetrafal_choras_meter)}</td>
            <td className={td} colSpan={4}>{fv(n.urvarit_khali_jaga_choras_foot)}</td>
            <td className={td} colSpan={4}>{fv(Number(n.urvarit_khali_jaga_choras_foot || 0) * 0.092903)}</td>
          </tr>

          <tr className="font-bold bg-gray-100">
            <td className={td} colSpan={2}>मालमत्तेचे वर्णन</td>
            <td className={td} colSpan={2}>मालमत्तेचा प्रकार</td>
            <td className={td} colSpan={2}>वापराचा प्रकार</td>
            <td className={td} colSpan={2}>बांधकामाचा मजला</td>
            <td className={td}>वय / वर्ष</td>
            <td className={td} colSpan={2}>क्षेत्रफळ पु.प.(चौ.फूट)</td>
            <td className={td} colSpan={2}>क्षेत्रफळ उ. द. (चौ.फूट)</td>
            <td className={td} colSpan={2}>एकूण क्षेत्रफळ (चौ.फूट)</td>
            <td className={td} colSpan={2}>एकूण क्षेत्रफळ (चौ.मीटर)</td>
            <td className={td}>वार्षिक मूल्य</td>
            <td className={td}>घसारा</td>
            <td className={td}>भारांक</td>
            <td className={td} colSpan={2}>भांडवली मूल्य</td>
            <td className={td}>आकारणी दर</td>
            <td className={td} colSpan={3}>प्रति रु.१००० च्या भांडवली मूल्यावर</td>
            <td className={td} colSpan={3}>कर आकारणी</td>
          </tr>
          {/* blank form: हाताने भरण्यासाठी रिकाम्या ओळी (29 columns) */}
          {blank && Array.from({ length: BLANK_DESC_ROWS }).map((_, i) => (
            <tr key={`blank-desc-${i}`} style={{ height: '30px' }}>
              <td className={td} colSpan={2}>&nbsp;</td>
              {Array.from({ length: 24 }).map((__, j) => <td key={j} className={td}>&nbsp;</td>)}
              <td className={td} colSpan={3}>&nbsp;</td>
            </tr>
          ))}
          {land.map((it, i) => (
            <tr key={`l${i}`}>
              <td className={td} colSpan={2}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td} colSpan={2}>{sv(it.malmatteche_prakar_name)}</td>
              <td className={td} colSpan={2}>एकूण जागा</td>
              <td className={td} colSpan={2}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={2}>{fv(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td} colSpan={2}>{fv(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td} colSpan={2}>{fv(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td} colSpan={2}>{fv(sqmOf(it))}</td>
              <td className={td}>{fv(it.jaminiche_varshik_mulya)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={2}>{fv(landBhandvali(it))}</td>
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td} colSpan={3}>{fv(landBhandvali(it) / 1000)}</td>
              <td className={td} colSpan={3}>{fv(landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}
          {cons.map((it, i) => (
            <tr key={`c${i}`}>
              <td className={td} colSpan={2}>{sv(it.malmatteche_prakar_name)}</td>
              <td className={td} colSpan={2}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td} colSpan={2}>{sv(it.vapar_prakar)}</td>
              <td className={td} colSpan={2}>{sv(it.bandkam_majla_name)}</td>
              <td className={td}>{sv(it.vayoman)}</td>
              <td className={td} colSpan={2}>{fv(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td} colSpan={2}>{fv(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td} colSpan={2}>{fv(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td} colSpan={2}>{fv(sqmOf(it))}</td>
              <td className={td}>{fv(it.imaratiche_varshik_mulya)}</td>
              <td className={td}>{sv(it.ghasara_dar)}</td>
              <td className={td}>{sv(it.bharank)}</td>
              <td className={td} colSpan={2}>{fv(consBhandvali(it))}</td>
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td} colSpan={3}>{fv(consBhandvali(it) / 1000)}</td>
              <td className={td} colSpan={3}>{fv(consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}
          {manora.map((it, i) => (
            <tr key={`m${i}`}>
              <td className={td} colSpan={2}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td} colSpan={2}>{sv(it.malmatteche_prakar_name)}</td>
              <td className={td} colSpan={2}>{sv(it.vapar_prakar)}</td>
              <td className={td} colSpan={2}>{sv(it.manoryache_bhag_name)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={2}>{fv(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td} colSpan={2}>{fv(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td} colSpan={2}>{fv(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td} colSpan={2}>{fv(sqmOf(it))}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={2}>&nbsp;</td>
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td} colSpan={3}>&nbsp;</td>
              <td className={td} colSpan={3}>{fv(manoraKar(it))}</td>
            </tr>
          ))}

          <tr className="font-bold bg-gray-100">
            <td className={td} colSpan={11}>कराची रक्क्म</td>
            <td className={td} colSpan={11}>अपिलाचे निकाल आणि त्यानंतर केलेले फेरफार (रुपये)</td>
            <td className={td} colSpan={4}>गृह व भूमीकर</td>
            <td className={td} colSpan={3}>{fv(gruhkarAmt)}</td>
          </tr>
          <tr className="font-bold bg-gray-100">
            <td className={td} colSpan={2}>गृह व भूमीकर</td>
            <td className={td}>वीज</td>
            <td className={td}>आरोग्य</td>
            <td className={td}>सफाई</td>
            <td className={td} colSpan={2}>सा. पाणी</td>
            <td className={td} colSpan={2}>वि. पाणी</td>
            <td className={td}>एकूण</td>
            <td className={td}>एकूण कर</td>
            <td className={td} colSpan={2}>गृह व भूमीकर</td>
            <td className={td} colSpan={2}>वीज कर</td>
            <td className={td}>आरोग्य</td>
            <td className={td} colSpan={2}>सफाई कर</td>
            <td className={td} colSpan={2}>सा. पाणी</td>
            <td className={td} colSpan={2}>वि. पाणी</td>
            <td className={td} colSpan={4}>एकूण</td>
            <td className={td} colSpan={3}>एकूण कर</td>
          </tr>
          <tr style={blankH}>
            <td className={td} colSpan={2}>{fv(gruhkarAmt)}</td>
            <td className={td}>{fv(vizAmt)}</td>
            <td className={td}>{fv(aarogyaAmt)}</td>
            <td className={td}>{fv(safaiAmt)}</td>
            <td className={td} colSpan={2}>{fv(samanyaPaniAmt)}</td>
            <td className={td} colSpan={2}>{fv(visheshPaniAmt)}</td>
            <td className={td}>{fv(ekunTaxAmt)}</td>
            <td className={td}>{fv(n.ekun_kar_bharne)}</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td} colSpan={4}>&nbsp;</td>
            <td className={td} colSpan={3}>&nbsp;</td>
          </tr>
          <tr style={blankH}>
            <td className={tdb} colSpan={2}>फेरफार / शेरा</td>
            <td className={`${td} text-left`} colSpan={27}>{sv(n.magahun_ghat_kiva_badal)}</td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5 text-[11px] align-middle text-left" colSpan={18}>
              टीप : १) ह्या आकारणीचा अर्थ जागेवर मालकी हक्क नव्हे. २) हा नमुना ८ नाही.
            </td>
            <td className="border border-black px-1 text-[11px] font-bold text-center align-bottom" colSpan={11}>सचिव / सरपंच स्वाक्षरी</td>
          </tr>
        </tbody>
      </table>
      <div className="text-right text-sm mt-1">पान नंबर : {sv(n.anu_kramank)}</div>
    </div>
  );
};

const ImlaKarReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [zoom, setZoom] = useState(0.9); // SCREEN-only default zoom; does not affect print
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
    document.title = 'इमलाकर मोजमाप यादी';
    let params: { ward?: string; start?: string; end?: string; type?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('imlakarParams') || '{}');
    } catch {
      params = {};
    }
    if (params.year && !isNaN(Number(params.year))) setReportYear(Number(params.year));
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        // ward optional. Only इमलाकर properties (मिलकत प्रकार = इमलाकर).
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) {
          const all = (res.data as Row[]) || [];
          const isImla = (n: Row) => {
            const v = s(n.milkat_prakar).trim().toLowerCase();
            return v === 'imlakar' || v === 'इमलाकर';
          };
          setRecords(all.filter(isImla));
        }
      } catch (e) {
        console.error('Failed to load imlakar report', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('imlakarParams') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'imlakar', sessionKey: 'imlakarParams', params: shareParams, data: records, enabled: !isPublicReportMode() });

  return (
    <div className="ik-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .ik-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 20mm 5mm 8mm 12mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .ik-report { zoom: 0.72; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ik-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .ik-zoom { zoom: 1 !important; }
          .ik-page { page-break-after: always; }
          .ik-page:last-child { page-break-after: auto; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          /* print-only: enlarge cell text so it stays readable after the fit-to-page zoom (screen unaffected) */
          .ik-page td { font-size: 14px !important; line-height: 1.2 !important; }
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
                      window.open(`/view-dharkachi-yadi-card?orient=${o}&variant=imlakar`, '_blank');
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

      <div className="ik-wrap overflow-x-auto">
        <div className="ik-zoom space-y-10 print:space-y-0" style={{ zoom }}>
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

export default ImlaKarReport;

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import config from '../../../config';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';

/* नमुना ८ चित्रे (multiple) — one नमुना-८ + image block per property/page.
   Filters via sessionStorage 'namuna8ImagesParams' from the Namuna 8 ahval page. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : Math.round(num).toString();
};
const f2 = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : num.toFixed(2);
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

const RecordBlock = ({ n, loc, cy, qrUrl }: { n: Row; loc: { district: string; taluka: string; gramPanchayat: string }; cy: number; qrUrl?: string }) => {
  const land = (n.khula_bhukhand_kar_aakarani as Row[]) || [];
  const cons = (n.bandkamachi_kar_aakarani as Row[]) || [];
  const manora = (n.manoryache_kar_aakarani as Row[]) || [];
  const imgs = (n.images as Row[]) || [];
  const imgUrl = imgs.length > 0 && imgs[0].image_path ? `${backendBase}/${imgs[0].image_path}` : '';
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
    <div className="n8im-page mx-auto" style={{ width: `${pageW}px` }}>
      <div className="text-center">
        <p className="font-bold text-lg">नमुना ८</p>
        <p className="text-sm">
          सन {cy}-{cy + 1} ते {cy + 3}-{cy + 4} या वर्षासाठी करास पात्र असलेल्या इमारती व जमिनी (खुला भूखंड) यांची कर आकारणी नोंदवही.
        </p>
        <p className="text-sm">सदर नोंद ग्रामपंचायत नमुना ८ पान क्रमांक __{s(n.anu_kramank)}__ वरून घेण्यात आली</p>
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
          <tr>
            <td className={td}>अ.क्र</td>
            <td className={td}>{s(n.anu_kramank)}</td>
            <td className={td} colSpan={2}>मालमत्ता क्र.</td>
            <td className={td} colSpan={2}>{s(n.malmatta_number)}</td>
            <td className={td} colSpan={2}>वार्ड क्र.</td>
            <td className={td}>{s(n.ward_kramnak)}</td>
            <td className={td} colSpan={2}>प्लॉट क्र.</td>
            <td className={td}>{s(n.plot_number)}</td>
            <td className={td} colSpan={2}>खसरा न.</td>
            <td className={td}>{s(n.khasara_number)}</td>
            <td className={td} colSpan={2}>सर्वे क्र.</td>
            <td className={td}>{s(n.survey_number)}</td>
            <td className={td} colSpan={2}>पाणी व्यवस्ता</td>
            <td className={td} colSpan={2}>{s(n.pinyacha_panyachi_vyavastha)}</td>
            <td className={td} colSpan={2}>शौचालय</td>
            <td className={td}>{s(n.ghari_souychalaya)}</td>
            <td className={td} colSpan={2}>मिलकत प्रकार</td>
            <td className={td} colSpan={2}>{s(n.milkat_prakar) || '-'}</td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td className={tdb} colSpan={2}>घरमालकाचे नाव</td>
            <td className={td} colSpan={11}>{s(n.ghar_malkache_nav)}</td>
            <td className={td} colSpan={9}>आधार कार्ड / वोटर कार्ड</td>
            <td className={`${td} p-1`} colSpan={7} rowSpan={8} style={{ height: '264px' }}>
              {imgUrl ? (
                <img src={imgUrl} alt="property" style={{ width: '100%', height: '262px', objectFit: 'fill', display: 'block' }} />
              ) : (
                <div className="flex items-center justify-center text-gray-400 text-xs" style={{ height: '262px' }}>चित्र उपलब्ध नाही</div>
              )}
            </td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td className={tdb} colSpan={2}>पत्नी / मुलांचे नाव</td>
            <td className={td} colSpan={11}>{s(n.patni_mulache_nav)}</td>
            <td className={td} colSpan={9}>{s(n.aadahar_card_number)} &nbsp; {s(n.matdar_card_number)}</td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td className={tdb} colSpan={2}>भोगवटदाराचे नाव</td>
            <td className={td} colSpan={11}>{s(n.bhogavat_darache_nav)}</td>
            <td className={td} colSpan={9}>मोबाईल</td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td className={tdb} colSpan={2}>पत्ता</td>
            <td className={td} colSpan={11}>{s(n.patta_nagar_layout_society)}</td>
            <td className={td} colSpan={9}>{s(n.mobile_number)}</td>
          </tr>
          <tr style={{ height: '36px' }}>
            <td className={tdb} colSpan={2} rowSpan={2}>चतुर : सीमा</td>
            <td className={td} colSpan={5}>पूर्वेस</td>
            <td className={td} colSpan={5}>पश्चिमेस</td>
            <td className={td} colSpan={5}>उत्तरेस</td>
            <td className={td} colSpan={5}>दक्षिणेस</td>
          </tr>
          <tr style={{ height: '36px' }}>
            <td className={td} colSpan={5}>{s(n.purv) || '-'}</td>
            <td className={td} colSpan={5}>{s(n.paschim) || '-'}</td>
            <td className={td} colSpan={5}>{s(n.uttar) || '-'}</td>
            <td className={td} colSpan={5}>{s(n.dakshin) || '-'}</td>
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
            <td className={td} colSpan={3}>{s(n.lambi)}</td>
            <td className={td} colSpan={3}>{s(n.rundi)}</td>
            <td className={td} colSpan={3}>{s(n.shetrafal_choras_foot)}</td>
            <td className={td} colSpan={3}>{s(n.shetrafal_choras_meter)}</td>
            <td className={td} colSpan={4}>{s(n.urvarit_khali_jaga_choras_foot)}</td>
            <td className={td} colSpan={4}>{f2(Number(n.urvarit_khali_jaga_choras_foot || 0) * 0.092903)}</td>
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
          {land.map((it, i) => (
            <tr key={`l${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_varnan_name)}</td>
              <td className={td} colSpan={2}>{s(it.malmatteche_prakar_name)}</td>
              <td className={td} colSpan={2}>एकूण जागा</td>
              <td className={td} colSpan={2}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={2}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td} colSpan={2}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td} colSpan={2}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td} colSpan={2}>{f2(sqmOf(it))}</td>
              <td className={td}>{s(it.jaminiche_varshik_mulya)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={2}>{f(landBhandvali(it))}</td>
              <td className={td}>{s(it.aakarani_dar)}</td>
              <td className={td} colSpan={3}>{f2(landBhandvali(it) / 1000)}</td>
              <td className={td} colSpan={3}>{f(landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}
          {cons.map((it, i) => (
            <tr key={`c${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_prakar_name)}</td>
              <td className={td} colSpan={2}>{s(it.malmatteche_varnan_name)}</td>
              <td className={td} colSpan={2}>{s(it.vapar_prakar)}</td>
              <td className={td} colSpan={2}>{s(it.bandkam_majla_name)}</td>
              <td className={td}>{s(it.vayoman)}</td>
              <td className={td} colSpan={2}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td} colSpan={2}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td} colSpan={2}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td} colSpan={2}>{f2(sqmOf(it))}</td>
              <td className={td}>{s(it.imaratiche_varshik_mulya)}</td>
              <td className={td}>{s(it.ghasara_dar)}</td>
              <td className={td}>{s(it.bharank)}</td>
              <td className={td} colSpan={2}>{f(consBhandvali(it))}</td>
              <td className={td}>{s(it.aakarani_dar)}</td>
              <td className={td} colSpan={3}>{f2(consBhandvali(it) / 1000)}</td>
              <td className={td} colSpan={3}>{f(consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}
          {manora.map((it, i) => (
            <tr key={`m${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_varnan_name)}</td>
              <td className={td} colSpan={2}>{s(it.malmatteche_prakar_name)}</td>
              <td className={td} colSpan={2}>{s(it.vapar_prakar)}</td>
              <td className={td} colSpan={2}>{s(it.manoryache_bhag_name)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={2}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td} colSpan={2}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td} colSpan={2}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td} colSpan={2}>{f2(sqmOf(it))}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={2}>&nbsp;</td>
              <td className={td}>{s(it.aakarani_dar)}</td>
              <td className={td} colSpan={3}>&nbsp;</td>
              <td className={td} colSpan={3}>{f(manoraKar(it))}</td>
            </tr>
          ))}

          <tr className="font-bold bg-gray-100">
            <td className={td} colSpan={11}>कराची रक्क्म</td>
            <td className={td} colSpan={11}>अपिलाचे निकाल आणि त्यानंतर केलेले फेरफार (रुपये)</td>
            <td className={td} colSpan={4}>गृह व भूमीकर</td>
            <td className={td} colSpan={3}>{f(gruhkarAmt)}</td>
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
          <tr>
            <td className={td} colSpan={2}>{f(gruhkarAmt)}</td>
            <td className={td}>{f(vizAmt)}</td>
            <td className={td}>{f(aarogyaAmt)}</td>
            <td className={td}>{f(safaiAmt)}</td>
            <td className={td} colSpan={2}>{f(samanyaPaniAmt)}</td>
            <td className={td} colSpan={2}>{f(visheshPaniAmt)}</td>
            <td className={td}>{f(ekunTaxAmt)}</td>
            <td className={td}>{f(n.ekun_kar_bharne)}</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td} colSpan={4}>&nbsp;</td>
            <td className={td} colSpan={3}>&nbsp;</td>
          </tr>
          <tr>
            <td className={tdb} colSpan={2}>फेरफार / शेरा</td>
            <td className={`${td} text-left`} colSpan={27}>{s(n.magahun_ghat_kiva_badal)}</td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5 text-[10px] align-top text-left leading-tight" colSpan={18}>
              <span className="font-bold">टीप :-</span> १) मोक्यावर असलेल्या बांधकामनुसार कराची आकारणी करण्यात आली आहे. २) मालकी हक्का बाबाद कसलाही वाद. असल्यास किंव्हा भविष्यात उदभवल्यास तो न्यायालया मार्फत सोडवावा. ३) न्यायालयाचा निर्णय अर्जदारास व ग्रामपंचायतीला बंधनकारक राहील. ४) नामांतरण हे फक्त भोगवटदारावर कर वसुलीच्या द्रूष्टीने मंजूर करण्यात येत आहे. ५) ग्रामपंचायत कर आकारणी नमुना ८ वर नाव दर्ज झाले आहे म्हणजे घराबाबत मालकीहक्क प्राप्त होत नही. १) पक्के बांधकाम (आर.सी.सी) :- वीटा सीमेंट पक्के स्ल्याब आतुन बाहेरून रंगविलेले, टाईल्स फ्लोरिंग २) इतर पक्के बांधकाम :- लोडबेरिंग, स्ल्याब, कच्चे सिमेंट फ्लोरिंग, विटाची भिंत ३) अर्ध पक्के बांधकाम :- टीनपत्रे, सिमेंटशीट, विटाची भिंत. ४) कच्चे बांधकाम :- दगडाच्या मातीच्या भिंती, कौलारू, गवती छाप्पर.
            </td>
            <td className="border border-black px-1 text-[11px] font-bold text-center align-bottom" colSpan={11}>सचिव / सरपंच स्वाक्षरी</td>
          </tr>
        </tbody>
      </table>
      <div className="text-right text-sm mt-1">पान नंबर : {s(n.anu_kramank)}</div>
    </div>
  );
};

const Namuna8ImagesMultiReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [zoom, setZoom] = useState(0.9); // SCREEN-only default zoom (90%); does not affect print
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
    document.title = 'नमुना ८ चित्रे';
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('namuna8ImagesParams') || '{}');
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
        console.error('Failed to load namuna-8-images multi', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('namuna8ImagesParams') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'namuna8-images', sessionKey: 'namuna8ImagesParams', params: shareParams, data: records, enabled: !isPublicReportMode() });

  return (
    <div className="n8im-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .n8im-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 22mm 4mm 8mm 14mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .n8im-report { zoom: 0.7; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .n8im-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n8im-zoom { zoom: 1 !important; }
          .n8im-page { page-break-after: always; }
          .n8im-page:last-child { page-break-after: auto; }
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
      </div>

      <div className="n8im-wrap overflow-x-auto">
        <div className="n8im-zoom space-y-10 print:space-y-0" style={{ zoom }}>
          {records.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              {loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}
            </p>
          ) : (
            records.map((n, i) => <RecordBlock key={i} n={n} loc={loc} cy={reportYear} qrUrl={qrUrl} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Namuna8ImagesMultiReport;

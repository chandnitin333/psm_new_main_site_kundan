import { useEffect, useState } from 'react';
import { nodniService } from '../../../services';

/* Namuna 8 (नमुना ८) — tax assessment register print view.
   Opened in a new tab from the Print modal: /namuna-8-1?id=<nodni_id>.
   Data is fetched from the full nodni record (main + land/construction/manora rows). */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
// Format numeric amounts/areas to 2 decimal places (e.g. 1332.25); blank stays blank
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : num.toFixed(2);
};

const Namuna8Print = () => {
  const [n, setN] = useState<Row>({});
  const [land, setLand] = useState<Row[]>([]);
  const [construction, setConstruction] = useState<Row[]>([]);
  const [manora, setManora] = useState<Row[]>([]);
  const [zoom, setZoom] = useState(1); // SCREEN-only zoom (does not affect print)
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
    document.title = 'नमुना ८';
    const id = Number(new URLSearchParams(window.location.search).get('id'));
    if (!id) return;
    (async () => {
      try {
        const res = await nodniService.getById(id);
        if (res.success && res.data) {
          const d = res.data as Row;
          setN(d);
          setLand((d.khula_bhukhand_kar_aakarani as Row[]) || []);
          setConstruction((d.bandkamachi_kar_aakarani as Row[]) || []);
          setManora((d.manoryache_kar_aakarani as Row[]) || []);
        }
      } catch (e) {
        console.error('Failed to load namuna-8 data', e);
      }
    })();
  }, []);

  const td = 'border border-black px-1 py-0.5 text-[11px] align-middle text-center';
  const tdc = td;
  // Shared fixed column widths (px) for the taxation (2) and tax-amount (3) tables.
  // Wide enough so header labels fit on ONE line at full font; both tables use the SAME
  // widths so their columns (incl. the last one) stay vertically aligned.
  // col5 = बांधकामाचा मजला (wider for big values); last 2 = कर आकारणी (a bit narrower)
  const colW = [60, 60, 95, 80, 115, 50, 80, 80, 80, 80, 75, 50, 50, 80, 70, 130, 45, 45];
  const tableW = colW.reduce((a, b) => a + b, 0);
  // 3rd (tax-amount) table: wider, more-uniform columns so labels like "सफाई कर" fit one line.
  // First 16 cols sum = colW's first 16 (1235) and last 2 = 45+45, so ONLY the last column
  // aligns with the taxation table.
  const colW3 = [77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 80, 45, 45];
  // 1st (property) table: widths tuned so the first row's label/value pairs fit one line.
  // Same total (1325) so the table width still matches the other two.
  const colW1 = [60, 60, 90, 75, 70, 60, 70, 60, 65, 65, 70, 65, 110, 75, 65, 75, 110, 80];

  // Individual tax-head amounts come from nodni_other_tax_calculation (tax_id -> amount).
  // tax_id: 1=वीज/दिवाबत्ती, 2=आरोग्य, 3=सफाई, 4=सामान्य पाणी, 5=विशेष पाणी, 6=इतर
  // All areas use the CORRECT sq-ft -> sq-m conversion (1 sq ft = 0.092903 sq m, i.e. ÷10.764).
  // (The stored ekun_shetrafal_choras_meter is wrong from data entry, so we recompute it.)
  const sqmOf = (it: Row) => Number(it.ekun_shetrafal_choras_foot || 0) * 0.092903;

  // Old-app formulas (verified from nodni-form components):
  //  खुला भूखंड (land):  भांडवली = चौ.मी. × वार्षिक मूल्य ;            कर = भांडवली × दर ÷ 1000
  //  बांधकाम (building): भांडवली = घसारा × चौ.मी. × भारांक × वार्षिक ; कर = भांडवली × दर ÷ 1000
  //  मनोरा (manora):     कर = क्षेत्रफळ(चौ.फूट) × दर × मजला
  const landBhandvali = (it: Row) => sqmOf(it) * Number(it.jaminiche_varshik_mulya || 0);
  // बांधकाम — matches the NEW nodni form (BandkamModal): भांडवली = चौ.मी. × वार्षिक मूल्य × भारांक (no घसारा)
  const consBhandvali = (it: Row) =>
    sqmOf(it) * Number(it.imaratiche_varshik_mulya || 0) * Number(it.bharank || 0);

  const otherTax = (n.other_tax_calculation as Row[]) || [];
  const taxAmt = (id: number) => {
    const r = otherTax.find((t) => Number(t.tax_id) === id);
    return r && r.tax_rate != null ? Number(r.tax_rate) : 0;
  };
  const vizAmt = taxAmt(1);
  const aarogyaAmt = taxAmt(2);
  const safaiAmt = taxAmt(3);
  const samanyaPaniAmt = taxAmt(4);
  const visheshPaniAmt = taxAmt(5);
  const itarAmt = taxAmt(6);
  const gruhkarAmt = Number(n.gruhkar_v_bhumikar || 0);
  // एकूण = sum of tax_id 1..6 (वीज + आरोग्य + सफाई + सामान्य पाणी + विशेष पाणी + इतर)
  const ekunTaxAmt = vizAmt + aarogyaAmt + safaiAmt + samanyaPaniAmt + visheshPaniAmt + itarAmt;

  return (
    <div className="namuna8-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .namuna8-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 6mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .namuna8-report { zoom: 0.75; padding: 0 !important; min-height: 0; }   /* shrink wide tables to fit the page */
          /* center the fixed-width tables/header/footer so left & right gaps are equal */
          .n8-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n8-zoom { zoom: 1 !important; }   /* ignore screen zoom while printing */
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
      </div>

      {/* Whole report is a fixed-width "page": centered on wide screens, scrolls on narrow. */}
      <div className="n8-wrap overflow-x-auto">
      <div className="n8-zoom mx-auto" style={{ width: `${tableW}px`, zoom }}>
      <div className="text-center">
        <p className="font-bold text-lg">नमुना ८</p>
        <p className="text-sm">
          सन {cy}-{cy + 1} ते {cy + 2}-{cy + 3} या वर्षासाठी करास पात्र असलेल्या इमारती व जमिनी (खुला भूखंड) यांची कर आकारणी नोंदवही.
        </p>
        <p className="text-sm">
          सदर नोंद ग्रामपंचायत नमुना ८ पान क्रमांक __{s(n.anu_kramank)}__ वरून घेण्यात आली
        </p>
      </div>
      <div className="flex justify-between text-sm mt-1 mb-0.5">
        <span>जिल्हा :- {loc.district}</span>
        <span>तालुका :- {loc.taluka}</span>
        <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
      </div>
      {/* ===== Property details table (1) ===== */}
      <table className="table-fixed border-collapse mb-2" style={{ width: `${tableW}px` }}>
        <colgroup>{colW1.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
        <tbody>
          {/* ===== Property details ===== */}
          <tr>
            <td className={td}>अ.क्र</td><td className={tdc}>{s(n.anu_kramank)}</td>
            <td className={td}>मालमत्ता क्र.</td><td className={tdc}>{s(n.malmatta_number)}</td>
            <td className={td}>वार्ड क्र.</td><td className={tdc}>{s(n.ward_kramnak)}</td>
            <td className={td}>प्लॉट क्र.</td><td className={tdc}>{s(n.plot_number)}</td>
            <td className={td}>खसरा न.</td><td className={tdc}>{s(n.khasara_number)}</td>
            <td className={td}>सर्वे क्र.</td><td className={tdc}>{s(n.survey_number)}</td>
            <td className={td}>पाणी व्यवस्ता</td><td className={tdc}>{s(n.pinyacha_panyachi_vyavastha)}</td>
            <td className={td}>शौचालय</td><td className={tdc}>{s(n.ghari_souychalaya)}</td>
            <td className={td}>मिलकत प्रकार</td><td className={tdc}>{s(n.milkat_prakar)}</td>
          </tr>
          <tr>
            <td className={`${td} font-bold`} colSpan={2}>घरमालकाचे नाव</td>
            <td className={tdc} colSpan={7}>{s(n.ghar_malkache_nav)}</td>
            <td className={td} rowSpan={4}>चतुर : सीमा</td>
            <td className={tdc} colSpan={2}>पूर्वेस</td>
            <td className={tdc} colSpan={6}>{s(n.purv)}</td>
          </tr>
          <tr>
            <td className={`${td} font-bold`} colSpan={2}>पत्नी / मुलांचे नाव</td>
            <td className={tdc} colSpan={7}>{s(n.patni_mulache_nav)}</td>
            <td className={tdc} colSpan={2}>पश्चिमेस</td>
            <td className={tdc} colSpan={6}>{s(n.paschim)}</td>
          </tr>
          <tr>
            <td className={`${td} font-bold`} colSpan={2}>भोगवटदाराचे नाव</td>
            <td className={tdc} colSpan={7}>{s(n.bhogavat_darache_nav)}</td>
            <td className={tdc} colSpan={2}>उत्तरेस</td>
            <td className={tdc} colSpan={6}>{s(n.uttar)}</td>
          </tr>
          <tr>
            <td className={`${td} font-bold`} colSpan={2}>पत्ता</td>
            <td className={tdc} colSpan={7}>{s(n.patta_nagar_layout_society)}</td>
            <td className={tdc} colSpan={2}>दक्षिणेस</td>
            <td className={tdc} colSpan={6}>{s(n.dakshin)}</td>
          </tr>
          <tr>
            <td className={`${td} font-bold`} colSpan={2} rowSpan={2}>एकूण जागेचे क्षेत्रफळ</td>
            <td className={tdc}>लांबी</td><td className={tdc}>रुंदी</td>
            <td className={tdc} colSpan={2}>क्षेत्रफळ (चौ.फु.)</td>
            <td className={tdc} colSpan={2}>क्षेत्रफळ (चौ.मी.)</td>
            <td className={tdc} colSpan={2}>उर्वरित जागा (चौ.फु.)</td>
            <td className={tdc} colSpan={2}>मोबाईल</td>
            <td className={tdc} colSpan={3}>आधार कार्ड</td>
            <td className={tdc} colSpan={3}>वोटर कार्ड</td>
          </tr>
          <tr>
            <td className={tdc}>{s(n.lambi)}</td><td className={tdc}>{s(n.rundi)}</td>
            <td className={tdc} colSpan={2}>{s(n.shetrafal_choras_foot)}</td>
            <td className={tdc} colSpan={2}>{s(n.shetrafal_choras_meter)}</td>
            <td className={tdc} colSpan={2}>{s(n.urvarit_khali_jaga_choras_foot)}</td>
            <td className={tdc} colSpan={2}>{s(n.mobile_number)}</td>
            <td className={tdc} colSpan={3}>{s(n.aadahar_card_number)}</td>
            <td className={tdc} colSpan={3}>{s(n.matdar_card_number)}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== Taxation table (2) — aligned 18-col grid ===== */}
      <table className="table-fixed border-collapse mb-2" style={{ width: `${tableW}px` }}>
        <colgroup>{colW.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
        <tbody>
          <tr className="font-bold bg-gray-100">
            <td className={tdc} colSpan={2}>मालमत्तेचे वर्णन</td>
            <td className={tdc}>मालमत्तेचा प्रकार</td>
            <td className={tdc}>वापराचा प्रकार</td>
            <td className={tdc}>बांधकामाचा मजला</td>
            <td className={tdc}>वय / वर्ष</td>
            <td className={tdc}>क्षेत्रफळ पु.प.</td>
            <td className={tdc}>क्षेत्रफळ उ.द.</td>
            <td className={tdc}>एकूण (चौ.फूट)</td>
            <td className={tdc}>एकूण (चौ.मी.)</td>
            <td className={tdc}>वार्षिक मूल्य</td>
            <td className={tdc}>घसारा</td>
            <td className={tdc}>भारांक</td>
            <td className={tdc}>भांडवली मूल्य</td>
            <td className={tdc}>आकारणी दर</td>
            <td className={tdc}>प्रति रु.१००० च्या भांडवली</td>
            <td className={tdc} colSpan={2}>कर आकारणी</td>
          </tr>
          {/* Land (खुला भूखंड) */}
          {land.map((it, i) => (
            <tr key={`l${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_prakar_name)}</td>
              <td className={tdc}>{s(it.malmatteche_varnan_name)}</td>
              <td className={tdc}>एकूण जागा</td>
              <td className={tdc}></td>
              <td className={tdc}></td>
              <td className={tdc}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={tdc}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={tdc}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={tdc}>{f(Number(it.ekun_shetrafal_choras_foot || 0) * 0.092903)}</td>
              <td className={tdc}>{s(it.jaminiche_varshik_mulya)}</td>
              <td className={tdc}></td>
              <td className={tdc}></td>
              <td className={tdc}>{f(landBhandvali(it))}</td>
              <td className={tdc}>{s(it.aakarani_dar)}</td>
              <td className={tdc}>{f(landBhandvali(it) / 1000)}</td>
              <td className={tdc} colSpan={2}>{f(landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}
          {/* Construction (बांधकाम) */}
          {construction.map((it, i) => (
            <tr key={`c${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_prakar_name)}</td>
              <td className={tdc}>{s(it.malmatteche_varnan_name)}</td>
              <td className={tdc}>{s(it.vapar_prakar)}</td>
              <td className={tdc}>{s(it.bandkam_majla_name)}</td>
              <td className={tdc}>{s(it.vayoman)}</td>
              <td className={tdc}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={tdc}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={tdc}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={tdc}>{f(Number(it.ekun_shetrafal_choras_foot || 0) * 0.092903)}</td>
              <td className={tdc}>{s(it.imaratiche_varshik_mulya)}</td>
              <td className={tdc}>{s(it.ghasara_dar)}</td>
              <td className={tdc}>{s(it.bharank)}</td>
              <td className={tdc}>{f(consBhandvali(it))}</td>
              <td className={tdc}>{s(it.aakarani_dar)}</td>
              <td className={tdc}>{f(consBhandvali(it) / 1000)}</td>
              <td className={tdc} colSpan={2}>{f(consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}
          {/* Manora (मनोरा) */}
          {manora.map((it, i) => (
            <tr key={`m${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_varnan_name)}</td>
              <td className={tdc}>{s(it.malmatteche_prakar_name)}</td>
              <td className={tdc}>{s(it.vapar_prakar)}</td>
              <td className={tdc}>{s(it.manoryache_bhag_name)}</td>
              <td className={tdc}></td>
              <td className={tdc}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={tdc}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={tdc}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={tdc}>{f(Number(it.ekun_shetrafal_choras_foot || 0) * 0.092903)}</td>
              <td className={tdc}></td>
              <td className={tdc}></td>
              <td className={tdc}></td>
              <td className={tdc}></td>
              <td className={tdc}>{s(it.aakarani_dar)}</td>
              <td className={tdc}></td>
              <td className={tdc} colSpan={2}>{f(Number(it.ekun_shetrafal_choras_foot || 0) * Number(it.aakarani_dar || 0) * (Number(it.majla) || 1))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== Tax amount table (3) — own widths; only last column matches taxation table ===== */}
      <table className="table-fixed border-collapse" style={{ width: `${tableW}px` }}>
        <colgroup>{colW3.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
        <tbody>
          <tr className="font-bold bg-gray-100">
            <td className={tdc} colSpan={8}>कराची रक्क्म</td>
            <td className={tdc} colSpan={6}>अपिलाचे निकाल आणि त्यानंतर केलेले फेरफार (रुपये)</td>
            <td className={tdc} colSpan={2}>गृह व भूमीकर</td>
            <td className={tdc} colSpan={2}>{f(gruhkarAmt)}</td>
          </tr>
          <tr className="font-bold bg-gray-100">
            <td className={tdc} colSpan={2}>गृह व भूमीकर</td>
            <td className={tdc}>वीज</td>
            <td className={tdc}>आरोग्य</td>
            <td className={tdc}>सफाई</td>
            <td className={tdc}>सा.पाणी</td>
            <td className={tdc}>वि.पाणी</td>
            <td className={tdc}>एकूण</td>
            <td className={tdc}>एकूण कर</td>
            <td className={tdc}>गृह व भूमीकर</td>
            <td className={tdc}>वीज कर</td>
            <td className={tdc}>आरोग्य</td>
            <td className={tdc}>सफाई कर</td>
            <td className={tdc}>सा.पाणी</td>
            <td className={tdc}>वि.पाणी</td>
            <td className={tdc}>एकूण</td>
            <td className={tdc} colSpan={2}>एकूण कर</td>
          </tr>
          <tr>
            <td className={tdc} colSpan={2}>{f(gruhkarAmt)}</td>
            <td className={tdc}>{f(vizAmt)}</td>
            <td className={tdc}>{f(aarogyaAmt)}</td>
            <td className={tdc}>{f(safaiAmt)}</td>
            <td className={tdc}>{f(samanyaPaniAmt)}</td>
            <td className={tdc}>{f(visheshPaniAmt)}</td>
            <td className={tdc}>{f(ekunTaxAmt)}</td>
            <td className={tdc}>{f(n.ekun_kar_bharne)}</td>
            <td className={tdc}></td>
            <td className={tdc}></td>
            <td className={tdc}></td>
            <td className={tdc}></td>
            <td className={tdc}></td>
            <td className={tdc}></td>
            <td className={tdc}></td>
            <td className={tdc} colSpan={2}></td>
          </tr>
          <tr>
            <td className={`${td} font-bold`} colSpan={2}>फेरफार / शेरा</td>
            <td className={`${td} text-left`} colSpan={12}>{s(n.magahun_ghat_kiva_badal)}</td>
            <td className="border border-black px-1 py-1 text-[11px] font-bold text-center align-bottom" colSpan={4} rowSpan={2}>
              सचिव / सरपंच स्वाक्षरी
            </td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5 text-[10px] align-top text-left leading-tight" colSpan={14}>
              <span className="font-bold">टीप :-</span> १) मोक्यावर असलेल्या बांधकामनुसार कराची आकारणी करण्यात आली आहे. २) मालकी हक्का बाबाद कसलाही वाद. असल्यास
              किंव्हा भविष्यात उदभवल्यास तो न्यायालया मार्फत सोडवावा. ३) न्यायालयाचा निर्णय अर्जदारास व ग्रामपंचायतीला बंधनकारक राहील.
              ४) नामांतरण हे फक्त भोगवटदारावर कर वसुलीच्या द्रूष्टीने मंजूर करण्यात येत आहे. ५) ग्रामपंचायत कर आकारणी नमुना ८ वर नाव दर्ज
              झाले आहे म्हणजे घराबाबत मालकीहक्क प्राप्त होत नही. १) पक्के बांधकाम (आर.सी.सी) :- वीटा सीमेंट पक्के स्ल्याब आतुन बाहेरून
              रंगविलेले, टाईल्स फ्लोरिंग २) इतर पक्के बांधकाम :- लोडबेरिंग, स्ल्याब, कच्चे सिमेंट फ्लोरिंग, विटाची भिंत ३) अर्ध पक्के बांधकाम :-
              टीनपत्रे, सिमेंटशीट, विटाची भिंत. ४) कच्चे बांधकाम :- दगडाच्या मातीच्या भिंती, कौलारू, गवती छाप्पर.
            </td>
          </tr>
        </tbody>
      </table>
      <div className="text-right text-sm">पान नंबर : {s(n.anu_kramank)}</div>
      </div>
      </div>
    </div>
  );
};

export default Namuna8Print;

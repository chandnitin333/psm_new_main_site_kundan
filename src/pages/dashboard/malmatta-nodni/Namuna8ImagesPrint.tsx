import { useEffect, useState } from 'react';
import { nodniService } from '../../../services';
import config from '../../../config';

/* नमुना ८ चित्रे (Namuna 8 with image) — exact old `get-namuna-8-images` layout.
   Opened from the Print modal: /namuna-8-images-1?id=<nodni_id>. Same full nodni record + property image. */

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

const Namuna8ImagesPrint = () => {
  const [n, setN] = useState<Row>({});
  const [land, setLand] = useState<Row[]>([]);
  const [cons, setCons] = useState<Row[]>([]);
  const [manora, setManora] = useState<Row[]>([]);
  const [imgUrl, setImgUrl] = useState('');
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
    document.title = 'नमुना ८ चित्रे';
    const id = Number(new URLSearchParams(window.location.search).get('id'));
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
          const imgs = (d.images as Row[]) || [];
          if (imgs.length > 0 && imgs[0].image_path) {
            const backendBase = config.api.baseUrl.replace(/\/api$/, '');
            setImgUrl(`${backendBase}/${imgs[0].image_path}`);
          }
        }
      } catch (e) {
        console.error('Failed to load namuna-8-images data', e);
      }
    })();
  }, []);

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
  const itarAmt = taxAmt(6);
  const ekunTaxAmt = vizAmt + aarogyaAmt + safaiAmt + samanyaPaniAmt + visheshPaniAmt + itarAmt;

  const td = 'border border-black px-1 py-0.5 text-[11px] align-middle text-center';
  const tdb = `${td} font-bold`;

  // Fixed 29-column grid on a fixed-width page → deterministic, centered, no right-side overflow.
  const COLS = 29;
  const pageW = 1450;

  // Fit to window width on load so no horizontal scroll appears (cap at 100%); print unaffected.
  useEffect(() => {
    const avail = window.innerWidth - 48;
    setZoom(+Math.min(1, avail / pageW).toFixed(2));
  }, [pageW]);

  return (
    <div className="namuna8i-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .namuna8i-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 24mm 4mm 8mm 16mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .namuna8i-report { zoom: 0.7; padding: 0 !important; min-height: 0; }
          .n8i-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n8i-zoom { zoom: 1 !important; }
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

      <div className="n8i-wrap overflow-x-auto">
      <div className="n8i-zoom mx-auto" style={{ width: `${pageW}px`, zoom }}>
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
          <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
        </div>

        <table className="table-fixed w-full border-collapse">
          <colgroup>{Array.from({ length: COLS }).map((_, i) => <col key={i} style={{ width: `${pageW / COLS}px` }} />)}</colgroup>
          <tbody>
            {/* ===== Property details + image ===== */}
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
                  <div className="flex items-center justify-center text-gray-400 text-xs" style={{ height: '262px' }}>
                    चित्र उपलब्ध नाही
                  </div>
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

            {/* ===== Taxation header ===== */}
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
            {/* Land */}
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
            {/* Construction */}
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
            {/* Manora */}
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

            {/* ===== Tax amount ===== */}
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
      </div>
    </div>
  );
};

export default Namuna8ImagesPrint;

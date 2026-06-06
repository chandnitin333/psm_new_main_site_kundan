import { useEffect, useState } from 'react';
import { nodniService } from '../../../services';

/* इमलाकर मोजमाप यादी (मालमत्ता धारकाची यादी) — exact old `malmatta-darkahchi-yadi-list` layout.
   One नमुना-८ block per property (one per printed page). Filters via sessionStorage 'imlakarParams'. */

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

const td = 'border border-black px-1 py-1 text-[11px] align-middle text-center';
const tdb = `${td} font-bold`;

const RecordBlock = ({ n, loc, cy }: { n: Row; loc: { district: string; taluka: string; gramPanchayat: string }; cy: number }) => {
  const land = (n.khula_bhukhand_kar_aakarani as Row[]) || [];
  const cons = (n.bandkamachi_kar_aakarani as Row[]) || [];
  const manora = (n.manoryache_kar_aakarani as Row[]) || [];
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
    <div className="ik-page mx-auto" style={{ maxWidth: '1300px' }}>
      <div className="text-center">
        <p className="font-bold text-lg">इमलाकर मोजमाप यादी</p>
        <p className="text-sm">
          सन {cy}-{cy + 1} ते {cy + 3}-{cy + 4} या वर्षासाठी करास पात्र असलेल्या इमारती व जमिनी (खुला भूखंड) यांची कर आकारणी नोंदवही.
        </p>
      </div>
      <div className="text-right text-sm font-bold mt-1">सदर नोंद ग्रामपंचायत नमुना ८ पान क्रमांक __{s(n.anu_kramank)}__ वरून घेण्यात आली</div>
      <div className="flex justify-between text-sm mt-1 mb-1">
        <span>जिल्हा :- {loc.district}</span>
        <span>तालुका :- {loc.taluka}</span>
        <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
      </div>

      <table className="w-full border-collapse">
        <tbody>
          {/* Basic Info */}
          <tr>
            <td className={td}>अ.क्र</td>
            <td className={td}>{s(n.anu_kramank)}</td>
            <td className={td}>मालमत्ता क्र.</td>
            <td className={td}>{s(n.malmatta_number)}</td>
            <td className={td}>वार्ड क्र.</td>
            <td className={td}>{s(n.ward_kramnak)}</td>
            <td className={td}>प्लॉट क्र.</td>
            <td className={td}>{s(n.plot_number)}</td>
            <td className={td}>खसरा न.</td>
            <td className={td}>{s(n.khasara_number)}</td>
            <td className={td}>सर्वे क्र.</td>
            <td className={td}>{s(n.survey_number)}</td>
            <td className={td}>पाणी व्यवस्ता</td>
            <td className={td}>{s(n.pinyacha_panyachi_vyavastha)}</td>
            <td className={td}>शौचालय</td>
            <td className={td}>{s(n.ghari_souychalaya)}</td>
            <td className={td}>मिलकत प्रकार</td>
            <td className={td}>{s(n.milkat_prakar)}</td>
          </tr>

          {/* Owner Info + chatur seema */}
          <tr>
            <td className={tdb} colSpan={2}>घरमालकाचे नाव</td>
            <td className={td} colSpan={7}>{s(n.ghar_malkache_nav)}</td>
            <td className={td} rowSpan={4}>चतुर : सीमा</td>
            <td className={td} colSpan={2}>पूर्वेस</td>
            <td className={td} colSpan={10}>{s(n.purv)}</td>
          </tr>
          <tr>
            <td className={tdb} colSpan={2}>पत्नी / मुलांचे नाव</td>
            <td className={td} colSpan={7}>{s(n.patni_mulache_nav)}</td>
            <td className={td} colSpan={2}>पश्चिमेस</td>
            <td className={td} colSpan={10}>{s(n.paschim)}</td>
          </tr>
          <tr>
            <td className={tdb} colSpan={2}>भोगवटदाराचे नाव</td>
            <td className={td} colSpan={7}>{s(n.bhogavat_darache_nav)}</td>
            <td className={td} colSpan={2}>उत्तरेस</td>
            <td className={td} colSpan={10}>{s(n.uttar)}</td>
          </tr>
          <tr>
            <td className={tdb} colSpan={2}>पत्ता</td>
            <td className={td} colSpan={7}>{s(n.patta_nagar_layout_society)}</td>
            <td className={td} colSpan={2}>दक्षिणेस</td>
            <td className={td} colSpan={10}>{s(n.dakshin)}</td>
          </tr>

          {/* Area and Contact Info */}
          <tr>
            <td className={tdb} rowSpan={2} colSpan={2}>एकूण जागेचे क्षेत्रफळ</td>
            <td className={td}>लांबी (चौ. फु .)</td>
            <td className={td}>रुंदी (चौ. फु .)</td>
            <td className={td} colSpan={2}>क्षेत्रफळ(चौ. फु .)</td>
            <td className={td} colSpan={2}>मीटर(चौ. मीटर)</td>
            <td className={td} colSpan={2}>उर्वरित(चौ. फु .)</td>
            <td className={td} colSpan={2}>उर्वरित मीटर(चौ. मीटर )</td>
            <td className={td} colSpan={2}>मोबाईल</td>
            <td className={td} colSpan={3}>आधार</td>
            <td className={td} colSpan={3}>वोटर</td>
          </tr>
          <tr>
            <td className={td}>{s(n.lambi)}</td>
            <td className={td}>{s(n.rundi)}</td>
            <td className={td} colSpan={2}>{s(n.shetrafal_choras_foot)}</td>
            <td className={td} colSpan={2}>{s(n.shetrafal_choras_meter)}</td>
            <td className={td} colSpan={2}>{s(n.urvarit_khali_jaga_choras_foot)}</td>
            <td className={td} colSpan={2}>{f2(Number(n.urvarit_khali_jaga_choras_foot || 0) * 0.092903)}</td>
            <td className={td} colSpan={2}>{s(n.mobile_number)}</td>
            <td className={td} colSpan={3}>{s(n.aadahar_card_number)}</td>
            <td className={td} colSpan={4}>{s(n.matdar_card_number)}</td>
          </tr>

          {/* Description Heading */}
          <tr className="font-bold bg-gray-100">
            <td className={td} colSpan={2}>मालमत्तेचे वर्णन</td>
            <td className={td}>मालमत्तेचा प्रकार</td>
            <td className={td}>वापराचा प्रकार</td>
            <td className={td}>मजला</td>
            <td className={td}>वय</td>
            <td className={td}>क्षेत्रफळ पु.प.</td>
            <td className={td}>क्षेत्रफळ उ.द.</td>
            <td className={td}>एकूण क्षेत्रफळ</td>
            <td className={td}>मीटर</td>
            <td className={td}>वार्षिक मूल्य</td>
            <td className={td}>घसारा</td>
            <td className={td}>भारांक</td>
            <td className={td}>भांडवली मूल्य</td>
            <td className={td}>आकारणी दर</td>
            <td className={td}>प्रति रु.१०००</td>
            <td className={td} colSpan={4}>कर आकारणी</td>
          </tr>

          {/* Land (taxationLandRS4) */}
          {land.map((it, i) => (
            <tr key={`l${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_varnan_name)}</td>
              <td className={td}>{s(it.malmatteche_prakar_name)}</td>
              <td className={td}>एकूण जागा</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td}>{f2(sqmOf(it))}</td>
              <td className={td}>{s(it.jaminiche_varshik_mulya)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>{f(landBhandvali(it))}</td>
              <td className={td}>{s(it.aakarani_dar)}</td>
              <td className={td}>{f2(landBhandvali(it) / 1000)}</td>
              <td className={td} colSpan={4}>{f(landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}

          {/* Construction (constructionTaxRS5) */}
          {cons.map((it, i) => (
            <tr key={`c${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_prakar_name)}</td>
              <td className={td}>{s(it.malmatteche_varnan_name)}</td>
              <td className={td}>{s(it.vapar_prakar)}</td>
              <td className={td}>{s(it.bandkam_majla_name)}</td>
              <td className={td}>{s(it.vayoman)}</td>
              <td className={td}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td}>{f2(sqmOf(it))}</td>
              <td className={td}>{s(it.imaratiche_varshik_mulya)}</td>
              <td className={td}>{s(it.ghasara_dar)}</td>
              <td className={td}>{s(it.bharank)}</td>
              <td className={td}>{f(consBhandvali(it))}</td>
              <td className={td}>{s(it.aakarani_dar)}</td>
              <td className={td}>{f2(consBhandvali(it) / 1000)}</td>
              <td className={td} colSpan={4}>{f(consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}

          {/* Manora (taxPayerRS6) */}
          {manora.map((it, i) => (
            <tr key={`m${i}`}>
              <td className={td} colSpan={2}>{s(it.malmatteche_varnan_name)}</td>
              <td className={td}>{s(it.malmatteche_prakar_name)}</td>
              <td className={td}>{s(it.vapar_prakar)}</td>
              <td className={td}>{s(it.manoryache_bhag_name)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>{s(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td}>{s(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td}>{s(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td}>{f2(sqmOf(it))}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>{s(it.aakarani_dar)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={4}>{f(manoraKar(it))}</td>
            </tr>
          ))}

          {/* Final Summary */}
          <tr className="font-bold bg-gray-100">
            <td className={td} colSpan={8}>कराची रक्क्म</td>
            <td className={td} colSpan={6}>अपिलाचे निकाल आणि त्यानंतर केलेले फेरफार (रुपये)</td>
            <td className={td} colSpan={2}>गृह व भूमीकर</td>
            <td className={td} colSpan={4}>{f(gruhkarAmt)}</td>
          </tr>
          <tr className="font-bold bg-gray-100">
            <td className={td} colSpan={2}>गृह व भूमीकर</td>
            <td className={td}>वीज</td>
            <td className={td}>आरोग्य</td>
            <td className={td}>सफाई</td>
            <td className={td}>सा. पाणी</td>
            <td className={td}>वि. पाणी</td>
            <td className={td}>एकूण</td>
            <td className={td}>एकूण कर</td>
            <td className={td} colSpan={2}>गृह व भूमीकर</td>
            <td className={td}>वीज कर</td>
            <td className={td}>आरोग्य</td>
            <td className={td}>सफाई कर</td>
            <td className={td}>सा. पाणी</td>
            <td className={td}>वि. पाणी</td>
            <td className={td}>एकूण</td>
            <td className={td} colSpan={4}>एकूण कर</td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>{f(gruhkarAmt)}</td>
            <td className={td}>{f(vizAmt)}</td>
            <td className={td}>{f(aarogyaAmt)}</td>
            <td className={td}>{f(safaiAmt)}</td>
            <td className={td}>{f(samanyaPaniAmt)}</td>
            <td className={td}>{f(visheshPaniAmt)}</td>
            <td className={td}>{f(ekunTaxAmt)}</td>
            <td className={td}>{f(n.ekun_kar_bharne)}</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td} colSpan={4}>&nbsp;</td>
          </tr>
          <tr>
            <td className={tdb} colSpan={2}>फेरफार / शेरा</td>
            <td className={`${td} text-left`} colSpan={14}>{s(n.magahun_ghat_kiva_badal)}</td>
            <td className="border border-black px-1 py-1 text-[11px] font-bold text-center align-bottom" colSpan={4} rowSpan={2}>सचिव / सरपंच स्वाक्षरी</td>
          </tr>
          <tr>
            <td className={`${td} text-left`} colSpan={16}>टीप : १) ह्या आकारणीचा अर्थ जागेवर मालकी हक्क नव्हे. २) हा नमुना ८ नाही.</td>
          </tr>
        </tbody>
      </table>

      <div className="text-right text-sm mt-1">पान नंबर : {s(n.anu_kramank)}</div>
    </div>
  );
};

const ImlaKarReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
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
    document.title = 'मालमत्ता धारकाची यादी';
    let params: { ward?: string; start?: string; end?: string; type?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('imlakarParams') || '{}');
    } catch {
      params = {};
    }
    document.title = 'इमलाकर मोजमाप यादी';
    if (params.year && !isNaN(Number(params.year))) setReportYear(Number(params.year));
    (async () => {
      try {
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

  return (
    <div className="ik-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .ik-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .ik-report { zoom: 0.85; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .ik-page { page-break-after: always; }
          .ik-page:last-child { page-break-after: auto; }
        }`}</style>

      <div className="no-print mb-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div className="space-y-10 print:space-y-0">
        {records.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            {loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}
          </p>
        ) : (
          records.map((n, i) => <RecordBlock key={i} n={n} loc={loc} cy={reportYear} />)
        )}
      </div>
    </div>
  );
};

export default ImlaKarReport;

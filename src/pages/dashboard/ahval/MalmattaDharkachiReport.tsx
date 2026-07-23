import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';

/* फेरकर आकारणी मुल्यांकन यादी (मालमत्ता धारकाची यादी) — exact old `malmatta-darkahchi-yadi-list` layout.
   One नमुना-८ block per property (one per printed page). Filters via sessionStorage 'dharkachiYadiParams'. */

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

const td = 'border border-black px-1 py-1 text-[11px] align-middle text-center';
const tdb = `${td} font-bold`;

const RecordBlock = ({ n, loc, cy, qrUrl, blank = false }: { n: Row; loc: { district: string; taluka: string; gramPanchayat: string }; cy: number; qrUrl?: string; blank?: boolean }) => {
  // blank form: सर्व value cells रिकामे (0 सुद्धा नको), header मात्र dynamic
  const sv = (v: unknown) => (blank ? '' : s(v));
  const fv = (v: unknown) => (blank ? '' : f(v));
  // blank form: value ओळींना उंची द्या (हाताने लिहायला जागा)
  const blankH = blank ? { height: '30px' } : undefined;
  // blank असल्यास मालमत्तेचे वर्णन विभागात हाताने भरण्यासाठी अनेक रिकाम्या ओळी (खाली) दाखवतो
  const land = blank ? [] : ((n.khula_bhukhand_kar_aakarani as Row[]) || []);
  const cons = blank ? [] : ((n.bandkamachi_kar_aakarani as Row[]) || []);
  const manora = blank ? [] : ((n.manoryache_kar_aakarani as Row[]) || []);
  const BLANK_DESC_ROWS = 8;
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
    <div className="dy-page mx-auto relative" style={{ maxWidth: '1300px' }}>
      {qrUrl && (
        <span style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
          <QRCodeSVG value={qrUrl} size={48} level="M" marginSize={0} />
        </span>
      )}
      <div className="text-center">
        <p className="font-bold text-lg">फेरकर आकारणी मुल्यांकन यादी</p>
        <p className="text-sm">सन {cy} - {cy + 1}</p>
      </div>
      <div className="flex justify-between text-sm mt-1 mb-1 pr-14">
        <span>जिल्हा :- {loc.district}</span>
        <span>तालुका :- {loc.taluka}</span>
        <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
      </div>

      <table className="w-full border-collapse">
        <tbody>
          {/* Basic Info */}
          <tr style={blankH}>
            <td className={td}>अ.क्र</td>
            <td className={td}>{sv(n.anu_kramank)}</td>
            <td className={td}>मालमत्ता क्र.</td>
            <td className={td}>{sv(n.malmatta_number)}</td>
            <td className={td}>वार्ड क्र.</td>
            <td className={td}>{sv(n.ward_kramnak)}</td>
            <td className={td}>प्लॉट क्र.</td>
            <td className={td}>{sv(n.plot_number)}</td>
            <td className={td}>खसरा न.</td>
            <td className={td}>{sv(n.khasara_number)}</td>
            <td className={td}>सर्वे क्र.</td>
            <td className={td}>{sv(n.survey_number)}</td>
            <td className={td}>पाणी व्यवस्ता</td>
            <td className={td}>{sv(n.pinyacha_panyachi_vyavastha)}</td>
            <td className={td}>शौचालय</td>
            <td className={td}>{sv(n.ghari_souychalaya)}</td>
            <td className={td}>मिलकत प्रकार</td>
            <td className={td}>{sv(n.milkat_prakar)}</td>
          </tr>

          {/* Owner Info + chatur seema */}
          <tr style={blankH}>
            <td className={tdb} colSpan={2}>घरमालकाचे नाव</td>
            <td className={td} colSpan={7}>{sv(n.ghar_malkache_nav)}</td>
            <td className={td} rowSpan={4}>चतुर : सीमा</td>
            <td className={td} colSpan={2}>पूर्वेस</td>
            <td className={td} colSpan={10}>{sv(n.purv)}</td>
          </tr>
          <tr style={blankH}>
            <td className={tdb} colSpan={2}>पत्नी / मुलांचे नाव</td>
            <td className={td} colSpan={7}>{sv(n.patni_mulache_nav)}</td>
            <td className={td} colSpan={2}>पश्चिमेस</td>
            <td className={td} colSpan={10}>{sv(n.paschim)}</td>
          </tr>
          <tr style={blankH}>
            <td className={tdb} colSpan={2}>भोगवटदाराचे नाव</td>
            <td className={td} colSpan={7}>{sv(n.bhogavat_darache_nav)}</td>
            <td className={td} colSpan={2}>उत्तरेस</td>
            <td className={td} colSpan={10}>{sv(n.uttar)}</td>
          </tr>
          <tr style={blankH}>
            <td className={tdb} colSpan={2}>पत्ता</td>
            <td className={td} colSpan={7}>{sv(n.patta_nagar_layout_society)}</td>
            <td className={td} colSpan={2}>दक्षिणेस</td>
            <td className={td} colSpan={10}>{sv(n.dakshin)}</td>
          </tr>

          {/* Area and Contact Info */}
          <tr>
            <td className={`${tdb} whitespace-nowrap`} rowSpan={2} colSpan={2}>एकूण जागेचे क्षेत्रफळ</td>
            <td className={`${td} whitespace-nowrap`}>लांबी (चौ. फु .)</td>
            <td className={`${td} whitespace-nowrap`}>रुंदी (चौ. फु .)</td>
            <td className={`${td} whitespace-nowrap`} colSpan={2}>क्षेत्रफळ(चौ. फु .)</td>
            <td className={`${td} whitespace-nowrap`} colSpan={2}>मीटर(चौ. मीटर)</td>
            <td className={`${td} whitespace-nowrap`} colSpan={2}>उर्वरित(चौ. फु .)</td>
            <td className={`${td} whitespace-nowrap`} colSpan={2}>उर्वरित मीटर(चौ. मीटर )</td>
            <td className={td} colSpan={2}>मोबाईल</td>
            <td className={td} colSpan={3}>आधार</td>
            <td className={td} colSpan={3}>वोटर</td>
          </tr>
          <tr style={blankH}>
            <td className={td}>{fv(n.lambi)}</td>
            <td className={td}>{fv(n.rundi)}</td>
            <td className={td} colSpan={2}>{fv(n.shetrafal_choras_foot)}</td>
            <td className={td} colSpan={2}>{fv(n.shetrafal_choras_meter)}</td>
            <td className={td} colSpan={2}>{fv(n.urvarit_khali_jaga_choras_foot)}</td>
            <td className={td} colSpan={2}>{fv(Number(n.urvarit_khali_jaga_choras_foot || 0) * 0.092903)}</td>
            <td className={td} colSpan={2}>{sv(n.mobile_number)}</td>
            <td className={td} colSpan={3}>{sv(n.aadahar_card_number)}</td>
            <td className={td} colSpan={4}>{sv(n.matdar_card_number)}</td>
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

          {/* blank form: हाताने भरण्यासाठी रिकाम्या ओळी (20 columns प्रत्येकी) */}
          {blank && Array.from({ length: BLANK_DESC_ROWS }).map((_, i) => (
            <tr key={`blank-desc-${i}`} style={{ height: '26px' }}>
              <td className={td} colSpan={2}>&nbsp;</td>
              {Array.from({ length: 14 }).map((__, j) => <td key={j} className={td}>&nbsp;</td>)}
              <td className={td} colSpan={4}>&nbsp;</td>
            </tr>
          ))}

          {/* Land (taxationLandRS4) */}
          {land.map((it, i) => (
            <tr key={`l${i}`}>
              <td className={td} colSpan={2}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td}>{sv(it.malmatteche_prakar_name)}</td>
              <td className={td}>एकूण जागा</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>{fv(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td}>{fv(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td}>{fv(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td}>{fv(sqmOf(it))}</td>
              <td className={td}>{fv(it.jaminiche_varshik_mulya)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>{fv(landBhandvali(it))}</td>
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td}>{fv(landBhandvali(it) / 1000)}</td>
              <td className={td} colSpan={4}>{fv(landBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}

          {/* Construction (constructionTaxRS5) */}
          {cons.map((it, i) => (
            <tr key={`c${i}`}>
              <td className={td} colSpan={2}>{sv(it.malmatteche_prakar_name)}</td>
              <td className={td}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td}>{sv(it.vapar_prakar)}</td>
              <td className={td}>{sv(it.bandkam_majla_name)}</td>
              <td className={td}>{sv(it.vayoman)}</td>
              <td className={td}>{fv(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td}>{fv(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td}>{fv(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td}>{fv(sqmOf(it))}</td>
              <td className={td}>{fv(it.imaratiche_varshik_mulya)}</td>
              <td className={td}>{sv(it.ghasara_dar)}</td>
              <td className={td}>{sv(it.bharank)}</td>
              <td className={td}>{fv(consBhandvali(it))}</td>
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td}>{fv(consBhandvali(it) / 1000)}</td>
              <td className={td} colSpan={4}>{fv(consBhandvali(it) * Number(it.aakarani_dar || 0) / 1000)}</td>
            </tr>
          ))}

          {/* Manora (taxPayerRS6) */}
          {manora.map((it, i) => (
            <tr key={`m${i}`}>
              <td className={td} colSpan={2}>{sv(it.malmatteche_varnan_name)}</td>
              <td className={td}>{sv(it.malmatteche_prakar_name)}</td>
              <td className={td}>{sv(it.vapar_prakar)}</td>
              <td className={td}>{sv(it.manoryache_bhag_name)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>{fv(it.shetrafal_purv_paschim_foot)}</td>
              <td className={td}>{fv(it.shetrafal_uttar_dakshin_foot)}</td>
              <td className={td}>{fv(it.ekun_shetrafal_choras_foot)}</td>
              <td className={td}>{fv(sqmOf(it))}</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>&nbsp;</td>
              <td className={td}>{sv(it.aakarani_dar)}</td>
              <td className={td}>&nbsp;</td>
              <td className={td} colSpan={4}>{fv(manoraKar(it))}</td>
            </tr>
          ))}

          {/* Final Summary */}
          <tr className="font-bold bg-gray-100">
            <td className={td} colSpan={8}>कराची रक्क्म</td>
            <td className={td} colSpan={6}>अपिलाचे निकाल आणि त्यानंतर केलेले फेरफार (रुपये)</td>
            <td className={td} colSpan={2}>गृह व भूमीकर</td>
            <td className={td} colSpan={4}>{fv(gruhkarAmt)}</td>
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
          <tr style={blankH}>
            <td className={td} colSpan={2}>{fv(gruhkarAmt)}</td>
            <td className={td}>{fv(vizAmt)}</td>
            <td className={td}>{fv(aarogyaAmt)}</td>
            <td className={td}>{fv(safaiAmt)}</td>
            <td className={td}>{fv(samanyaPaniAmt)}</td>
            <td className={td}>{fv(visheshPaniAmt)}</td>
            <td className={td}>{fv(ekunTaxAmt)}</td>
            <td className={td}>{fv(n.ekun_kar_bharne)}</td>
            <td className={td} colSpan={2}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td}>&nbsp;</td>
            <td className={td} colSpan={4}>&nbsp;</td>
          </tr>
          <tr style={blankH}>
            <td className={tdb} colSpan={2}>फेरफार / शेरा</td>
            <td className={`${td} text-left`} colSpan={18}>{sv(n.magahun_ghat_kiva_badal)}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-right text-sm mt-1">पान नंबर : {blank ? '' : sv(n.anu_kramank)}</div>
    </div>
  );
};

const MalmattaDharkachiReport = () => {
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
      params = JSON.parse(sessionStorage.getItem('dharkachiYadiParams') || '{}');
    } catch {
      params = {};
    }
    if (params.type === 'khula') document.title = 'खुला भूखंड यादी';
    else if (params.type === 'ghar') document.title = 'घर कर लावायचा यादी';
    if (params.year && !isNaN(Number(params.year))) setReportYear(Number(params.year));
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        // ward is optional — no ward fetches all wards for the user
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, params.type, params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load dharkachi yadi', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('dharkachiYadiParams') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'dharkachi', sessionKey: 'dharkachiYadiParams', params: shareParams, data: records, enabled: !isPublicReportMode() });

  return (
    <div className="dy-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .dy-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 24mm 4mm 8mm 16mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .dy-report { zoom: 0.85; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .dy-page { page-break-after: always; }
          .dy-page:last-child { page-break-after: auto; }
          /* print-only: enlarge cell text for readability (screen unaffected) */
          .dy-report td { font-size: 14px !important; line-height: 1.2 !important; }
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
          <>
            {records.map((n, i) => <RecordBlock key={i} n={n} loc={loc} cy={reportYear} qrUrl={qrUrl} />)}
            {/* शेवटी एक कोरी (blank) यादी — जिल्हा/तालुका/ग्रा.पं. dynamic, बाकी हाताने भरण्यासाठी रिकामी */}
            <RecordBlock key="blank" n={{}} loc={loc} cy={reportYear} blank />
          </>
        )}
      </div>
    </div>
  );
};

export default MalmattaDharkachiReport;

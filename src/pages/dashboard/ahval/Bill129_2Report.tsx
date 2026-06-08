import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';

/* कराची मागणी पावती — मुंबई ग्रा.प. कायदा १९५९ कलम १२९(२).
   Same as old `magniche-bill-ward-report-129-2`. Two copies (left + right) per property.
   Params via sessionStorage 'bill129_2Params' from Bill-Ward page. (payment link / QR — later) */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const num = (v: unknown) => Number(v || 0);
const r0 = (v: number) => Math.round(v).toString();

type TaxRow = { label: string; thak: number; chalu: number; vadh: number; sut: number; ekun: number };

const computeRows = (n: Row): { rows: TaxRow[]; tot: TaxRow } => {
  const sj = (n.sillak_joda as Row) || {};
  const sp = (n.sillak_joda_prev as Row) || {};
  const head = (baseKey: string, addKey: string, disKey: string, label: string): TaxRow => {
    const thak = num(sp[baseKey]);
    const chalu = num(sj[baseKey]);
    const vadh = (thak * num(sp[addKey])) / 100;
    const sut = (chalu * num(sj[disKey])) / 100;
    return { label, thak, chalu, vadh, sut, ekun: thak + vadh + chalu - sut };
  };
  const feeRow = (key: string, label: string): TaxRow => {
    const thak = num(sp[key]);
    const chalu = num(sj[key]);
    return { label, thak, chalu, vadh: 0, sut: 0, ekun: thak + chalu };
  };
  const rows: TaxRow[] = [
    head('gruhkar_v_bhumikar', '5_percent_addition_gvb', '5_percent_discount_gvb', 'गृह व भूमीकर'),
    head('viz_divabatti_kar', '5_percent_addition_vdk', '5_percent_discount_vdk', 'दिवाबत्ती / वीज कर'),
    head('aarogya_rakshan_kar', '5_percent_addition_ark', '5_percent_discount_ark', 'आरोग्य रक्षण कर'),
    head('safae_kar', '5_percent_addition_sk', '5_percent_discount_sk', 'सफाई कर'),
    head('samanya_pani_kar', '5_percent_addition_spk', '5_percent_discount_spk', 'सामान्य पाणी कर'),
    head('vishesh_pani_kar', '5_percent_addition_vpk', '5_percent_discount_vpk', 'विशेष पाणी कर'),
    feeRow('etar_fees', 'इतर फी'),
    feeRow('notice_fees', 'नोटीस फी'),
  ];
  const tot: TaxRow = rows.reduce(
    (t, r) => ({ label: 'एकूण मागणी', thak: t.thak + r.thak, chalu: t.chalu + r.chalu, vadh: t.vadh + r.vadh, sut: t.sut + r.sut, ekun: t.ekun + r.ekun }),
    { label: 'एकूण मागणी', thak: 0, chalu: 0, vadh: 0, sut: 0, ekun: 0 },
  );
  return { rows, tot };
};

const td = 'border border-black px-1 py-0.5 text-[11px] align-middle text-center';

const Receipt = ({
  n, loc, cy, dates, bharna, copy, qrUrl,
}: {
  n: Row; loc: { district: string; taluka: string; gramPanchayat: string };
  cy: number; dates: { start: string; end: string }; bharna: string; copy: 'left' | 'right';
  qrUrl?: string;
}) => {
  const { rows, tot } = computeRows(n);
  return (
    <div className={copy === 'left' ? 'px-2 border-r border-dashed border-black' : 'px-2'}>
      <div className="text-center">
        <p className="font-bold text-[15px]">कराची मागणी पावती</p>
        <p className="font-bold text-sm">सन. {cy} - {cy + 1}</p>
        <p className="text-xs">मुंबई ग्रा. प. कायदा १९५९ कलम १२९(२)</p>
      </div>
      <div className="flex justify-between text-[11px] mt-1 mb-1">
        <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
        <span>जिल्हा :- {loc.district}</span>
        <span className="relative">
          {qrUrl && (
            <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 2, zIndex: 10 }}>
              <QRCodeSVG value={qrUrl} size={50} level="M" marginSize={0} />
            </span>
          )}
          तालुका :- {loc.taluka}
        </span>
      </div>

      <table className="w-full table-fixed border-collapse">
        <colgroup>{Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: `${100 / 12}%` }} />)}</colgroup>
        <tbody>
          <tr>
            <td className={td}>अ.क्र.</td><td className={td}>{s(n.anu_kramank)}</td>
            <td className={td}>मा.क्र.</td><td className={td}>{s(n.malmatta_number)}</td>
            <td className={td}>वार्ड क्र.</td><td className={td}>{s(n.ward_kramnak)}</td>
            <td className={td}>प्लॉट क्र</td><td className={td}>{s(n.plot_number)}</td>
            <td className={td}>खसरा न.</td><td className={td}>{s(n.khasara_number)}</td>
            <td className={td}>सर्वे क्र.</td><td className={td}>{s(n.survey_number)}</td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>खातेधारकाचे नाव</td>
            <td className={td} colSpan={10}>{s(n.ghar_malkache_nav)}</td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>भोगवतधाराचे नाव</td>
            <td className={td} colSpan={10}>{s(n.bhogavat_darache_nav)}</td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>पत्ता</td>
            <td className={td} colSpan={10}>{s(n.patta_nagar_layout_society)}</td>
          </tr>
          <tr>
            <td className="px-1 py-0.5" colSpan={2} />
            <td className={td} colSpan={8}>कर भरण्याची अंतिम तारीख</td>
            <td className="px-1 py-0.5" colSpan={2} />
          </tr>
          <tr>
            <td className={td} colSpan={2}>दिनांक</td>
            <td className={td} colSpan={3}>{dates.start}</td>
            <td className={td}>ते</td>
            <td className={td} colSpan={2}>दिनांक</td>
            <td className={td} colSpan={4}>{dates.end}</td>
          </tr>
          <tr className="font-bold">
            <td className={td} colSpan={3} rowSpan={2}>करांचे नाव</td>
            <td className={td} colSpan={6}>वसूल पात्र रक्कम</td>
            <td className={td} colSpan={3} rowSpan={2}>एकूण</td>
          </tr>
          <tr className="font-bold">
            <td className={td} colSpan={2}>थकबाकी</td>
            <td className={td} colSpan={2}>चालू</td>
            <td className={td}>५% वाढ</td>
            <td className={td}>५% सूट</td>
          </tr>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className={td} colSpan={3}>{row.label}</td>
              <td className={td} colSpan={2}>{r0(row.thak)}</td>
              <td className={td} colSpan={2}>{r0(row.chalu)}</td>
              <td className={td}>{r0(row.vadh)}</td>
              <td className={td}>{r0(row.sut)}</td>
              <td className={td} colSpan={3}>{r0(row.ekun)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className={td} colSpan={3}>{tot.label}</td>
            <td className={td} colSpan={2}>{r0(tot.thak)}</td>
            <td className={td} colSpan={2}>{r0(tot.chalu)}</td>
            <td className={td}>{r0(tot.vadh)}</td>
            <td className={td}>{r0(tot.sut)}</td>
            <td className={td} colSpan={3}>{r0(tot.ekun)}</td>
          </tr>
          <tr>
            <td className="px-1 py-0.5" colSpan={2} />
            <td className={td} colSpan={8}>त्यांच्याकडून पुढील कराची रक्कम वसुली योग्य आहे</td>
            <td className="px-1 py-0.5" colSpan={2} />
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5 text-[10px] align-top text-left" colSpan={12} style={{ height: '130px' }}>
              <div className="flex h-full flex-col">
                {copy === 'right' && (
                  <>
                    <p>हे बिल आपणास प्राप्त झाल्यापासून देय रकमांचा भरणा {bharna} दिवसांच्या आत करावा अन्यथा ग्रामपंचायत अधिनियमाचा कलम क्रं १२९(२) अन्वये आपल्यावर मागणी बजावण्यात येईल.</p>
                    <p className="mt-1">टीप: 1. कराचा भरणा 30 सप्टेंबरपूर्वी केल्यास चालू घराच्या रकमेमध्ये ५ टक्के सूट देण्यात येईल.</p>
                    <p>&nbsp;&nbsp;&nbsp;2. थकीत गृहकरावर 5% दंड आकारण्यात येईल.</p>
                    <p>&nbsp;&nbsp;&nbsp;3. 30 सप्टेंबरनंतर 31 मार्चपर्यंत चालू वर्षाच्या गृहकरावर कोणत्याही प्रकारची सूट मिळणार नाही.</p>
                  </>
                )}
                <p className="text-right font-bold mt-auto pb-2">
                  {copy === 'right' ? 'सरपंच / सचिव सही' : 'खातेधारकांची सही'}
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const Bill129_2Report = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cy, setCy] = useState<number>(new Date().getFullYear());
  const [dates, setDates] = useState({ start: '', end: '' });
  const [bharna, setBharna] = useState('');
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
    document.title = 'कराची मागणी पावती १२९(२)';
    let p: { ward?: string; start?: string; end?: string; year?: string; toYear?: string; startDate?: string; endDate?: string; bharna?: string } = {};
    try {
      p = JSON.parse(sessionStorage.getItem('bill129_2Params') || '{}');
    } catch {
      p = {};
    }
    if (p.year && !isNaN(Number(p.year))) setCy(Number(p.year));
    setDates({ start: p.startDate || '', end: p.endDate || '' });
    setBharna(p.bharna || '');
    (async () => {
      try {
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        const res = await nodniService.getDharkachiYadi(p.ward, p.start, p.end, '', p.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load bill 129(2)', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareParams = (() => {
    try { return JSON.parse(sessionStorage.getItem('bill129_2Params') || '{}'); } catch { return {}; }
  })();
  const qrUrl = useReportShareUrl({
    reportType: 'bill-129-2', sessionKey: 'bill129_2Params',
    params: shareParams, data: records, enabled: !isPublicReportMode(),
  });

  return (
    <div className="bill2-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .bill2-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 24mm 4mm 8mm 16mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .bill2-report { zoom: 0.92; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bill2-page { page-break-after: always; }
          .bill2-page:last-child { page-break-after: auto; }
        }`}</style>

      <div className="no-print mb-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {records.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          {loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}
        </p>
      ) : (
        <div className="space-y-6">
          {records.map((n, i) => (
            <div key={i} className="bill2-page grid grid-cols-2 gap-0">
              <Receipt n={n} loc={loc} cy={cy} dates={dates} bharna={bharna} copy="left" qrUrl={qrUrl} />
              <Receipt n={n} loc={loc} cy={cy} dates={dates} bharna={bharna} copy="right" qrUrl={qrUrl} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bill129_2Report;

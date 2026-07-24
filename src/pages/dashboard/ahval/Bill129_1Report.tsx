import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';
import { fyLabel } from '../../../utils/fyConfig';

/* कराची मागणी पावती — मुंबई ग्रा.प. कायदा १९५९ कलम १२९(१).
   Same as old `magniche-bill-ward-report-129-1`. Two copies (left + right) per property.
   Params via sessionStorage 'bill129_1Params' from Bill-Ward page. (payment link / QR — later) */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const num = (v: unknown) => Number(v || 0);
const r0 = (v: number) => Math.round(v).toString();

type TaxRow = { label: string; thak: number; chalu: number; vadh: number; sut: number; ekun: number };

const computeRows = (n: Row): { rows: TaxRow[]; tot: TaxRow } => {
  const sj = (n.sillak_joda as Row) || {};
  const sp = (n.sillak_joda_prev as Row) || {};
  // round every value at source -> rows add up exactly to the total (no ±1-2 drift)
  const head = (baseKey: string, addKey: string, disKey: string, label: string): TaxRow => {
    const thak = Math.round(num(sp[baseKey]));
    const chalu = Math.round(num(sj[baseKey]));
    const vadh = Math.round((num(sp[baseKey]) * num(sp[addKey])) / 100);
    const sut = Math.round((num(sj[baseKey]) * num(sj[disKey])) / 100);
    return { label, thak, chalu, vadh, sut, ekun: thak + vadh + chalu - sut };
  };
  const feeRow = (key: string, label: string): TaxRow => {
    const thak = Math.round(num(sp[key]));
    const chalu = Math.round(num(sj[key]));
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
const PMODE: Record<string, string> = { cash: 'रोख', cheque: 'चेक', dd: 'डीडी', online: 'ऑनलाइन' };

const Receipt = ({
  n, loc, cy, dates, bharna, copy, qrUrl, blank = false,
}: {
  n: Row; loc: { district: string; taluka: string; gramPanchayat: string };
  cy: number; dates: { start: string; end: string }; bharna: string; copy: 'left' | 'right';
  qrUrl?: string; blank?: boolean;
}) => {
  // blank form: value cells रिकामे (0 सुद्धा नको), labels/structure तसेच
  const sv = (v: unknown) => (blank ? '' : s(v));
  const rv = (v: number) => (blank ? '' : r0(v));
  const { rows, tot } = computeRows(n);
  const pay = n.payment as {
    paid_total?: number; jama?: number; sillak?: number; pavti_number?: string;
    payments?: { type?: string; amount?: number; date?: string; ref?: string }[];
  } | null;
  return (
    <div className={copy === 'left' ? 'px-2 border-r border-dashed border-black' : 'px-2'}>
      <div className="text-center">
        <p className="font-bold text-[15px]">कराची मागणी पावती</p>
        <p className="font-bold text-sm">सन. {fyLabel(cy)}</p>
        <p className="text-xs">मुंबई ग्रा. प. कायदा १९५९ कलम १२९(१)</p>
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
            <td className={td}>अ.क्र.</td><td className={td}>{sv(n.anu_kramank)}</td>
            <td className={td}>मा.क्र.</td><td className={td}>{sv(n.malmatta_number)}</td>
            <td className={td}>वार्ड क्र.</td><td className={td}>{sv(n.ward_kramnak)}</td>
            <td className={td}>प्लॉट क्र</td><td className={td}>{sv(n.plot_number)}</td>
            <td className={td}>खसरा न.</td><td className={td}>{sv(n.khasara_number)}</td>
            <td className={td}>सर्वे क्र.</td><td className={td}>{sv(n.survey_number)}</td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>खातेधारकाचे नाव</td>
            <td className={td} colSpan={10}>{sv(n.ghar_malkache_nav)}</td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>भोगवतधाराचे नाव</td>
            <td className={td} colSpan={10}>{sv(n.bhogavat_darache_nav)}</td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>पत्ता</td>
            <td className={td} colSpan={10}>{sv(n.patta_nagar_layout_society)}</td>
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
            <td className={td}>५% दंड</td>
            <td className={td}>५% सूट</td>
          </tr>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className={td} colSpan={3}>{row.label}</td>
              <td className={td} colSpan={2}>{rv(row.thak)}</td>
              <td className={td} colSpan={2}>{rv(row.chalu)}</td>
              <td className={td}>{rv(row.vadh)}</td>
              <td className={td}>{rv(row.sut)}</td>
              <td className={td} colSpan={3}>{rv(row.ekun)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className={td} colSpan={3}>{tot.label}</td>
            <td className={td} colSpan={2}>{rv(tot.thak)}</td>
            <td className={td} colSpan={2}>{rv(tot.chalu)}</td>
            <td className={td}>{rv(tot.vadh)}</td>
            <td className={td}>{rv(tot.sut)}</td>
            <td className={td} colSpan={3}>{rv(tot.ekun)}</td>
          </tr>
          {pay && (
            <>
              <tr className="font-bold">
                <td className={td} colSpan={3}>एकूण भरणा (जमा)</td>
                <td className={td} colSpan={4}>{rv((pay.payments?.length ?? 0) > 0 ? num(pay.paid_total) : num(pay.jama ?? 0))}</td>
                <td className={td} colSpan={2}>शिल्लक</td>
                <td className={td} colSpan={3}>{rv(num(pay.sillak ?? 0))}</td>
              </tr>
              {(pay.payments?.length ?? 0) > 0 && (
                <tr>
                  <td className="border border-black px-1 py-0.5 text-[10px] align-top text-left" colSpan={12}>
                    भरणा तपशील: {pay.payments!.map((p) =>
                      `${p.date || ''} ₹${rv(num(p.amount))} (${PMODE[p.type || ''] || p.type || ''}${p.ref ? ` ${p.ref}` : ''})`
                    ).join('   |   ')}
                    {pay.pavti_number ? `   •   पावती क्र.: ${pay.pavti_number}` : ''}
                  </td>
                </tr>
              )}
            </>
          )}
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

const Bill129_1Report = () => {
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
    document.title = 'कराची मागणी पावती १२९(१)';
    let p: { ward?: string; start?: string; end?: string; year?: string; toYear?: string; startDate?: string; endDate?: string; bharna?: string } = {};
    try {
      p = JSON.parse(sessionStorage.getItem('bill129_1Params') || '{}');
    } catch {
      p = {};
    }
    if (p.year && !isNaN(Number(p.year))) setCy(Number(p.year));
    setDates({ start: p.startDate || '', end: p.endDate || '' });
    setBharna(p.bharna || '');
    (async () => {
      try {
        // Public (scanned-QR) mode: use the embedded snapshot instead of fetching.
        const pub = getPublicReportData<Row[]>();
        if (pub) { setRecords(pub); return; }
        // Year-wise fetch: backend filters to properties having मागील कर for p.year.
        const res = await nodniService.getDharkachiYadi(p.ward, p.start, p.end, '', p.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load bill 129(1)', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // params kept for the QR share (so a scan re-opens this exact report)
  const shareParams = (() => {
    try { return JSON.parse(sessionStorage.getItem('bill129_1Params') || '{}'); } catch { return {}; }
  })();
  const qrUrl = useReportShareUrl({
    reportType: 'bill-129-1', sessionKey: 'bill129_1Params',
    params: shareParams, data: records, enabled: !isPublicReportMode(),
  });

  return (
    <div className="bill1-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .bill1-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 24mm 4mm 8mm 16mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .bill1-report { zoom: 0.92; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bill1-page { page-break-after: always; }
          .bill1-page:last-child { page-break-after: auto; }
          /* print-only: enlarge cell text for readability (screen unaffected) */
          .bill1-report td { font-size: 13px !important; line-height: 1.25 !important; }
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
            <div key={i} className="bill1-page grid grid-cols-2 gap-0">
              <Receipt n={n} loc={loc} cy={cy} dates={dates} bharna={bharna} copy="left" qrUrl={qrUrl} />
              <Receipt n={n} loc={loc} cy={cy} dates={dates} bharna={bharna} copy="right" qrUrl={qrUrl} />
            </div>
          ))}
          {/* शेवटी एक कोरी (blank) पावती — हाताने भरण्यासाठी, header dynamic */}
          <div className="bill1-page grid grid-cols-2 gap-0">
            <Receipt n={{}} loc={loc} cy={cy} dates={dates} bharna={bharna} copy="left" blank />
            <Receipt n={{}} loc={loc} cy={cy} dates={dates} bharna={bharna} copy="right" blank />
          </div>
        </div>
      )}
    </div>
  );
};

export default Bill129_1Report;

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nodniService } from '../../../services';
import { getPublicReportData, isPublicReportMode } from '../../../utils/publicReport';
import { useReportShareUrl } from '../../../hooks/useReportShareUrl';
import { fyLabel } from '../../../utils/fyConfig';

/* नमुना ९ (multiple) — same demand-register layout as /namuna-9-1, one block per property/page.
   Filters via sessionStorage 'namuna9Params' from the Namuna 9 ahval page. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const f = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? String(v) : Math.round(num).toString();
};

const td = 'border border-black px-1 py-0.5 text-[11px] align-middle text-center';
const th = 'border border-black px-1 py-0.5 text-[10px] align-middle text-center font-bold bg-gray-100';
const colW = [44, 138, 81, 75, 75, 69, 119, 63, 69, 56, 56, 69, 63, 119, 63, 63, 56, 56, 69, 69];
const tableW = colW.reduce((a, b) => a + b, 0);

const RecordBlock = ({ n, loc, cy, qrUrl, blank = false }: { n: Row; loc: { district: string; taluka: string; gramPanchayat: string }; cy: number; qrUrl?: string; blank?: boolean }) => {
  // blank form: value cells रिकामे (0 सुद्धा नको), fixed structure/labels तसेच राहतील
  const sv = (v: unknown) => (blank ? '' : s(v));
  const fv = (v: unknown) => (blank ? '' : f(v));
  const sj = (n.sillak_joda as Row) || {};
  const sjn = (k: string) => Number(sj[k] || 0);
  const gruhkar = sjn('gruhkar_v_bhumikar');
  const viz = sjn('viz_divabatti_kar');
  const aarogya = sjn('aarogya_rakshan_kar');
  const safai = sjn('safae_kar');
  const samanya = sjn('samanya_pani_kar');
  const vishesh = sjn('vishesh_pani_kar');
  const etar = sjn('etar_fees');
  const notice = sjn('notice_fees');

  const sjPrev = (n.sillak_joda_prev as Row) || {};
  const mp = (k: string): number | '' => Number(sjPrev[k] || 0) || '';
  const pcPrev = (col: string): number | '' => Number(sjPrev[col] || 0) || '';
  const pc = (col: string): number | '' => sjn(col) || '';
  const D = {
    gruhkar: [pcPrev('5_percent_addition_gvb'), pc('5_percent_discount_gvb')],
    viz: [pcPrev('5_percent_addition_vdk'), pc('5_percent_discount_vdk')],
    aarogya: [pcPrev('5_percent_addition_ark'), pc('5_percent_discount_ark')],
    safai: [pcPrev('5_percent_addition_sk'), pc('5_percent_discount_sk')],
    samanya: [pcPrev('5_percent_addition_spk'), pc('5_percent_discount_spk')],
    vishesh: [pcPrev('5_percent_addition_vpk'), pc('5_percent_discount_vpk')],
    etar: ['', ''],
    notice: ['', ''],
  };
  const M = {
    gruhkar: mp('gruhkar_v_bhumikar'),
    viz: mp('viz_divabatti_kar'),
    aarogya: mp('aarogya_rakshan_kar'),
    safai: mp('safae_kar'),
    samanya: mp('samanya_pani_kar'),
    vishesh: mp('vishesh_pani_kar'),
    etar: mp('etar_fees'),
    notice: mp('notice_fees'),
  };
  const mn = (v: number | '') => (v === '' ? 0 : v);
  const numOr0 = (v: number | string) => (v === '' || v == null ? 0 : Number(v) || 0);
  const ekun = (magil: number | string, chalu: number, dand: number | string, sut: number | string) => {
    const m = numOr0(magil);
    const d = numOr0(dand);
    const su = numOr0(sut);
    // round each component (same as 129 बिल) so totals match across all reports
    return Math.round(m) + Math.round((m * d) / 100) + Math.round(chalu) - Math.round((chalu * su) / 100);
  };
  // actual दंड / सूट rupee amounts (base × stored %/100) — columns must show the value, not the percent
  const dandAmt = (magil: number | '', addPct: number | ''): number | '' =>
    Math.round(numOr0(magil) * numOr0(addPct) / 100) || '';
  const sutAmt = (chalu: number, discPct: number | ''): number | '' =>
    Math.round(numOr0(chalu) * numOr0(discPct) / 100) || '';
  const ekGruhkar = ekun(M.gruhkar, gruhkar, D.gruhkar[0], D.gruhkar[1]);
  const ekViz = ekun(M.viz, viz, D.viz[0], D.viz[1]);
  const ekAarogya = ekun(M.aarogya, aarogya, D.aarogya[0], D.aarogya[1]);
  const ekSafai = ekun(M.safai, safai, D.safai[0], D.safai[1]);
  const ekSamanya = ekun(M.samanya, samanya, D.samanya[0], D.samanya[1]);
  const ekVishesh = ekun(M.vishesh, vishesh, D.vishesh[0], D.vishesh[1]);
  const ekEtar = ekun(M.etar, etar, D.etar[0], D.etar[1]);
  const ekNotice = ekun(M.notice, notice, D.notice[0], D.notice[1]);
  const subtotal4 = gruhkar + viz + aarogya + safai;
  const totalAll = subtotal4 + samanya + vishesh + etar + notice;
  const mSubtotal4 = mn(M.gruhkar) + mn(M.viz) + mn(M.aarogya) + mn(M.safai);
  const mTotalAll = mSubtotal4 + mn(M.samanya) + mn(M.vishesh) + mn(M.etar) + mn(M.notice);
  const rr = (v: number) => Math.round(v);
  const ekSubtotal4 = rr(ekGruhkar) + rr(ekViz) + rr(ekAarogya) + rr(ekSafai);
  const ekTotalAll = ekSubtotal4 + rr(ekSamanya) + rr(ekVishesh) + rr(ekEtar) + rr(ekNotice);
  // इत्तर फी / नोटीस फी rows: only show when they have a value (> 0)
  const showEtar = blank || numOr0(M.etar) > 0 || numOr0(etar) > 0 || rr(ekEtar) > 0;
  const showNotice = blank || numOr0(M.notice) > 0 || numOr0(notice) > 0 || rr(ekNotice) > 0;

  const vasuliBlanks = (key: string) => Array.from({ length: 6 }).map((_, k) => <td key={`${key}-${k}`} className={td} />);

  return (
    <div className="n9m-page mx-auto" style={{ width: `${tableW}px` }}>
      <div className="text-center">
        <p className="font-bold text-lg">नमुना ९</p>
        <p className="text-sm">सन {fyLabel(cy)} या वर्षाची आकारणी केलेल्या कराची मागणी नोंदवही</p>
      </div>
      <div className="flex justify-between text-sm mt-1 mb-0.5">
        <span>वार्ड नं :- {sv(n.ward_kramnak)}</span>
        <span>जिल्हा :- {loc.district}</span>
        <span>तालुका :- {loc.taluka}</span>
        <span className="relative">
          {qrUrl && (
            <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 2, zIndex: 10 }}>
              <QRCodeSVG value={qrUrl} size={40} level="M" marginSize={0} />
            </span>
          )}
          ग्रामपंचायत :- {loc.gramPanchayat}
        </span>
      </div>

      <table className="table-fixed border-collapse" style={{ width: `${tableW}px` }}>
        <colgroup>{colW.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}</colgroup>
        <thead>
          <tr>
            <th className={th} rowSpan={2}>अ.क्र.</th>
            <th className={th} rowSpan={2}>खातेधारकाचे नाव</th>
            <th className={th} rowSpan={2}>मालमत्ता क्र.</th>
            <th className={th} rowSpan={2}>खासरा क्र.</th>
            <th className={th} rowSpan={2}>सर्वे क्र.</th>
            <th className={th} rowSpan={2}>प्लॉट क्र.</th>
            <th className={th} rowSpan={2}>करांचे नाव</th>
            <th className={th} colSpan={2}>मागणी</th>
            <th className={th} rowSpan={2}>5% दंड</th>
            <th className={th} rowSpan={2}>5% सूट</th>
            <th className={th} rowSpan={2}>एकूण</th>
            <th className={th} rowSpan={2}>पावती क्र.</th>
            <th className={th} rowSpan={2}>करांचे नाव</th>
            <th className={th} colSpan={2}>वसुली</th>
            <th className={th} rowSpan={2}>5% दंड</th>
            <th className={th} rowSpan={2}>5% सूट</th>
            <th className={th} rowSpan={2}>एकूण</th>
            <th className={th} rowSpan={2}>बाकी</th>
          </tr>
          <tr>
            <th className={th}>मागील</th>
            <th className={th}>चालू</th>
            <th className={th}>मागील</th>
            <th className={th}>चालू</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={td} rowSpan={10}>{sv(n.anu_kramank)}</td>
            <td className={td} rowSpan={4}>{sv(n.ghar_malkache_nav)}</td>
            <td className={td}>{sv(n.malmatta_number)}</td>
            <td className={td}>{sv(n.khasara_number)}</td>
            <td className={td}>{sv(n.survey_number)}</td>
            <td className={td}>{sv(n.plot_number)}</td>
            <td className={td}>गृहकर व भूमीकर</td>
            <td className={td}>{fv(M.gruhkar)}</td><td className={td}>{fv(gruhkar)}</td><td className={td}>{fv(dandAmt(M.gruhkar, D.gruhkar[0]))}</td><td className={td}>{fv(sutAmt(gruhkar, D.gruhkar[1]))}</td><td className={td}>{fv(ekGruhkar)}</td>
            <td className={td} rowSpan={5} />
            <td className={td}>गृहकर व भूमीकर</td>
            {vasuliBlanks('r1')}
          </tr>
          <tr>
            <td className={td} rowSpan={3} colSpan={4}>{sv(n.patta_nagar_layout_society)}</td>
            <td className={td}>दिवाबत्ती/वीज कर</td>
            <td className={td}>{fv(M.viz)}</td><td className={td}>{fv(viz)}</td><td className={td}>{fv(dandAmt(M.viz, D.viz[0]))}</td><td className={td}>{fv(sutAmt(viz, D.viz[1]))}</td><td className={td}>{fv(ekViz)}</td>
            <td className={td}>दिवाबत्ती/वीज कर</td>
            {vasuliBlanks('r2')}
          </tr>
          <tr>
            <td className={td}>आरोग्य रक्षण कर</td>
            <td className={td}>{fv(M.aarogya)}</td><td className={td}>{fv(aarogya)}</td><td className={td}>{fv(dandAmt(M.aarogya, D.aarogya[0]))}</td><td className={td}>{fv(sutAmt(aarogya, D.aarogya[1]))}</td><td className={td}>{fv(ekAarogya)}</td>
            <td className={td}>आरोग्य रक्षण कर</td>
            {vasuliBlanks('r3')}
          </tr>
          <tr>
            <td className={td}>सफाई कर</td>
            <td className={td}>{fv(M.safai)}</td><td className={td}>{fv(safai)}</td><td className={td}>{fv(dandAmt(M.safai, D.safai[0]))}</td><td className={td}>{fv(sutAmt(safai, D.safai[1]))}</td><td className={td}>{fv(ekSafai)}</td>
            <td className={td}>सफाई कर</td>
            {vasuliBlanks('r4')}
          </tr>
          <tr className="font-bold">
            <td className={td}>भोगवटदाराचे नाव</td>
            <td className={td} colSpan={4}>मिलकत प्रकार</td>
            <td className={td}>एकूण</td>
            <td className={td}>{fv(mSubtotal4)}</td><td className={td}>{fv(subtotal4)}</td><td className={td} /><td className={td} /><td className={td}>{fv(ekSubtotal4)}</td>
            <td className={td}>एकूण</td>
            {vasuliBlanks('r7')}
          </tr>
          <tr>
            <td className={td} rowSpan={5}>{sv(n.bhogavat_darache_nav)}</td>
            <td className={td} rowSpan={5} colSpan={4}>{sv(n.milkat_prakar)}</td>
            <td className={td}>सामान्य पाणी कर</td>
            <td className={td}>{fv(M.samanya)}</td><td className={td}>{fv(samanya)}</td><td className={td}>{fv(dandAmt(M.samanya, D.samanya[0]))}</td><td className={td}>{fv(sutAmt(samanya, D.samanya[1]))}</td><td className={td}>{fv(ekSamanya)}</td>
            <td className={td} rowSpan={5} />
            <td className={td}>सामान्य पाणी कर</td>
            {vasuliBlanks('r8')}
          </tr>
          <tr>
            <td className={td}>विशेष पाणी कर</td>
            <td className={td}>{fv(M.vishesh)}</td><td className={td}>{fv(vishesh)}</td><td className={td}>{fv(dandAmt(M.vishesh, D.vishesh[0]))}</td><td className={td}>{fv(sutAmt(vishesh, D.vishesh[1]))}</td><td className={td}>{fv(ekVishesh)}</td>
            <td className={td}>विशेष पाणी कर</td>
            {vasuliBlanks('r9')}
          </tr>
          {showEtar && (
          <tr>
            <td className={td}>इत्तर फी</td>
            <td className={td}>{fv(M.etar)}</td><td className={td}>{fv(etar)}</td><td className={td}>{fv(D.etar[0])}</td><td className={td}>{fv(D.etar[1])}</td><td className={td}>{fv(ekEtar)}</td>
            <td className={td}>इत्तर फी</td>
            {vasuliBlanks('r10')}
          </tr>
          )}
          {showNotice && (
          <tr>
            <td className={td}>नोटीस फी</td>
            <td className={td}>{fv(M.notice)}</td><td className={td}>{fv(notice)}</td><td className={td}>{fv(D.notice[0])}</td><td className={td}>{fv(D.notice[1])}</td><td className={td}>{fv(ekNotice)}</td>
            <td className={td}>नोटीस फी</td>
            {vasuliBlanks('r11')}
          </tr>
          )}
          <tr className="font-bold">
            <td className={td}>एकूण मागणी</td>
            <td className={td}>{fv(mTotalAll)}</td><td className={td}>{fv(totalAll)}</td><td className={td} /><td className={td} /><td className={td}>{fv(ekTotalAll)}</td>
            <td className={td}>एकूण मागणी</td>
            {vasuliBlanks('r12')}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const Namuna9MultiReport = () => {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [zoom, setZoom] = useState(1.15);
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
    document.title = 'नमुना ९';
    let params: { ward?: string; start?: string; end?: string; year?: string } = {};
    try {
      params = JSON.parse(sessionStorage.getItem('namuna9Params') || '{}');
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
        console.error('Failed to load namuna-9 multi', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareParams = (() => { try { return JSON.parse(sessionStorage.getItem('namuna9Params') || '{}'); } catch { return {}; } })();
  const qrUrl = useReportShareUrl({ reportType: 'namuna9', sessionKey: 'namuna9Params', params: shareParams, data: records, enabled: !isPublicReportMode() });

  return (
    <div className="n9m-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .n9m-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 18mm 8mm 8mm 12mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .n9m-report { zoom: 0.70; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          /* print-only: enlarge cell text for readability (screen unaffected) */
          .n9m-report td, .n9m-report th { font-size: 15px !important; line-height: 1.15 !important; }
          .n9m-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n9m-zoom { zoom: 1 !important; }
          /* two reports per page: keep each report intact, break only after every 2nd */
          .n9m-page { page-break-inside: avoid; }
          /* top report of each pair: gap + dashed cut guide line for clean cutting */
          .n9m-page:nth-child(odd) { padding-bottom: 6mm; border-bottom: 1px dashed #999; margin-bottom: 6mm; }
          .n9m-page:nth-child(2n) { page-break-after: always; padding-top: 8mm; }
          .n9m-page:last-child { page-break-after: auto; }
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

      <div className="n9m-wrap overflow-x-auto">
        <div className="n9m-zoom space-y-10 print:space-y-0" style={{ zoom }}>
          {records.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              {loading ? 'लोड होत आहे...' : 'या निवडीसाठी माहिती उपलब्ध नाही'}
            </p>
          ) : (
            <>
              {records.map((n, i) => <RecordBlock key={i} n={n} loc={loc} cy={reportYear} qrUrl={qrUrl} />)}
              {/* शेवटी एक कोरी (blank) नोंदवही — जिल्हा/तालुका/ग्रा.पं. dynamic, बाकी हाताने भरण्यासाठी रिकामी */}
              <RecordBlock key="blank" n={{}} loc={loc} cy={reportYear} blank />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Namuna9MultiReport;

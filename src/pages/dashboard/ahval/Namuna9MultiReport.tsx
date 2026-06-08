import { useEffect, useState } from 'react';
import { nodniService } from '../../../services';

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
const colW = [35, 110, 65, 60, 60, 55, 95, 50, 55, 45, 45, 55, 50, 95, 50, 50, 45, 45, 55, 55];
const tableW = colW.reduce((a, b) => a + b, 0);

const RecordBlock = ({ n, loc, cy }: { n: Row; loc: { district: string; taluka: string; gramPanchayat: string }; cy: number }) => {
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
    return m + (m * d) / 100 + (chalu - (chalu * su) / 100);
  };
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

  const vasuliBlanks = (key: string) => Array.from({ length: 6 }).map((_, k) => <td key={`${key}-${k}`} className={td} />);

  return (
    <div className="n9m-page mx-auto" style={{ width: `${tableW}px` }}>
      <div className="text-center">
        <p className="font-bold text-lg">नमुना ९</p>
        <p className="text-sm">सन {cy} - {cy + 1} या वर्षाची आकारणी केलेल्या कराची मागणी नोंदवही</p>
      </div>
      <div className="text-sm mt-1">वार्ड नं :- {s(n.ward_kramnak)}</div>
      <div className="flex justify-between text-sm mt-1 mb-0.5">
        <span>जिल्हा :- {loc.district}</span>
        <span>तालुका :- {loc.taluka}</span>
        <span>ग्रामपंचायत :- {loc.gramPanchayat}</span>
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
            <td className={td} rowSpan={10}>{s(n.anu_kramank)}</td>
            <td className={td} rowSpan={4}>{s(n.ghar_malkache_nav)}</td>
            <td className={td}>{s(n.malmatta_number)}</td>
            <td className={td}>{s(n.khasara_number)}</td>
            <td className={td}>{s(n.survey_number)}</td>
            <td className={td}>{s(n.plot_number)}</td>
            <td className={td}>गृहकर व भूमीकर</td>
            <td className={td}>{f(M.gruhkar)}</td><td className={td}>{f(gruhkar)}</td><td className={td}>{f(D.gruhkar[0])}</td><td className={td}>{f(D.gruhkar[1])}</td><td className={td}>{f(ekGruhkar)}</td>
            <td className={td} rowSpan={5} />
            <td className={td}>गृहकर व भूमीकर</td>
            {vasuliBlanks('r1')}
          </tr>
          <tr>
            <td className={td} rowSpan={3} colSpan={4}>{s(n.patta_nagar_layout_society)}</td>
            <td className={td}>दिवाबत्ती/वीज कर</td>
            <td className={td}>{f(M.viz)}</td><td className={td}>{f(viz)}</td><td className={td}>{f(D.viz[0])}</td><td className={td}>{f(D.viz[1])}</td><td className={td}>{f(ekViz)}</td>
            <td className={td}>दिवाबत्ती/वीज कर</td>
            {vasuliBlanks('r2')}
          </tr>
          <tr>
            <td className={td}>आरोग्य रक्षण कर</td>
            <td className={td}>{f(M.aarogya)}</td><td className={td}>{f(aarogya)}</td><td className={td}>{f(D.aarogya[0])}</td><td className={td}>{f(D.aarogya[1])}</td><td className={td}>{f(ekAarogya)}</td>
            <td className={td}>आरोग्य रक्षण कर</td>
            {vasuliBlanks('r3')}
          </tr>
          <tr>
            <td className={td}>सफाई कर</td>
            <td className={td}>{f(M.safai)}</td><td className={td}>{f(safai)}</td><td className={td}>{f(D.safai[0])}</td><td className={td}>{f(D.safai[1])}</td><td className={td}>{f(ekSafai)}</td>
            <td className={td}>सफाई कर</td>
            {vasuliBlanks('r4')}
          </tr>
          <tr className="font-bold">
            <td className={td}>भोगवटदाराचे नाव</td>
            <td className={td} colSpan={4}>मिलकत प्रकार</td>
            <td className={td}>एकूण</td>
            <td className={td}>{f(mSubtotal4)}</td><td className={td}>{f(subtotal4)}</td><td className={td} /><td className={td} /><td className={td}>{f(ekSubtotal4)}</td>
            <td className={td}>एकूण</td>
            {vasuliBlanks('r7')}
          </tr>
          <tr>
            <td className={td} rowSpan={5}>{s(n.bhogavat_darache_nav)}</td>
            <td className={td} rowSpan={5} colSpan={4}>{s(n.milkat_prakar)}</td>
            <td className={td}>सामान्य पाणी कर</td>
            <td className={td}>{f(M.samanya)}</td><td className={td}>{f(samanya)}</td><td className={td}>{f(D.samanya[0])}</td><td className={td}>{f(D.samanya[1])}</td><td className={td}>{f(ekSamanya)}</td>
            <td className={td} rowSpan={5} />
            <td className={td}>सामान्य पाणी कर</td>
            {vasuliBlanks('r8')}
          </tr>
          <tr>
            <td className={td}>विशेष पाणी कर</td>
            <td className={td}>{f(M.vishesh)}</td><td className={td}>{f(vishesh)}</td><td className={td}>{f(D.vishesh[0])}</td><td className={td}>{f(D.vishesh[1])}</td><td className={td}>{f(ekVishesh)}</td>
            <td className={td}>विशेष पाणी कर</td>
            {vasuliBlanks('r9')}
          </tr>
          <tr>
            <td className={td}>इत्तर फी</td>
            <td className={td}>{f(M.etar)}</td><td className={td}>{f(etar)}</td><td className={td}>{f(D.etar[0])}</td><td className={td}>{f(D.etar[1])}</td><td className={td}>{f(ekEtar)}</td>
            <td className={td}>इत्तर फी</td>
            {vasuliBlanks('r10')}
          </tr>
          <tr>
            <td className={td}>नोटीस फी</td>
            <td className={td}>{f(M.notice)}</td><td className={td}>{f(notice)}</td><td className={td}>{f(D.notice[0])}</td><td className={td}>{f(D.notice[1])}</td><td className={td}>{f(ekNotice)}</td>
            <td className={td}>नोटीस फी</td>
            {vasuliBlanks('r11')}
          </tr>
          <tr className="font-bold">
            <td className={td}>एकूण मागणी</td>
            <td className={td}>{f(mTotalAll)}</td><td className={td}>{f(totalAll)}</td><td className={td} /><td className={td} /><td className={td}>{f(ekTotalAll)}</td>
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
        const res = await nodniService.getDharkachiYadi(params.ward, params.start, params.end, '', params.year);
        if (res.success) setRecords((res.data as Row[]) || []);
      } catch (e) {
        console.error('Failed to load namuna-9 multi', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="n9m-report bg-white text-black p-4" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .n9m-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 22mm 4mm 8mm 14mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .n9m-report { zoom: 0.85; padding: 0 !important; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .n9m-wrap { overflow: visible !important; display: flex; flex-direction: column; align-items: center; }
          .n9m-zoom { zoom: 1 !important; }
          .n9m-page { page-break-after: always; }
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
            records.map((n, i) => <RecordBlock key={i} n={n} loc={loc} cy={reportYear} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Namuna9MultiReport;

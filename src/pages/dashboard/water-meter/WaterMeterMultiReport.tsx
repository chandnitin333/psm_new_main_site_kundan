import { useEffect, useState } from 'react';
import { waterMeterService, WATER_MONTHS, type WaterMeter, type WaterReading } from '../../../services';
import { trackAction } from '../../../utils/tracker';
import BillDoc, { billTotals } from './BillDoc';

/* पाणी मीटर बहु-अहवाल — GP मधील सर्व (किंवा वॉर्ड/वर्ष/महिना filter) मीटरचे
   रीडिंग रजिस्टर व/किंवा मागणी बिल एकाच printable document मध्ये.
   Params sessionStorage 'waterMeterReportParams' मधून (launcher वरून). */

interface Params { year: number; ward: string; fromSeq: number; toSeq: number; mode: 'register' | 'bill' | 'both'; }

const gpHeader = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      gp: u.gat_gram_panchayat || u.gram_panchayat || u.gram_panchayat_name || '',
      samiti: u.taluka || u.taluka_name || '',
      district: u.district || u.district_name || '',
    };
  } catch { return { gp: '', samiti: '', district: '' }; }
};

const d2 = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? String(Math.round(n)) : String(v);
};

const td = 'border border-black px-1 py-0.5 text-[11px] text-center';

/** read-only रीडिंग रजिस्टर (एका मीटरचे, निवडलेल्या वर्षाचे) */
const RegisterTable = ({ meter, year, H }: { meter: WaterMeter; year: number; H: { gp: string; samiti: string; district: string } }) => {
  const byMonth = (seq: number) => (meter.readings || []).find((r) => r.month_seq === seq && r.year === year);
  return (
    <div className="wm-block">
      <div className="text-center">
        <p className="text-[20px] font-bold">गट ग्रामपंचायत कार्यालय {H.gp}</p>
        {meter.water_supply_name && <p className="text-[14px] font-semibold">पाणी पुरवठा {meter.water_supply_name}</p>}
        <p className="text-[13px]">पंचायत समिती: {H.samiti} · जिल्हा: {H.district} · मिटर रिडिंग रजिस्टर सन {year}-{year + 1}</p>
      </div>
      <div className="mt-1 border border-black text-[11px]">
        <div className="grid grid-cols-6">
          {[['अनु क्र.', meter.anu_kramank], ['मालमत्ता क्र', meter.malmatta_number], ['वार्ड क्र', meter.ward], ['प्लॉट क्र', meter.plot_number], ['मिटर क्र', meter.meter_number], ['मोबाईल क्र', meter.mobile]].map(([l, v], i) => (
            <div key={i} className={`px-1.5 py-0.5 ${i < 5 ? 'border-r border-black' : ''}`}>
              <div className="whitespace-nowrap text-[10px] text-gray-700">{l as string}</div>
              <div className="font-bold">{(v as string) || '-'}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 border-t border-black">
          <div className="border-r border-black px-1.5 py-0.5"><span className="text-gray-700">खातेदार: </span><b>{meter.khatedar_name || '-'}</b></div>
          <div className="px-1.5 py-0.5"><span className="text-gray-700">भोगवटदार: </span><b>{meter.bhogwatdar_name || '-'}</b></div>
        </div>
        <div className="border-t border-black px-1.5 py-0.5"><span className="text-gray-700">पत्ता: </span><b>{meter.address || '-'}</b></div>
      </div>
      <table className="mt-1 w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-gray-100 font-bold">
            <th rowSpan={2} className={td}>महिना</th>
            <th colSpan={4} className={td}>रीडिंग</th>
            <th colSpan={4} className={td}>आकारणी / रक्कम</th>
            <th colSpan={3} className={td}>भरणा</th>
          </tr>
          <tr className="bg-gray-100 font-bold">
            {['चालु', 'मागील', 'एकूण', 'दर', 'चालु आकारणी', 'थकीत', 'विलंब', 'एकूण', 'पावती', 'दिनांक', 'भरणा'].map((h, i) => (
              <th key={i} className={td}>{h}</th>))}
          </tr>
        </thead>
        <tbody>
          {WATER_MONTHS.map((mn, i) => {
            const r = byMonth(i + 1) || ({} as WaterReading);
            return (
              <tr key={i}>
                <td className={`${td} whitespace-nowrap`}>{mn}</td>
                <td className={td}>{r.current_reading || ''}</td>
                <td className={td}>{r.previous_reading || ''}</td>
                <td className={td}>{r.ekun_reading ?? ''}</td>
                <td className={td}>{r.rate ?? ''}</td>
                <td className={td}>{d2(r.current_charge)}</td>
                <td className={td}>{d2(r.arrears)}</td>
                <td className={td}>{d2(r.late_fee)}</td>
                <td className={`${td} font-bold`}>{d2(r.total)}</td>
                <td className={td}>{r.receipt_no || ''}</td>
                <td className={td}>{r.receipt_date ? String(r.receipt_date).slice(0, 10) : ''}</td>
                <td className={td}>{r.paid_amount ?? ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const WaterMeterMultiReport = () => {
  const [meters, setMeters] = useState<WaterMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<Params>({ year: new Date().getFullYear(), ward: '', fromSeq: 1, toSeq: 12, mode: 'both' });
  const H = gpHeader();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.title = 'पाणी मीटर अहवाल';
    let params: Partial<Params> = {};
    try { params = JSON.parse(sessionStorage.getItem('waterMeterReportParams') || '{}'); } catch { params = {}; }
    const merged: Params = {
      year: Number(params.year) || new Date().getFullYear(),
      ward: params.ward || '',
      fromSeq: Number(params.fromSeq) || 1,
      toSeq: Number(params.toSeq) || 12,
      mode: (params.mode as Params['mode']) || 'both',
    };
    setP(merged);
    (async () => {
      try {
        const res = await waterMeterService.report({ year: merged.year, ward: merged.ward || undefined });
        const data = res?.success && Array.isArray(res.data) ? (res.data as WaterMeter[]) : [];
        setMeters(data);
        trackAction(`पाणी मीटर अहवाल — ${data.length} मीटर`, { page: '/water-meter-report', year: merged.year, ward: merged.ward, mode: merged.mode });
      } catch (e) { console.error('water meter report load failed', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const bill = (m: WaterMeter) => {
    const t = billTotals(m.readings || [], { year: p.year, fromSeq: p.fromSeq, toSeq: p.toSeq });
    const b = m.bill;
    const meta = {
      fromSeq: p.fromSeq, toSeq: p.toSeq,
      dueDate: b?.due_date ? String(b.due_date).slice(0, 10) : '',
      center: b?.center || '', centerAddr: b?.center_addr || '',
      prevReceipt: b?.prev_receipt || '', prevDate: b?.prev_date ? String(b.prev_date).slice(0, 10) : '',
      magilMonth: b?.magil_month || '', notes: b?.notes || '',
    };
    return { t, meta };
  };

  return (
    <div className="wm-report bg-white p-4 text-black" style={{ colorScheme: 'light' }}>
      <style>{`
        html, body { background: #fff !important; }
        .wm-report { min-height: 100vh; background: #fff; }
        @media print {
          @page { size: A4 landscape; margin: 18mm 6mm 8mm 18mm; } /* top+left binding space */
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .wm-report { padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .wm-block { page-break-inside: avoid; break-inside: avoid; }
          .wm-page { page-break-after: always; padding-top: 4mm; }
          .wm-page:last-child { page-break-after: auto; }
          .wm-report table, .wm-report th, .wm-report td { border-collapse: collapse; }
          .wm-report th, .wm-report td { border: 1px solid #000 !important; font-size: 15px !important; line-height: 1.25 !important; }
        }`}</style>

      <div className="no-print mb-4 flex items-center gap-3">
        <button onClick={() => window.print()} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">🖨️ Print / Save as PDF</button>
        <span className="text-sm text-gray-600">वर्ष {p.year}-{p.year + 1} · {p.ward ? `वॉर्ड ${p.ward}` : 'सर्व वॉर्ड'} · {p.mode === 'both' ? 'रजिस्टर + बिल' : p.mode === 'register' ? 'रजिस्टर' : 'बिल'} · {meters.length} मीटर</span>
      </div>

      {loading ? (
        <p className="py-16 text-center text-gray-500">लोड होत आहे...</p>
      ) : meters.length === 0 ? (
        <p className="py-16 text-center text-gray-500">या निवडीसाठी मीटर आढळले नाहीत</p>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {meters.map((m) => {
            const { t, meta } = bill(m);
            return (
              <div key={m.id} className="wm-page space-y-3">
                {(p.mode === 'register' || p.mode === 'both') && <RegisterTable meter={m} year={p.year} H={H} />}
                {(p.mode === 'bill' || p.mode === 'both') && (
                  <div className="wm-block bill-print">
                    <BillDoc H={H} meter={m} bill={meta} year={p.year} periodFrom={t.periodFrom} periodTo={t.periodTo}
                      billRows={t.billRows} paaniDeyak={t.paaniDeyak} magilThak={t.magilThak} ekunDeyak={t.ekunDeyak}
                      vilamb={t.vilamb} deyNantar={t.deyNantar} totalPaid={t.totalPaid} netDue={t.netDue}
                      qrUrl={`${window.location.origin}/water-meter/${m.id}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaterMeterMultiReport;

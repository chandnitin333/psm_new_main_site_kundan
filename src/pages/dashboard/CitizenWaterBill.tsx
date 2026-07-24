import { useState, useEffect } from 'react';
import { Droplet, IndianRupee } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { waterMeterService, type WaterMeter } from '../../services';
import { billTotals } from './water-meter/BillDoc';

const money = (v: number) => `₹ ${Math.round(v).toLocaleString('en-IN')}`;

const CitizenWaterBill = () => {
  const { toast, ToastContainer } = useToast();
  const [meters, setMeters] = useState<WaterMeter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'पाणी बिल / Water Bill';
    (async () => {
      try {
        const res = await waterMeterService.myMeters();
        setMeters(res?.success && Array.isArray(res.data) ? res.data : []);
      } catch { setMeters([]); toast.error('माहिती लोड करताना त्रुटी'); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ToastContainer />
      <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              <Droplet className="h-7 w-7 text-primary-600" /> पाणी बिल / Water Bill
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">तुमच्या पाणी मीटरचे रीडिंग व देयक / Your water meter readings & bill</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>
          ) : meters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-600 dark:bg-gray-800">
              <Droplet className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">कोणतेही पाणी मीटर आढळले नाही</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No water meter linked to your mobile.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {meters.map((m) => {
                // latest वर्ष निवडा (readings मध्ये असलेले सर्वात मोठे year)
                const yrs = (m.readings || []).map((r) => Number(r.year)).filter((y) => !Number.isNaN(y));
                const year = yrs.length ? Math.max(...yrs) : new Date().getFullYear();
                // carryover model — बेरीज नाही; शेवटच्या भरलेल्या महिन्याची थकबाकी = खरी देय रक्कम
                const t = billTotals(m.readings || [], { year, fromSeq: 1, toSeq: 12 });
                const rows = t.billRows;
                return (
                  <div key={m.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="bg-primary-600 px-5 py-4 text-white">
                      <p className="text-sm font-medium text-white/85">पाणी मीटर बिल {m.water_supply_name ? `· ${m.water_supply_name}` : ''} · सन {year}-{year + 1}</p>
                      <h2 className="mt-1 text-lg font-bold">{m.khatedar_name}</h2>
                      <p className="text-xs text-white/80">मीटर क्र.: {m.meter_number || '-'} · वॉर्ड: {m.ward || '-'} · मालमत्ता: {m.malmatta_number || '-'}</p>
                    </div>

                    <div className="overflow-x-auto px-5 py-4">
                      <table className="min-w-[720px] w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-600 dark:text-gray-400">
                            {['महिना', 'चालु', 'मागील', 'एकूण', 'दर', 'चालु आकारणी', 'थकीत', 'विलंब', 'एकूण', 'भरणा', 'पावती क्र', 'दिनांक', 'थकबाकी'].map((h) => (
                              <th key={h} className="py-2 pr-3 font-semibold whitespace-nowrap">{h}</th>))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr><td colSpan={13} className="py-4 text-center text-gray-400">रीडिंग उपलब्ध नाही</td></tr>
                          ) : rows.map((r) => (
                            <tr key={r.id} className="border-b border-gray-100 text-gray-800 dark:border-gray-700 dark:text-gray-200">
                              <td className="py-1.5 pr-3 whitespace-nowrap">{r.month_name}</td>
                              <td className="py-1.5 pr-3">{r.current_reading || '-'}</td>
                              <td className="py-1.5 pr-3">{r.previous_reading || '-'}</td>
                              <td className="py-1.5 pr-3">{r.ekun_reading ?? '-'}</td>
                              <td className="py-1.5 pr-3">{r.rate ?? '-'}</td>
                              <td className="py-1.5 pr-3">{r.current_charge ?? '-'}</td>
                              <td className="py-1.5 pr-3">{r.arrears ?? '-'}</td>
                              <td className="py-1.5 pr-3">{r.late_fee ?? '-'}</td>
                              <td className="py-1.5 pr-3 font-semibold">{r.total ?? '-'}</td>
                              <td className="py-1.5 pr-3">{r.paid_amount ?? '-'}</td>
                              <td className="py-1.5 pr-3">{r.receipt_no || '-'}</td>
                              <td className="py-1.5 pr-3 whitespace-nowrap">{r.receipt_date ? String(r.receipt_date).slice(0, 10) : '-'}</td>
                              <td className="py-1.5 pr-3 font-semibold text-primary-700 dark:text-primary-300">{r.balance ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                      <div className="ml-auto max-w-xs space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">मागील थकबाकी</span><span className="font-medium">{money(t.magilThak)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">पाणी वापर देयक (चालू)</span><span className="font-medium">{money(t.paaniDeyak)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">विलंब शुल्क</span><span className="font-medium">{money(t.vilamb)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">एकुण मागणी</span><span className="font-medium">{money(t.ekunDeyak)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">वजा: भरणा झाले</span><span className="font-medium">− {money(t.totalPaid)}</span></div>
                        <div className="mt-2 flex items-center justify-between rounded-xl bg-primary-600 px-4 py-2.5 text-white">
                          <span className="flex items-center gap-1.5 text-sm font-semibold"><IndianRupee className="h-4 w-4" /> एकूण देय रक्कम</span>
                          <span className="text-lg font-bold">{money(t.netDue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CitizenWaterBill;

import { useState, useEffect } from 'react';
import { Receipt, IndianRupee, Wallet } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { nodniService } from '../../services';
import type { MalmattaRecord } from '../../interfaces/dashboard/malmatta-nodni/MalmattaNodni.types';

type Row = Record<string, unknown>;
type FullRecord = MalmattaRecord & Row & { sillak_joda?: Row; sillak_joda_prev?: Row };

const s = (v: unknown) => (v === null || v === undefined ? '-' : String(v));
const num = (v: unknown) => Number(v || 0);
const money = (v: number) => `₹ ${Math.round(v).toLocaleString('en-IN')}`;

type TaxRow = { label: string; thak: number; chalu: number; vadh: number; sut: number; ekun: number };

/* Same computation as the कराची मागणी पावती १२९(१) report:
   थकबाकी (मागील वर्ष) + चालू + ५% दंड − ५% सूट = एकूण */
const computeRows = (n: FullRecord): { rows: TaxRow[]; tot: TaxRow } => {
  const sj = (n.sillak_joda as Row) || {};
  const sp = (n.sillak_joda_prev as Row) || {};
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

const CitizenBill = () => {
  const { toast, ToastContainer } = useToast();
  const [records, setRecords] = useState<FullRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loc] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        district: u.district || u.district_name || '',
        taluka: u.taluka || u.taluka_name || '',
        gramPanchayat: u.gram_panchayat || u.gram_panchayat_name || '',
      };
    } catch { return { district: '', taluka: '', gramPanchayat: '' }; }
  });

  useEffect(() => {
    document.title = 'कर बिल / Tax Bill';
    (async () => {
      try {
        const res = await nodniService.getMyProperties() as { success: boolean; data?: { records: MalmattaRecord[] } };
        const list = res?.success && res.data?.records ? res.data.records : [];
        const enriched = await Promise.all(list.map(async (base) => {
          let full: FullRecord = { ...(base as FullRecord) };
          try {
            const det = await nodniService.getById(base.id) as { success: boolean; data?: FullRecord };
            if (det?.success && det.data) full = { ...full, ...det.data };
          } catch { /* keep base */ }
          return full;
        }));
        setRecords(enriched);
      } catch {
        setRecords([]);
        toast.error('बिल माहिती मिळवण्यात अयशस्वी / Error loading bill');
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const billYear = (n: FullRecord): number => {
    const y = Number((n.sillak_joda as Row)?.year);
    if (Number.isFinite(y) && y > 2000) return y;
    return new Date().getFullYear();
  };

  return (
    <>
      <ToastContainer />
      <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">कर बिल / Tax Bill</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              कराच्या मागणीचे बिल — थकबाकी + चालू कर / Your property tax demand
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-600 dark:bg-gray-800">
              <Receipt className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">कोणतेही बिल आढळले नाही</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No tax bill linked to your account.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {records.map((n) => {
                const { rows, tot } = computeRows(n);
                const cy = billYear(n);
                return (
                  <div key={n.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {/* Bill header */}
                    <div className="bg-primary-600 px-5 py-4 text-center text-white">
                      <p className="flex items-center justify-center gap-2 text-base font-bold sm:text-lg">
                        <Receipt className="h-5 w-5" /> कराची मागणी पावती
                      </p>
                      <p className="text-sm font-semibold">सन {cy} - {cy + 1}</p>
                      <p className="text-[11px] text-white/80">मुंबई ग्रा. प. कायदा १९५९ कलम १२९(१)</p>
                      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-white/90">
                        <span>ग्रामपंचायत: {loc.gramPanchayat || '-'}</span>
                        <span>तालुका: {loc.taluka || '-'}</span>
                        <span>जिल्हा: {loc.district || '-'}</span>
                      </div>
                    </div>

                    {/* Property / owner meta — responsive grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gray-100 px-5 py-4 text-sm dark:border-gray-700 sm:grid-cols-3">
                      {[
                        ['अनु क्र.', n.anu_kramank], ['मिळकत क्र.', n.malmatta_number], ['वॉर्ड क्र.', n.ward_kramnak],
                        ['खातेधारक', n.ghar_malkache_nav], ['भोगवटदार', n.bhogavat_darache_nav], ['पत्ता', n.patta_nagar_layout_society],
                      ].map(([label, val], i) => (
                        <div key={i} className={i >= 3 ? 'col-span-2 sm:col-span-1' : ''}>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">{label as string}</p>
                          <p className="break-words font-medium text-gray-900 dark:text-white">{s(val)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tax table — horizontally scrollable on small screens */}
                    <div className="overflow-x-auto px-5 py-4">
                      <table className="w-full min-w-[560px] border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
                            <th className="border border-gray-200 px-2 py-2 text-left font-semibold dark:border-gray-600">करांचे नाव</th>
                            <th className="border border-gray-200 px-2 py-2 text-right font-semibold dark:border-gray-600">थकबाकी</th>
                            <th className="border border-gray-200 px-2 py-2 text-right font-semibold dark:border-gray-600">चालू</th>
                            <th className="border border-gray-200 px-2 py-2 text-right font-semibold dark:border-gray-600">५% दंड</th>
                            <th className="border border-gray-200 px-2 py-2 text-right font-semibold dark:border-gray-600">५% सूट</th>
                            <th className="border border-gray-200 px-2 py-2 text-right font-semibold dark:border-gray-600">एकूण</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.label} className="text-gray-800 dark:text-gray-200">
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700">{r.label}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-right dark:border-gray-700">{r.thak}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-right dark:border-gray-700">{r.chalu}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-right dark:border-gray-700">{r.vadh}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-right dark:border-gray-700">{r.sut}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-right font-semibold dark:border-gray-700">{r.ekun}</td>
                            </tr>
                          ))}
                          <tr className="bg-primary-50 font-bold text-gray-900 dark:bg-primary-900/20 dark:text-white">
                            <td className="border border-gray-200 px-2 py-2 dark:border-gray-600">{tot.label}</td>
                            <td className="border border-gray-200 px-2 py-2 text-right dark:border-gray-600">{tot.thak}</td>
                            <td className="border border-gray-200 px-2 py-2 text-right dark:border-gray-600">{tot.chalu}</td>
                            <td className="border border-gray-200 px-2 py-2 text-right dark:border-gray-600">{tot.vadh}</td>
                            <td className="border border-gray-200 px-2 py-2 text-right dark:border-gray-600">{tot.sut}</td>
                            <td className="border border-gray-200 px-2 py-2 text-right dark:border-gray-600">{tot.ekun}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Total payable + Pay */}
                    <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                      <div className="flex items-center justify-between rounded-xl bg-primary-600 px-4 py-3 text-white">
                        <span className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                          <IndianRupee className="h-4 w-4" /> एकूण देय / Total Payable
                        </span>
                        <span className="text-lg font-bold sm:text-xl">{money(tot.ekun)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toast.success('ऑनलाईन भरणा लवकरच उपलब्ध होईल / Online payment coming soon')}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        <Wallet className="h-5 w-5" /> भरणा करा / Pay Now
                      </button>
                      <p className="mt-2 text-center text-[11px] text-gray-400">ऑनलाईन भरणा सुविधा लवकरच / Online payment coming soon</p>
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

export default CitizenBill;

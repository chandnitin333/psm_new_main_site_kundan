import { useEffect, useMemo, useState } from 'react';
import { FileBarChart, AlertTriangle } from 'lucide-react';
import { vasuliService } from '../../../services';
import type { Ghosvara, GhosvaraRow } from '../../../services/vasuliService';
import { fyLabel, fyOfDate } from '../../../utils/fyConfig';
import { canModule } from '../../../utils/permissions';
import YearPicker from '../../../components/common/YearPicker';
import { ExportButtons, type ExportColumn } from '../../../components/common';

/* घोषवारा — ward-wise consolidated कर मागणी/वसुली/थकबाकी + GP total (एक-पान overview).
   permission: ahval_ghosvara (view + export). super_user / full-access ला सर्व. */

const inr = (n: number) => '₹ ' + Math.round(n || 0).toLocaleString('en-IN');

const GhosvaraReport = () => {
  const allowed = canModule('ahval_ghosvara');
  const [year, setYear] = useState<number>(fyOfDate());
  const [data, setData] = useState<Ghosvara | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'घोषवारा';
    if (!allowed) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await vasuliService.getGhosvara(String(year));
        if (!cancel) setData(res?.success ? (res.data as Ghosvara) : null);
      } catch { if (!cancel) setData(null); }
      finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [year, allowed]);

  const wards = data?.wards || [];
  const total = data?.total;

  // export rows = wards + a एकूण row
  const exportRows: (GhosvaraRow & { _total?: boolean })[] = useMemo(
    () => (total ? [...wards, { ...total, ward: 'एकूण', _total: true }] : wards),
    [wards, total],
  );
  const cols: ExportColumn<GhosvaraRow>[] = [
    { header: 'प्रभाग', value: (r) => r.ward, width: 10 },
    { header: 'मालमत्ता', value: (r) => r.properties, width: 10 },
    { header: 'मागणी (₹)', value: (r) => Math.round(r.demand), width: 14 },
    { header: 'वसुली (₹)', value: (r) => Math.round(r.collected), width: 14 },
    { header: 'थकबाकी (₹)', value: (r) => Math.round(r.outstanding), width: 14 },
    { header: 'वसुली %', value: (r) => `${r.recovery_pct}%`, width: 10 },
  ];

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div><AlertTriangle className="mx-auto h-10 w-10 text-amber-500" /><p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">या पानाची परवानगी नाही</p></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <FileBarChart className="h-6 w-6 text-primary-600" /> घोषवारा
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">प्रभागनिहाय कर मागणी · वसुली · थकबाकी — सन {fyLabel(year)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-36"><YearPicker value={String(year)} onChange={(v) => v && setYear(Number(v))} placeholder="वर्ष" /></div>
          <ExportButtons moduleKey="ahval_ghosvara" columns={cols} rows={exportRows} filename={`ghosvara-${year}`} title="घोषवारा" subtitle={`सन ${fyLabel(year)}`} landscape />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>
      ) : wards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-600 dark:bg-gray-800">
          <FileBarChart className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">या वर्षासाठी वसुली माहिती नाही</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                <th className="px-3 py-2.5 font-semibold">प्रभाग</th>
                <th className="px-3 py-2.5 text-right font-semibold">मालमत्ता</th>
                <th className="px-3 py-2.5 text-right font-semibold">मागणी</th>
                <th className="px-3 py-2.5 text-right font-semibold">वसुली</th>
                <th className="px-3 py-2.5 text-right font-semibold">थकबाकी</th>
                <th className="px-3 py-2.5 text-right font-semibold">वसुली %</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((r) => (
                <tr key={r.ward} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-700/60 dark:hover:bg-gray-700/30">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">प्रभाग {r.ward}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{r.properties}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{inr(r.demand)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{inr(r.collected)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-rose-600 dark:text-rose-400">{inr(r.outstanding)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-blue-600 dark:text-blue-400">{r.recovery_pct}%</td>
                </tr>
              ))}
            </tbody>
            {total && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold text-gray-900 dark:border-gray-600 dark:bg-gray-900/40 dark:text-white">
                  <td className="px-3 py-2.5">एकूण</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{total.properties}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{inr(total.demand)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300">{inr(total.collected)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-rose-700 dark:text-rose-300">{inr(total.outstanding)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-blue-700 dark:text-blue-300">{total.recovery_pct}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default GhosvaraReport;

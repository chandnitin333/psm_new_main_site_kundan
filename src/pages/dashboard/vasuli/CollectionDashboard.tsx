import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Wallet, Percent, Building2, TrendingUp, AlertTriangle, Phone } from 'lucide-react';
import { vasuliService } from '../../../services';
import type { DashboardKpis, Defaulter } from '../../../services/vasuliService';
import { fyLabel, fyOfDate } from '../../../utils/fyConfig';
import { canModule } from '../../../utils/permissions';
import YearPicker from '../../../components/common/YearPicker';
import { ExportButtons, type ExportColumn } from '../../../components/common';

/* वसुली डॅशबोर्ड / थकबाकी — मागणी वि. वसूल वि. थकबाकी, वॉर्ड-निहाय बाकी, व सर्वात जास्त
   थकबाकी असलेल्या मालमत्ता (top defaulters). GP-scoped (super_user निवडलेली GP पाहतो).
   permission: collection_dashboard.view (full-access / super_user ला नेहमी). */

const inr = (n: number) => '₹ ' + Math.round(n || 0).toLocaleString('en-IN');
const inrShort = (n: number) => {
  const a = Math.abs(n || 0);
  if (a >= 1e7) return `₹ ${(n / 1e7).toFixed(2)} कोटी`;
  if (a >= 1e5) return `₹ ${(n / 1e5).toFixed(2)} लाख`;
  if (a >= 1e3) return `₹ ${(n / 1e3).toFixed(1)} हजार`;
  return inr(n);
};

const CollectionDashboard = () => {
  const navigate = useNavigate();
  const allowed = canModule('collection_dashboard');
  const [year, setYear] = useState<number>(fyOfDate());
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const [k, d] = await Promise.all([
          vasuliService.getKpis(String(year)),
          vasuliService.getDefaulters(String(year), 50),
        ]);
        if (cancel) return;
        setKpis(k?.success ? (k.data as DashboardKpis) : null);
        setDefaulters(d?.success && Array.isArray(d.data?.defaulters) ? d.data!.defaulters : []);
      } catch {
        if (!cancel) { setKpis(null); setDefaulters([]); }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [year, allowed]);

  const maxWardBaki = useMemo(
    () => Math.max(1, ...(kpis?.ward_outstanding || []).map((w) => w.baki)),
    [kpis],
  );

  const defaulterCols: ExportColumn<Defaulter>[] = useMemo(() => [
    { header: 'खातेदार', value: (d) => d.name || '', width: 28 },
    { header: 'मोबाईल', value: (d) => d.mobile || '', width: 14 },
    { header: 'वॉर्ड', value: (d) => d.ward || '', width: 10 },
    { header: 'अनु क्रमांक', value: (d) => d.anu_kramank || '', width: 12 },
    { header: 'थकबाकी (₹)', value: (d) => Math.round(d.baki || 0), width: 14 },
  ], []);

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div>
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">या पानाची परवानगी नाही</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You don't have access to the Collection Dashboard.</p>
        </div>
      </div>
    );
  }

  const cards = kpis ? [
    { label: 'एकूण मागणी', sub: 'Demand', value: inrShort(kpis.demand), Icon: TrendingUp, ring: 'text-indigo-600 dark:text-indigo-400', chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' },
    { label: 'एकूण वसुली', sub: 'Collected', value: inrShort(kpis.collected), Icon: IndianRupee, ring: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    { label: 'एकूण थकबाकी', sub: 'Outstanding', value: inrShort(kpis.outstanding), Icon: Wallet, ring: 'text-rose-600 dark:text-rose-400', chip: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
    { label: 'वसुली टक्केवारी', sub: 'Recovery', value: `${kpis.recovery_pct}%`, Icon: Percent, ring: 'text-blue-600 dark:text-blue-400', chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
    { label: 'एकूण मालमत्ता', sub: 'Properties', value: String(kpis.properties_total), Icon: Building2, ring: 'text-amber-600 dark:text-amber-400', chip: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
  ] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* header + year */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <TrendingUp className="h-6 w-6 text-primary-600" /> वसुली डॅशबोर्ड
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">कर मागणी · वसुली · थकबाकी — सन {fyLabel(year)}</p>
        </div>
        <div className="w-40">
          <YearPicker value={String(year)} onChange={(v) => v && setYear(Number(v))} placeholder="वर्ष निवडा" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className={`rounded-lg p-2 ${c.chip}`}><c.Icon className="h-5 w-5" /></span>
                </div>
                <p className={`mt-3 text-xl font-extrabold ${c.ring}`}>{c.value}</p>
                <p className="mt-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200">{c.label}</p>
                <p className="text-[11px] text-gray-400">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* ward-wise outstanding */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-100">वॉर्ड-निहाय थकबाकी (Ward-wise Outstanding)</h2>
              {(kpis?.ward_outstanding || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">या वर्षासाठी थकबाकी नाही</p>
              ) : (
                <div className="space-y-2.5">
                  {kpis!.ward_outstanding.map((w) => (
                    <div key={w.ward} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300">वॉर्ड {w.ward}</span>
                      <div className="h-5 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-700">
                        <div className="h-full rounded bg-rose-400 dark:bg-rose-500" style={{ width: `${Math.max(4, (w.baki / maxWardBaki) * 100)}%` }} />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400">{inr(w.baki)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* top defaulters */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> सर्वाधिक थकबाकी (Top Defaulters)
                </h2>
                <ExportButtons
                  moduleKey="collection_dashboard"
                  columns={defaulterCols}
                  rows={defaulters}
                  filename={`thakbaki-${year}`}
                  title="सर्वाधिक थकबाकीदार मालमत्ता"
                  subtitle={`सन ${fyLabel(year)}`}
                />
              </div>
              {defaulters.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">या वर्षासाठी थकबाकीदार नाहीत</p>
              ) : (
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white text-left text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 pr-2 font-semibold">खातेदार</th>
                        <th className="py-2 pr-2 font-semibold">वॉर्ड/अनु</th>
                        <th className="py-2 pr-2 text-right font-semibold">थकबाकी</th>
                        <th className="py-2 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {defaulters.map((d) => (
                        <tr key={d.nodni_id} className="border-b border-gray-100 text-gray-800 dark:border-gray-700/60 dark:text-gray-200">
                          <td className="py-1.5 pr-2">
                            <div className="font-medium">{d.name}</div>
                            {d.mobile && <div className="flex items-center gap-1 text-[11px] text-gray-400"><Phone className="h-3 w-3" />{d.mobile}</div>}
                          </td>
                          <td className="py-1.5 pr-2 text-xs text-gray-500 dark:text-gray-400">{d.ward || '—'} / {d.anu_kramank || '—'}</td>
                          <td className="py-1.5 pr-2 text-right font-bold tabular-nums text-rose-600 dark:text-rose-400">{inr(d.baki)}</td>
                          <td className="py-1.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => navigate(`/property-ledger/${d.nodni_id}`)}
                                className="rounded border border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                खातेवही
                              </button>
                              <button onClick={() => navigate(`/vasuli?anu_kramank=${encodeURIComponent(d.anu_kramank || '')}&ward_number=${encodeURIComponent(d.ward || '')}`)}
                                className="rounded border border-primary-300 px-2 py-0.5 text-[11px] font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20">
                                वसुली
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CollectionDashboard;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookText, ArrowLeft, Printer, Loader2, AlertTriangle, Phone, Droplet, IndianRupee, Wallet, TrendingUp } from 'lucide-react';
import { vasuliService } from '../../../services';
import type { PropertyLedger as Ledger, LedgerYear } from '../../../services/vasuliService';
import { canModule, can } from '../../../utils/permissions';
import { fyLabel } from '../../../utils/fyConfig';
import { ExportButtons, type ExportColumn } from '../../../components/common';
import PropertyImages from '../../../components/PropertyImages';

/* मालमत्ता खातेवही — ek property ka consolidated kar-itihaas: saal-wise मागणी/वसुली/थकबाकी +
   payments + water. permission: vasuli. super_user / full-access ला सर्व. */

const inr = (n: number) => '₹ ' + Math.round(n || 0).toLocaleString('en-IN');
const fmtD = (v?: string | null) => { if (!v) return '-'; const m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10); };
const MODE: Record<string, string> = { cash: 'रोख', online: 'ऑनलाइन', cheque: 'धनादेश', upi: 'UPI' };

const PropertyLedger = () => {
  const { nodniId } = useParams();
  const navigate = useNavigate();
  const allowed = canModule('vasuli') || canModule('malmatta_nodni');
  const [data, setData] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'मालमत्ता खातेवही';
    if (!allowed || !nodniId) { setLoading(false); return; }
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await vasuliService.getLedger(Number(nodniId));
        if (!cancel) setData(res?.success ? (res.data as Ledger) : null);
      } catch { if (!cancel) setData(null); }
      finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [nodniId, allowed]);

  const yearCols: ExportColumn<LedgerYear>[] = [
    { header: 'सन', value: (r) => `${r.year}-${r.to_year || (Number(r.year) + 1)}`, width: 12 },
    { header: 'मागणी (₹)', value: (r) => r.demand, width: 12 },
    { header: 'वसुली (₹)', value: (r) => r.collected, width: 12 },
    { header: 'थकबाकी (₹)', value: (r) => r.outstanding, width: 12 },
  ];

  if (!allowed) {
    return <div className="flex min-h-[60vh] items-center justify-center px-4 text-center"><div><AlertTriangle className="mx-auto h-10 w-10 text-amber-500" /><p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">या पानाची परवानगी नाही</p></div></div>;
  }
  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-9 w-9 animate-spin text-primary-500" /></div>;
  if (!data) return <div className="py-20 text-center text-gray-500 dark:text-gray-400">माहिती आढळली नाही</div>;

  const p = data.property;
  const t = data.totals;

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 print:hidden"><ArrowLeft className="h-4 w-4" /> मागे</button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white"><BookText className="h-6 w-6 text-primary-600" /> मालमत्ता खातेवही</h1>
          <p className="mt-1 font-semibold text-gray-800 dark:text-gray-100">{p.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            मालमत्ता {p.malmatta_number || '—'} · प्रभाग {p.ward ?? '—'}
            {p.mobile ? <span className="ml-2 inline-flex items-center gap-1"><Phone className="h-3 w-3" />{p.mobile}</span> : null}
          </p>
          {p.address && <p className="text-xs text-gray-400">{p.address}</p>}
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <ExportButtons moduleKey="vasuli" columns={yearCols} rows={data.years} filename={`khatevahi-${p.malmatta_number || p.nodni_id}`} title={`मालमत्ता खातेवही — ${p.name}`} subtitle={`मालमत्ता ${p.malmatta_number || ''} · प्रभाग ${p.ward ?? ''}`} />
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200"><Printer className="h-3.5 w-3.5" /> प्रिंट</button>
        </div>
      </div>

      {/* totals */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'एकूण मागणी', v: t.demand, Icon: TrendingUp, cls: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'एकूण वसुली', v: t.collected, Icon: IndianRupee, cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'एकूण थकबाकी', v: t.outstanding, Icon: Wallet, cls: 'text-rose-600 dark:text-rose-400' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <c.Icon className={`h-5 w-5 ${c.cls}`} />
            <p className={`mt-2 text-lg font-extrabold ${c.cls}`}>{inr(c.v)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>

      {data.water && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm dark:border-sky-800 dark:bg-sky-900/15">
          <Droplet className="h-4 w-4 text-sky-600" />
          <span className="text-gray-700 dark:text-gray-200">पाणी मीटर <b>{data.water.meter_number || '—'}</b> · भरणा <b className="text-emerald-600 dark:text-emerald-400">{inr(data.water.total_paid)}</b> ({data.water.count} पावत्या)</span>
        </div>
      )}

      {/* year-wise table */}
      <h2 className="mt-5 mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">वर्षनिहाय कर</h2>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              <th className="px-3 py-2.5 font-semibold">सन</th>
              <th className="px-3 py-2.5 text-right font-semibold">मागणी</th>
              <th className="px-3 py-2.5 text-right font-semibold">वसुली</th>
              <th className="px-3 py-2.5 text-right font-semibold">थकबाकी</th>
            </tr>
          </thead>
          <tbody>
            {data.years.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">कर नोंद नाही</td></tr>
            ) : data.years.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">सन {fyLabel(Number(r.year))}</td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{inr(r.demand)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{inr(r.collected)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-rose-600 dark:text-rose-400">{inr(r.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* payments */}
      <h2 className="mt-5 mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">भरणा इतिहास</h2>
      {data.payments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white py-8 text-center text-sm text-gray-400 dark:border-gray-600 dark:bg-gray-800">कोणतेही भरणे नाहीत</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.payments.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{inr(Number(pm.amount || 0))}</span>
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">{MODE[String(pm.payment_type || '').toLowerCase()] || pm.payment_type || '—'}</span>
                </div>
                <span className="text-[11px] text-gray-400">दि. {fmtD(pm.paid_at)}{pm.ghar_pavti_no ? ` · पावती ${pm.ghar_pavti_no}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* मालमत्ता फोटो gallery */}
      <div className="mt-5">
        <PropertyImages nodniId={p.nodni_id} canManage={can('malmatta_nodni', 'image_upload')} />
      </div>
    </div>
  );
};

export default PropertyLedger;

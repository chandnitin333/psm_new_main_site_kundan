import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Wallet, Receipt, Droplet, Home } from 'lucide-react';
import { DatePicker } from '../../../components/common';
import { vasuliService, type Daybook } from '../../../services/vasuliService';
import { useToast } from '../../../hooks/useToast';

/* दैनिक वसुली रजिस्टर — collection day-book / cashbook.
   Pick a date (or range) → all payments collected + totals by mode/head/collector. Printable. */
const inr = (n: number) => '₹ ' + Math.round(n).toLocaleString('en-IN');
const todayISO = () => new Date().toISOString().slice(0, 10);

const CollectionDaybook = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState<Daybook | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    try {
      const res = await vasuliService.getDaybook(f, t);
      if (res.success && res.data) setData(res.data as Daybook);
      else toast.error(res.message || 'रजिस्टर लोड करता आले नाही');
    } catch {
      toast.error('रजिस्टर लोड करताना त्रुटी');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(from, to); }, [from, to, load]);

  const modeLabel: Record<string, string> = {
    cash: 'रोख', online: 'ऑनलाइन', cheque: 'धनादेश', dd: 'डीडी', इतर: 'इतर',
  };

  const card = 'rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800';

  return (
    <div className="p-4 sm:p-6 print:p-0">
      <ToastContainer />

      {/* controls */}
      <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <button onClick={() => navigate('/vasuli')} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> वसुली
          </button>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">पासून (From)</label>
            <DatePicker value={from} onChange={setFrom} max={to || todayISO()} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">पर्यंत (To)</label>
            <DatePicker value={to} onChange={setTo} max={todayISO()} />
          </div>
          <button
            onClick={() => { const t = todayISO(); setFrom(t); setTo(t); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            आज (Today)
          </button>
        </div>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      {/* print title */}
      <div className="mb-4 hidden text-center print:block">
        <h1 className="text-xl font-bold">दैनिक वसुली रजिस्टर</h1>
        <p className="text-sm">{from === to ? from : `${from} ते ${to}`}</p>
      </div>

      {/* summary tiles */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className={card}>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Wallet className="h-5 w-5" /><span className="text-xs font-medium text-gray-500">एकूण वसुली</span></div>
          <div className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-white">{inr(data?.total || 0)}</div>
        </div>
        <div className={card}>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400"><Home className="h-5 w-5" /><span className="text-xs font-medium text-gray-500">घरकर</span></div>
          <div className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-white">{inr(data?.ghar_total || 0)}</div>
        </div>
        <div className={card}>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400"><Droplet className="h-5 w-5" /><span className="text-xs font-medium text-gray-500">पाणीपट्टी</span></div>
          <div className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-white">{inr(data?.pani_total || 0)}</div>
        </div>
        <div className={card}>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400"><Receipt className="h-5 w-5" /><span className="text-xs font-medium text-gray-500">एकूण पावत्या</span></div>
          <div className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-white">{data?.count || 0}</div>
        </div>
      </div>

      {/* by mode + by collector */}
      {data && (data.count > 0) && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={card}>
            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">पेमेंट प्रकारनिहाय</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.by_mode).map(([m, amt]) => (
                <span key={m} className="rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700">
                  {modeLabel[m] || m}: <b className="tabular-nums">{inr(amt)}</b>
                </span>
              ))}
            </div>
          </div>
          <div className={card}>
            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">वसुली करणारानिहाय</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.by_collector).map(([c, amt]) => (
                <span key={c} className="rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700">
                  {c}: <b className="tabular-nums">{inr(amt)}</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* payments table */}
      <div className={`${card} overflow-x-auto`}>
        {loading ? (
          <p className="py-10 text-center text-gray-400">लोड होत आहे...</p>
        ) : !data || data.count === 0 ? (
          <p className="py-10 text-center text-gray-400">या कालावधीत कोणतीही वसुली नाही</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-gray-700">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">वेळ</th>
                <th className="py-2 pr-2">पावती</th>
                <th className="py-2 pr-2">खातेदार</th>
                <th className="py-2 pr-2">वॉर्ड/अनु.</th>
                <th className="py-2 pr-2">प्रकार</th>
                <th className="py-2 pr-2 text-right">घरकर</th>
                <th className="py-2 pr-2 text-right">पाणी</th>
                <th className="py-2 pr-2 text-right">रक्कम</th>
                <th className="py-2 pr-2">वसुली</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/60">
                  <td className="py-2 pr-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 pr-2 whitespace-nowrap">{from === to ? p.time : `${p.date} ${p.time}`}</td>
                  <td className="py-2 pr-2">{p.pavti_no || '—'}</td>
                  <td className="py-2 pr-2 font-medium text-gray-800 dark:text-gray-100">{p.name}</td>
                  <td className="py-2 pr-2 whitespace-nowrap text-gray-500">{p.ward || '—'}/{p.anu_kramank || '—'}</td>
                  <td className="py-2 pr-2">{modeLabel[p.mode] || p.mode}{p.provider ? ` (${p.provider})` : ''}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{p.ghar_amount ? inr(p.ghar_amount) : '—'}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{p.pani_amount ? inr(p.pani_amount) : '—'}</td>
                  <td className="py-2 pr-2 text-right font-semibold tabular-nums">{inr(p.amount)}</td>
                  <td className="py-2 pr-2 text-gray-500">{p.collector}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-bold dark:border-gray-600">
                <td className="py-2 pr-2" colSpan={6}>एकूण ({data.count})</td>
                <td className="py-2 pr-2 text-right tabular-nums">{inr(data.ghar_total)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{inr(data.pani_total)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{inr(data.total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default CollectionDaybook;

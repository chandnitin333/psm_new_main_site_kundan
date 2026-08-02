import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Phone, CheckCircle2, IndianRupee, X } from 'lucide-react';
import { vasuliService, type WardCollection, type WardCollectionProperty } from '../../../services/vasuliService';
import { useToast } from '../../../hooks/useToast';

/* 📱 Mobile field-collection mode — pick a ward + year, see every property's बाकी,
   tap a pending one to record a quick payment (cash/online) right from the phone. */
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

const STATUS: Record<WardCollectionProperty['status'], { label: string; cls: string }> = {
  paid: { label: 'भरले', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  pending: { label: 'बाकी', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  not_billed: { label: 'बिल नाही', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

const CollectionMode = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const [ward, setWard] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [data, setData] = useState<WardCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<WardCollectionProperty | null>(null);

  const load = useCallback(async (w: string, y: string) => {
    if (!w.trim() || !y.trim()) { toast.error('वॉर्ड व वर्ष भरा'); return; }
    setLoading(true);
    try {
      const res = await vasuliService.getWardCollection(w.trim(), y.trim());
      if (res.success && res.data) setData(res.data as WardCollection);
      else toast.error(res.message || 'यादी लोड करता आली नाही');
    } catch {
      toast.error('यादी लोड करताना त्रुटी');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-xl p-4">
      <ToastContainer />

      <button onClick={() => navigate('/vasuli')} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> वसुली
      </button>

      <h1 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">📱 फिरती वसुली (Field Collection)</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">वॉर्ड व वर्ष निवडा — मालमत्तेसमोरच पावती नोंदवा.</p>

      {/* ward + year picker */}
      <form
        onSubmit={(e) => { e.preventDefault(); load(ward, year); }}
        className="mb-4 flex gap-2"
      >
        <input
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          placeholder="वॉर्ड क्र."
          className="w-28 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="वर्ष"
          inputMode="numeric"
          className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button type="submit" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
          <Search className="h-4 w-4" /> पहा
        </button>
      </form>

      {/* summary */}
      {data && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-gray-100 px-2 py-2 dark:bg-gray-800">
            <div className="text-lg font-bold tabular-nums text-gray-800 dark:text-gray-100">{data.total_properties}</div>
            <div className="text-[11px] text-gray-500">मालमत्ता</div>
          </div>
          <div className="rounded-lg bg-rose-50 px-2 py-2 dark:bg-rose-900/20">
            <div className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">{data.pending_count}</div>
            <div className="text-[11px] text-gray-500">बाकी ({inr(data.pending_baki)})</div>
          </div>
          <div className="rounded-lg bg-emerald-50 px-2 py-2 dark:bg-emerald-900/20">
            <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{inr(data.collected)}</div>
            <div className="text-[11px] text-gray-500">वसूल</div>
          </div>
        </div>
      )}

      {/* property list */}
      {loading ? (
        <p className="py-10 text-center text-gray-400">लोड होत आहे...</p>
      ) : data && data.properties.length === 0 ? (
        <p className="py-10 text-center text-gray-400">या वॉर्डमध्ये मालमत्ता नाही</p>
      ) : (
        <div className="space-y-2">
          {data?.properties.map((p) => {
            const st = STATUS[p.status];
            return (
              <button
                key={p.nodni_id}
                onClick={() => {
                  if (p.status === 'not_billed' || !p.vasuli_id) {
                    // no vasuli yet → open full form (deep-linked) to create it
                    navigate(`/vasuli?anu_kramank=${p.anu_kramank ?? ''}&ward_number=${p.ward ?? ''}`);
                  } else if (p.status === 'pending') {
                    setActive(p);
                  }
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/60"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-900 dark:text-white">{p.name}</div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                    अनु.क्र. {p.anu_kramank || '—'}{p.malmatta_number ? ` · मा.क्र. ${p.malmatta_number}` : ''}
                    {p.mobile ? <span className="ml-1 inline-flex items-center gap-0.5"><Phone className="inline h-3 w-3" />{p.mobile}</span> : null}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                  {p.status === 'pending' && <div className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">{inr(p.baki)}</div>}
                  {p.status === 'paid' && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* quick-pay bottom sheet */}
      {active && (
        <QuickPay
          prop={active}
          year={year}
          onClose={() => setActive(null)}
          onDone={() => { setActive(null); load(ward, year); }}
          toastError={(m) => toast.error(m)}
          toastOk={(m) => toast.success(m)}
        />
      )}
    </div>
  );
};

/* Bottom-sheet to record a payment against a property's vasuli for the year. */
const QuickPay = ({ prop, onClose, onDone, toastError, toastOk }: {
  prop: WardCollectionProperty;
  year: string;
  onClose: () => void;
  onDone: () => void;
  toastError: (m: string) => void;
  toastOk: (m: string) => void;
}) => {
  const [amount, setAmount] = useState(String(prop.baki));
  const [head, setHead] = useState<'ghar' | 'pani'>('ghar');
  const [mode, setMode] = useState<'cash' | 'online'>('cash');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toastError('रक्कम भरा'); return; }
    if (!prop.vasuli_id) { toastError('या मालमत्तेसाठी वसुली नोंद नाही'); return; }
    setSaving(true);
    try {
      // 1) record the payment entry
      const payRes = await vasuliService.addPayment(prop.vasuli_id, {
        payment_type: mode,
        nodni_id: prop.nodni_id,
        ghar_amount: head === 'ghar' ? amt : 0,
        pani_amount: head === 'pani' ? amt : 0,
        kar_prakar: head === 'ghar' ? 'gruhkar' : 'pani',
      });
      if (!payRes.success) { toastError(payRes.message || 'पेमेंट जतन झाले नाही'); setSaving(false); return; }
      // vasuli jama/sillak is now recomputed server-side from payments (add_vasuli_payment),
      // so no client-side snapshot patch is needed — and no stale read-modify-write race.
      toastOk('पावती नोंदवली ✓');
      onDone();
    } catch {
      toastError('जतन करताना त्रुटी');
    } finally {
      setSaving(false);
    }
  };

  const btn = (on: boolean) => `flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${on ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{prop.name}</h3>
            <p className="text-xs text-gray-500">अनु.क्र. {prop.anu_kramank} · बाकी {inr(prop.baki)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">रक्कम</label>
        <div className="relative mb-3">
          <IndianRupee className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-lg font-semibold focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">कर प्रकार</label>
        <div className="mb-3 flex gap-2">
          <button type="button" onClick={() => setHead('ghar')} className={btn(head === 'ghar')}>घरकर</button>
          <button type="button" onClick={() => setHead('pani')} className={btn(head === 'pani')}>पाणीपट्टी</button>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">पेमेंट प्रकार</label>
        <div className="mb-4 flex gap-2">
          <button type="button" onClick={() => setMode('cash')} className={btn(mode === 'cash')}>रोख (Cash)</button>
          <button type="button" onClick={() => setMode('online')} className={btn(mode === 'online')}>ऑनलाइन</button>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'जतन होत आहे...' : 'पावती नोंदवा (Collect)'}
        </button>
      </div>
    </div>
  );
};

export default CollectionMode;

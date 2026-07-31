import { useEffect, useState } from 'react';
import { Receipt, Download, Loader2, IndianRupee, Wallet, Building2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { vasuliService } from '../../services';
import type { MyPayment } from '../../services/vasuliService';
import { printTaxReceipt } from '../../utils/taxReceipt';

/* माझे भरणे — citizen apne saare tax bharNa (payments) dekhe + har ek ki पावती PDF download kare.
   Citizen-facing, direct (no permission). Data: vasuli_payment (own properties, mobile/aadhaar match). */

const inr = (n: number | null | undefined) => '₹ ' + Math.round(Number(n || 0)).toLocaleString('en-IN');
const fmtDate = (v: string | null | undefined) => {
  if (!v) return '—';
  const m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10);
};
const MODE_LABEL: Record<string, string> = { cash: 'रोख', online: 'ऑनलाइन', cheque: 'धनादेश', upi: 'UPI', card: 'कार्ड' };

const MyPayments = () => {
  const { toast, ToastContainer } = useToast();
  const [rows, setRows] = useState<MyPayment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'माझे भरणे';
    (async () => {
      setLoading(true);
      try {
        const res = await vasuliService.getMyPayments();
        if (res?.success && res.data) { setRows(res.data.payments || []); setTotalPaid(res.data.total_paid || 0); }
        else { setRows([]); setTotalPaid(0); }
      } catch { setRows([]); setTotalPaid(0); }
      finally { setLoading(false); }
    })();
  }, []);

  const download = (p: MyPayment) => {
    try { printTaxReceipt(p); } catch { toast.error('पावती तयार करता आली नाही'); }
  };

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Receipt className="h-6 w-6 text-primary-600" /> माझे भरणे
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">कर भरण्याचा इतिहास व पावती डाउनलोड (Payment history &amp; receipts)</p>

        {/* summary */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"><IndianRupee className="h-5 w-5" /></span>
            <p className="mt-2 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{inr(totalPaid)}</p>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">एकूण भरणा</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><Wallet className="h-5 w-5" /></span>
            <p className="mt-2 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{rows.length}</p>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">एकूण पावत्या</p>
          </div>
        </div>

        {/* list */}
        <div className="mt-5">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-600 dark:bg-gray-800">
              <Receipt className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">अद्याप कोणतेही भरणे आढळले नाहीत</p>
              <p className="mt-0.5 text-xs text-gray-400">तुमच्या मालमत्तेशी जोडलेली भरणे येथे दिसतील.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((p) => (
                <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{inr(p.amount)}</span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {MODE_LABEL[String(p.payment_type || '').toLowerCase()] || p.payment_type || '—'}
                        </span>
                        {p.year && <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">सन {p.year}-{p.to_year || Number(p.year) + 1}</span>}
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" /> मालमत्ता {p.malmatta_number || '—'} · प्रभाग {p.ward_number || '—'}
                      </p>
                      <p className="text-[11px] text-gray-400">दि. {fmtDate(p.paid_at)}{p.khatedharkache_nav ? ` · ${p.khatedharkache_nav}` : ''}</p>
                      {Number(p.sillak_ekun || 0) > 0 && (
                        <p className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">शिल्लक थकबाकी: {inr(p.sillak_ekun)}</p>
                      )}
                    </div>
                    <button onClick={() => download(p)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20">
                      <Download className="h-3.5 w-3.5" /> पावती
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyPayments;

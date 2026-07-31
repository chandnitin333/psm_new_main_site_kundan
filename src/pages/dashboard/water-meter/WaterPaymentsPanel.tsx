import { useEffect, useState, useCallback } from 'react';
import { IndianRupee, Plus, Trash2, Download, Loader2, Wallet } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { waterMeterService, type WaterMeter, type WaterPayment } from '../../../services';
import { printWaterReceipt } from '../../../utils/waterReceipt';

/* पाणी बिल भरणा panel — staff record payments against a meter + list + total/balance + पावती.
   Self-contained: fetches/records/deletes on its own. Shown in the meter's bill tab. */

interface Props {
  meterId: number;
  canEdit: boolean;
  suggestedAmount: number;         // current net due (prefill)
  year: number;
  meter: WaterMeter;
  gp: { gp: string; samiti: string; district: string };
}

const money = (v: number) => `₹ ${Math.round(Number(v || 0)).toLocaleString('en-IN')}`;
const fmtD = (v?: string | null) => { if (!v) return '-'; const m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10); };
const MODE: Record<string, string> = { cash: 'रोख', online: 'ऑनलाइन', cheque: 'धनादेश', upi: 'UPI' };
const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const WaterPaymentsPanel = ({ meterId, canEdit, suggestedAmount, year, meter, gp }: Props) => {
  const { toast, ToastContainer } = useToast();
  const [rows, setRows] = useState<WaterPayment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', payment_type: 'cash', receipt_no: '', paid_date: todayISO(), reference_no: '', remark: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await waterMeterService.listPayments(meterId);
      if (res?.success && res.data) { setRows(res.data.payments || []); setTotalPaid(res.data.total_paid || 0); }
      else { setRows([]); setTotalPaid(0); }
    } catch { setRows([]); setTotalPaid(0); }
    finally { setLoading(false); }
  }, [meterId]);

  useEffect(() => { load(); }, [load]);

  const openForm = () => { setForm((f) => ({ ...f, amount: suggestedAmount > 0 ? String(Math.round(suggestedAmount)) : '', paid_date: todayISO() })); setOpen(true); };

  const save = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { toast.error('रक्कम टाका'); return; }
    setBusy(true);
    try {
      const res = await waterMeterService.addPayment(meterId, {
        amount: amt, payment_type: form.payment_type, receipt_no: form.receipt_no.trim() || undefined,
        paid_date: form.paid_date || undefined, reference_no: form.reference_no.trim() || undefined,
        remark: form.remark.trim() || undefined, year,
      });
      if (res?.success) {
        toast.success('भरणा नोंदवला');
        setOpen(false);
        setForm({ amount: '', payment_type: 'cash', receipt_no: '', paid_date: todayISO(), reference_no: '', remark: '' });
        load();
      } else toast.error(res?.message || 'नोंदवता आले नाही');
    } catch (e) { toast.error((e as { message?: string })?.message || 'त्रुटी'); }
    finally { setBusy(false); }
  };

  const del = async (id: number) => {
    setBusy(true);
    try { const res = await waterMeterService.deletePayment(id); if (res?.success) { toast.success('हटवले'); load(); } }
    catch { toast.error('त्रुटी'); } finally { setBusy(false); }
  };

  const receipt = (p: WaterPayment) => printWaterReceipt({
    ...p,
    meter_number: meter.meter_number, khatedar_name: meter.khatedar_name, address: meter.address,
    ward: meter.ward, malmatta_number: meter.malmatta_number,
    gram_panchayat: gp.gp, taluka: gp.samiti, district: gp.district,
  });

  const balance = Math.max(0, Math.round(suggestedAmount) - Math.round(totalPaid));

  return (
    <div className="no-print mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <ToastContainer />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><Wallet className="h-4 w-4 text-primary-600" /> पाणी बिल भरणा</h3>
        {canEdit && (
          <button onClick={openForm} className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">
            <Plus className="h-3.5 w-3.5" /> भरणा नोंदवा
          </button>
        )}
      </div>

      {/* summary */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-gray-50 py-2 dark:bg-gray-700/40"><p className="text-[11px] text-gray-500 dark:text-gray-400">एकूण देय</p><p className="font-bold text-gray-800 dark:text-gray-100">{money(suggestedAmount)}</p></div>
        <div className="rounded-lg bg-emerald-50 py-2 dark:bg-emerald-500/10"><p className="text-[11px] text-emerald-600 dark:text-emerald-300">भरले</p><p className="font-bold text-emerald-700 dark:text-emerald-300">{money(totalPaid)}</p></div>
        <div className="rounded-lg bg-amber-50 py-2 dark:bg-amber-500/10"><p className="text-[11px] text-amber-600 dark:text-amber-300">बाकी</p><p className="font-bold text-amber-700 dark:text-amber-300">{money(balance)}</p></div>
      </div>

      {/* record form */}
      {open && (
        <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50/40 p-3 dark:border-primary-800 dark:bg-primary-900/10">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div><label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">रक्कम *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inp} /></div>
            <div><label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">पद्धत</label>
              <select value={form.payment_type} onChange={(e) => setForm({ ...form, payment_type: e.target.value })} className={inp}>
                <option value="cash">रोख</option><option value="online">ऑनलाइन</option><option value="upi">UPI</option><option value="cheque">धनादेश</option>
              </select>
            </div>
            <div><label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">दिनांक</label><input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} className={inp} /></div>
            <div><label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">पावती क्र.</label><input value={form.receipt_no} onChange={(e) => setForm({ ...form, receipt_no: e.target.value })} className={inp} /></div>
            <div><label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">संदर्भ क्र.</label><input value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} className={inp} /></div>
            <div><label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">शेरा</label><input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} className={inp} /></div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-gray-600 dark:text-gray-300">रद्द</button>
            <button onClick={save} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <IndianRupee className="h-3.5 w-3.5" />} जतन करा
            </button>
          </div>
        </div>
      )}

      {/* list */}
      <div className="mt-3">
        {loading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">अद्याप कोणताही भरणा नोंदवलेला नाही</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{money(Number(p.amount || 0))}</span>
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">{MODE[String(p.payment_type || '').toLowerCase()] || p.payment_type || '—'}</span>
                  <span className="ml-2 text-[11px] text-gray-400">दि. {fmtD(p.paid_date || p.created_at)}{p.receipt_no ? ` · पावती ${p.receipt_no}` : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => receipt(p)} className="flex items-center gap-1 rounded border border-primary-300 px-2 py-1 text-[11px] font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300"><Download className="h-3 w-3" /> पावती</button>
                  {canEdit && <button onClick={() => del(p.id)} className="rounded border border-rose-200 p-1 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterPaymentsPanel;

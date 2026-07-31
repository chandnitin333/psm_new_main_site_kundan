import { useEffect, useMemo, useState } from 'react';
import { BellRing, Loader2, Download, Send, AlertTriangle, Phone } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { vasuliService } from '../../../services';
import type { Defaulter, BulkReminderResult } from '../../../services/vasuliService';
import { fyLabel, fyOfDate } from '../../../utils/fyConfig';
import { canModule } from '../../../utils/permissions';
import { isSuperUser, getActiveGp } from '../../../utils/activeGp';
import YearPicker from '../../../components/common/YearPicker';
import { MarathiInput } from '../../../components/common';

/* थकबाकी स्मरणपत्र — defaulters ko bulk reminder: in-app सूचना (jinke citizen account hai) +
   SMS मजकूर list export. permission: bulk_reminder. super_user / full-access ला सर्व. */

const inr = (n: number) => '₹ ' + Math.round(n || 0).toLocaleString('en-IN');
const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

// GP name from session — super_user -> selected GP; else own GP.
const gpName = (): string => {
  try {
    if (isSuperUser()) return getActiveGp()?.name || 'ग्रामपंचायत';
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.gram_panchayat || u.gram_panchayat_name || u.gat_gram_panchayat || 'ग्रामपंचायत';
  } catch { return 'ग्रामपंचायत'; }
};
const DEFAULT_MSG = `नमस्कार {name}, आपल्या मालमत्तेची कर थकबाकी ₹{baki} आहे. कृपया लवकर भरणा करावा. — ${gpName()}`;

const BulkReminder = () => {
  const { toast, ToastContainer } = useToast();
  const allowed = canModule('bulk_reminder');
  const [year, setYear] = useState<number>(fyOfDate());
  const [minBaki, setMinBaki] = useState('1');
  const [rows, setRows] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState('कर भरणा स्मरणपत्र');
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [sendInapp, setSendInapp] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BulkReminderResult | null>(null);

  useEffect(() => {
    document.title = 'थकबाकी स्मरणपत्र';
    if (!allowed) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await vasuliService.getDefaulters(String(year), 500);
        if (!cancel) setRows(res?.success && Array.isArray(res.data?.defaulters) ? res.data!.defaulters : []);
      } catch { if (!cancel) setRows([]); }
      finally { if (!cancel) { setSel(new Set()); setResult(null); setLoading(false); } }
    })();
    return () => { cancel = true; };
  }, [year, allowed]);

  const min = Number(minBaki) || 0;
  const filtered = useMemo(() => rows.filter((r) => (r.baki || 0) >= min), [rows, min]);
  const allSelected = filtered.length > 0 && filtered.every((r) => sel.has(r.nodni_id));

  const toggle = (id: number) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(filtered.map((r) => r.nodni_id)));

  const selectedTargets = filtered.filter((r) => sel.has(r.nodni_id));
  const withMobile = selectedTargets.filter((r) => (r.mobile || '').trim()).length;

  const send = async () => {
    if (selectedTargets.length === 0) { toast.error('थकबाकीदार निवडा'); return; }
    if (!title.trim()) { toast.error('शीर्षक आवश्यक'); return; }
    setSending(true);
    try {
      const res = await vasuliService.bulkReminder({
        title: title.trim(), message: message.trim(), send_inapp: sendInapp,
        targets: selectedTargets.map((r) => ({ mobile: r.mobile, name: r.name, baki: r.baki, year: r.year })),
      });
      if (res?.success && res.data) {
        setResult(res.data);
        toast.success(`${res.data.inapp_sent} सूचना · ${res.data.sms_count} SMS तयार`);
      } else toast.error(res?.message || 'पाठवता आले नाही');
    } catch (e) { toast.error((e as { message?: string })?.message || 'त्रुटी'); }
    finally { setSending(false); }
  };

  const downloadSms = () => {
    if (!result?.sms_list?.length) return;
    const esc = (s: string) => `"${String(s || '').replace(/"/g, '""')}"`;
    const csv = '﻿' + ['mobile,name,message', ...result.sms_list.map((s) => `${esc(s.mobile)},${esc(s.name)},${esc(s.message)}`)].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `sms-reminder-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div><AlertTriangle className="mx-auto h-10 w-10 text-amber-500" /><p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">या पानाची परवानगी नाही</p></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <BellRing className="h-6 w-6 text-primary-600" /> थकबाकी स्मरणपत्र
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">थकबाकीदारांना in-app सूचना + SMS मजकूर — सन {fyLabel(year)}</p>

        {/* filters */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-32"><label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">वर्ष</label><YearPicker value={String(year)} onChange={(v) => v && setYear(Number(v))} placeholder="वर्ष" /></div>
          <div className="w-40"><label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">किमान थकबाकी (₹)</label><input type="number" value={minBaki} onChange={(e) => setMinBaki(e.target.value)} className={inp} /></div>
          <div className="text-sm text-gray-500 dark:text-gray-400">निवडलेले: <b className="text-gray-800 dark:text-gray-100">{selectedTargets.length}</b> · मोबाईल: <b className="text-emerald-600 dark:text-emerald-400">{withMobile}</b></div>
        </div>

        {/* message compose */}
        <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-3">
          <div><label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">शीर्षक (सूचना)</label><MarathiInput name="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inp} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">मजकूर — <span className="text-gray-400">{'{name} {baki} {year}'}</span> वापरता येईल</label><MarathiInput name="message" multiline rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className={inp} /></div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 sm:col-span-3">
            <input type="checkbox" checked={sendInapp} onChange={(e) => setSendInapp(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            in-app सूचना पाठवा (ज्यांचे नागरिक खाते आहे त्यांना)
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
            <button onClick={send} disabled={sending || selectedTargets.length === 0} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} स्मरणपत्र पाठवा ({selectedTargets.length})
            </button>
            {result && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300">✓ {result.inapp_sent} in-app · {result.sms_count} SMS{result.no_mobile ? ` · ${result.no_mobile} मोबाईल नाही` : ''}</span>
                <button onClick={downloadSms} disabled={!result.sms_list.length} className="flex items-center gap-1.5 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300">
                  <Download className="h-3.5 w-3.5" /> SMS मजकूर (CSV)
                </button>
              </>
            )}
          </div>
        </div>

        {/* defaulters table */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-600 dark:bg-gray-800">
            <BellRing className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">या निकषात थकबाकीदार नाहीत</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                  <th className="px-3 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300" /></th>
                  <th className="px-3 py-2.5 font-semibold">खातेदार</th>
                  <th className="px-3 py-2.5 font-semibold">प्रभाग/अनु</th>
                  <th className="px-3 py-2.5 font-semibold">मोबाईल</th>
                  <th className="px-3 py-2.5 text-right font-semibold">थकबाकी</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.nodni_id} className={`border-b border-gray-100 last:border-0 dark:border-gray-700/60 ${sel.has(r.nodni_id) ? 'bg-primary-50/40 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                    <td className="px-3 py-2"><input type="checkbox" checked={sel.has(r.nodni_id)} onChange={() => toggle(r.nodni_id)} className="h-4 w-4 rounded border-gray-300" /></td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{r.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{r.ward || '—'} / {r.anu_kramank || '—'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.mobile ? <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" />{r.mobile}</span> : <span className="text-[11px] text-amber-500">मोबाईल नाही</span>}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-rose-600 dark:text-rose-400">{inr(r.baki)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default BulkReminder;

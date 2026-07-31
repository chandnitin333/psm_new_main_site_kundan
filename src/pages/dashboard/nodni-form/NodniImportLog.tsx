import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, Check, AlertTriangle, Inbox } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { nodniService } from '../../../services';
import type { ImportLogEntry } from '../../../services/nodniService';
import { can } from '../../../utils/permissions';

/* नोंदणी फॉर्म → आयात लॉग.
   Bulk/scan/gallery/manual import ke dauraan jo citizen-login create nahi ho paye
   (duplicate mobile / mobile nahi / error) unka log — admin dekhe, filter kare,
   'पुन्हा आयात' (retry) ya 'निकाली' (dismiss) kare. Permission: nodni_form.bulk_import. */

const REASON_META: Record<string, { label: string; cls: string }> = {
  duplicate_user: { label: 'डुप्लिकेट वापरकर्ता', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  no_mobile: { label: 'मोबाईल क्रमांक नाही', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300' },
  error: { label: 'त्रुटी', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
};
const SOURCE_LABEL: Record<string, string> = { manual: 'स्वतः', bulk: 'बल्क', scan: 'स्कॅन', gallery: 'गॅलरी', reimport: 'पुन्हा आयात' };

const REASON_FILTERS = [
  { key: '', label: 'सर्व कारणे' },
  { key: 'duplicate_user', label: 'डुप्लिकेट' },
  { key: 'no_mobile', label: 'मोबाईल नाही' },
  { key: 'error', label: 'त्रुटी' },
];
const STATUS_FILTERS = [
  { key: '0', label: 'प्रलंबित' },
  { key: '1', label: 'निकाली' },
  { key: '', label: 'सर्व' },
];

const NodniImportLog = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const allowed = can('nodni_form', 'bulk_import');
  const [rows, setRows] = useState<ImportLogEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [resolved, setResolved] = useState('0');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async (r = reason, res = resolved) => {
    setLoading(true);
    try {
      const resp = await nodniService.getImportLog({ reason: r || undefined, resolved: res });
      if (resp?.success && resp.data) { setRows(resp.data.rows || []); setCounts(resp.data.counts || {}); }
      else { setRows([]); setCounts({}); }
    } catch { setRows([]); setCounts({}); }
    finally { setLoading(false); }
  };

  useEffect(() => { document.title = 'आयात लॉग'; if (allowed) load('', '0'); /* eslint-disable-next-line */ }, []);

  const doResolve = async (id: number) => {
    setBusyId(id);
    try {
      const r = await nodniService.resolveImportLog(id);
      if (r?.success) { toast.success('निकाली काढले'); load(); }
      else toast.error(r?.message || 'अयशस्वी');
    } catch (e) { toast.error((e as { message?: string })?.message || 'अयशस्वी'); }
    finally { setBusyId(null); }
  };

  const doReimport = async (id: number) => {
    setBusyId(id);
    try {
      const r = await nodniService.reimportImportLog(id);
      // backend: success=true when a user was actually created; success=false + message when skipped
      if (r?.success) { toast.success(r?.message || 'वापरकर्ता तयार झाला'); load(); }
      else toast.error(r?.message || 'पुन्हा आयात करता आले नाही');
    } catch (e) { toast.error((e as { message?: string })?.message || 'पुन्हा आयात अयशस्वी'); }
    finally { setBusyId(null); }
  };

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div><AlertTriangle className="mx-auto h-10 w-10 text-amber-500" /><p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">या पानाची परवानगी नाही</p></div>
      </div>
    );
  }

  const pending = counts.pending_total || 0;

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <button onClick={() => navigate('/nodni-form')} className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
          <ArrowLeft className="h-4 w-4" /> नोंदणी फॉर्म
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <Inbox className="h-6 w-6 text-primary-600" /> आयात लॉग
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">आयातीत वगळलेले / डुप्लिकेट वापरकर्ते — पुन्हा आयात करा किंवा निकाली काढा</p>
          </div>
          {pending > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              {pending} प्रलंबित
            </span>
          )}
        </div>

        {/* filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {REASON_FILTERS.map((f) => (
            <button key={f.key} onClick={() => { setReason(f.key); load(f.key, resolved); }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${reason === f.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
              {f.label}{f.key && counts[f.key] != null ? ` (${counts[f.key]})` : ''}
            </button>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-gray-300 sm:inline-block dark:bg-gray-600" />
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} onClick={() => { setResolved(f.key); load(reason, f.key); }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${resolved === f.key ? 'bg-slate-700 text-white dark:bg-slate-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
        ) : rows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-600 dark:bg-gray-800">
            <Inbox className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">कोणतीही नोंद नाही</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                  <th className="px-3 py-2.5 font-semibold">दिनांक</th>
                  <th className="px-3 py-2.5 font-semibold">मालकाचे नाव</th>
                  <th className="px-3 py-2.5 font-semibold">मोबाईल</th>
                  <th className="px-3 py-2.5 font-semibold">आधार</th>
                  <th className="px-3 py-2.5 font-semibold">स्रोत</th>
                  <th className="px-3 py-2.5 font-semibold">कारण</th>
                  <th className="px-3 py-2.5 text-right font-semibold">कृती</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rm = REASON_META[r.reason] || { label: r.reason, cls: 'bg-gray-100 text-gray-600' };
                  const isBusy = busyId === r.id;
                  return (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-700/60 dark:hover:bg-gray-700/30">
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-500 dark:text-gray-400">{String(r.created_at).slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                        {r.owner_name || '—'}
                        {r.nodni_id ? <span className="ml-1 text-[11px] text-gray-400">#{r.nodni_id}</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-300">{r.mobile_number || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-500 dark:text-gray-400">{r.aadhar_card_no || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2.5"><span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">{SOURCE_LABEL[r.source] || r.source}</span></td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${rm.cls}`}>{rm.label}</span>
                        {r.details ? <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-gray-400" title={r.details}>{r.details}</p> : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.is_resolved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Check className="h-3 w-3" /> निकाली</span>
                          ) : (
                            <>
                              {r.reason !== 'duplicate_user' && r.nodni_id ? (
                                <button onClick={() => doReimport(r.id)} disabled={isBusy}
                                  className="inline-flex items-center gap-1 rounded-lg border border-primary-300 px-2.5 py-1 text-[11px] font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:border-primary-700 dark:text-primary-300">
                                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} पुन्हा आयात
                                </button>
                              ) : null}
                              <button onClick={() => doResolve(r.id)} disabled={isBusy}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300">
                                <Check className="h-3 w-3" /> निकाली
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-gray-400">
          टीप: डुप्लिकेट वापरकर्ता म्हणजे या मोबाईलवर आधीच लॉगिन आहे — पुन्हा आयात लागू नाही, फक्त निकाली काढा.
          मोबाईल क्रमांक जोडल्यानंतर 'पुन्हा आयात' वापरा.
        </p>
      </div>
    </>
  );
};

export default NodniImportLog;

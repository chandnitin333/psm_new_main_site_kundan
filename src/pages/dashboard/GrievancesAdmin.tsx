import { useEffect, useState } from 'react';
import { MessagesSquare, Loader2, Phone, X, Save, AlertTriangle, History } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { grievanceService, type Grievance, type GrievanceStatus } from '../../services';
import { can, canModule } from '../../utils/permissions';
import { MarathiInput } from '../../components/common';
import GrievanceTimeline from '../../components/GrievanceTimeline';

/* तक्रार व्यवस्थापन — staff (GP-scoped) sab citizen complaints dekhe + status/शेरा update kare.
   permission: grievance.view (list) + grievance.edit (status update). super_user / full-access sab. */

const STATUS_META: Record<GrievanceStatus, { label: string; cls: string }> = {
  open: { label: 'प्रलंबित', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  in_progress: { label: 'प्रगतीपथावर', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  resolved: { label: 'निकाली', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  rejected: { label: 'नाकारली', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
};
const FILTERS: { key: string; label: string }[] = [
  { key: '', label: 'सर्व' }, { key: 'open', label: 'प्रलंबित' }, { key: 'in_progress', label: 'प्रगतीपथावर' },
  { key: 'resolved', label: 'निकाली' }, { key: 'rejected', label: 'नाकारली' },
];
const inpCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const GrievancesAdmin = () => {
  const { toast, ToastContainer } = useToast();
  const allowed = canModule('grievance');
  const canEdit = can('grievance', 'edit');
  const [rows, setRows] = useState<Grievance[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Grievance | null>(null);
  const [eStatus, setEStatus] = useState<GrievanceStatus>('open');
  const [eRemark, setERemark] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (status = filter) => {
    setLoading(true);
    try {
      const res = await grievanceService.list(status || undefined);
      if (res?.success && res.data) { setRows(res.data.rows || []); setCounts(res.data.counts || {}); }
      else { setRows([]); setCounts({}); }
    } catch { setRows([]); setCounts({}); }
    finally { setLoading(false); }
  };

  useEffect(() => { document.title = 'तक्रार व्यवस्थापन'; if (allowed) load(''); /* eslint-disable-next-line */ }, []);

  const openEdit = (g: Grievance) => { setEdit(g); setEStatus(g.status); setERemark(g.staff_remark || ''); };
  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      const res = await grievanceService.updateStatus(edit.id, eStatus, eRemark.trim());
      if (res?.success) { toast.success('स्थिती अद्यतनित झाली'); setEdit(null); load(); }
      else toast.error(res?.message || 'अद्यतन अयशस्वी');
    } catch (e) { toast.error((e as { message?: string })?.message || 'अद्यतन अयशस्वी'); }
    finally { setSaving(false); }
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
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <MessagesSquare className="h-6 w-6 text-primary-600" /> तक्रार व्यवस्थापन
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">नागरिकांच्या तक्रारी पहा व निवारण करा</p>

        {/* filter chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => { setFilter(f.key); load(f.key); }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === f.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
              {f.label}{f.key && counts[f.key] != null ? ` (${counts[f.key]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
        ) : rows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-600 dark:bg-gray-800">
            <MessagesSquare className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">कोणतीही तक्रार नाही</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((g) => {
              const s = STATUS_META[g.status] || STATUS_META.open;
              return (
                <div key={g.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{g.category || 'इतर'}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>
                      </div>
                      <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{g.subject}</h3>
                      {g.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{g.description}</p>}
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-gray-400">
                        <span>{g.citizen_name || '—'}</span>
                        {g.mobile && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{g.mobile}</span>}
                        <span>दि. {String(g.created_at).slice(0, 10)}</span>
                      </p>
                      {g.staff_remark && <p className="mt-1 text-xs text-primary-700 dark:text-primary-300"><b>शेरा:</b> {g.staff_remark}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {canEdit && (
                        <button onClick={() => openEdit(g)} className="rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20">
                          निवारण / स्थिती
                        </button>
                      )}
                      <button onClick={() => setOpenId(openId === g.id ? null : g.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400">
                        <History className="h-3.5 w-3.5" /> {openId === g.id ? 'टाइमलाइन लपवा' : 'टाइमलाइन'}
                      </button>
                    </div>
                  </div>
                  {openId === g.id && (
                    <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-700">
                      <GrievanceTimeline grievanceId={g.id} markSeen />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEdit(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">तक्रार निवारण</h3>
              <button onClick={() => setEdit(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{edit.subject}</p>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">स्थिती</label>
              <select value={eStatus} onChange={(e) => setEStatus(e.target.value as GrievanceStatus)} className={inpCls}>
                <option value="open">प्रलंबित</option>
                <option value="in_progress">प्रगतीपथावर</option>
                <option value="resolved">निकाली</option>
                <option value="rejected">नाकारली</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">शेरा (नागरिकाला दिसेल)</label>
              <MarathiInput name="remark" multiline rows={3} value={eRemark} onChange={(e) => setERemark(e.target.value)} className={inpCls} placeholder="कार्यवाही / शेरा" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEdit(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">रद्द</button>
              <button onClick={saveEdit} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} जतन करा
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GrievancesAdmin;

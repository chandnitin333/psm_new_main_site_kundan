import { useEffect, useMemo, useState } from 'react';
import { Bell, Send, Loader2, Trash2, Users, MapPin, User as UserIcon, AlertTriangle, Search } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { citizenNotificationService, commonDdlService, type CitizenNotification, type NotifCategory, type NotifTarget, type CitizenOption } from '../../services';
import { canModule } from '../../utils/permissions';
import { MarathiInput, Select2, type Select2Option } from '../../components/common';

/* नागरिक सूचना — staff citizen ko in-app notification bheje (all / ward / ek citizen).
   permission: citizen_notification (super_user / full-access sabko). */

const CATS: { key: NotifCategory; label: string }[] = [
  { key: 'general', label: 'सामान्य' }, { key: 'kar', label: 'कर' }, { key: 'pani', label: 'पाणी' },
];
const CAT_LABEL: Record<string, string> = { general: 'सामान्य', kar: 'कर', pani: 'पाणी' };
const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
const fmt = (v: string) => { const m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10); };

const CitizenNotifications = () => {
  const { toast, ToastContainer } = useToast();
  const allowed = canModule('citizen_notification');
  const [rows, setRows] = useState<CitizenNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState<Select2Option[]>([]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<NotifCategory>('general');
  const [target, setTarget] = useState<NotifTarget>('all');
  const [ward, setWard] = useState('');
  const [sending, setSending] = useState(false);

  // citizen search (target=user)
  const [cq, setCq] = useState('');
  const [cResults, setCResults] = useState<CitizenOption[]>([]);
  const [cUser, setCUser] = useState<CitizenOption | null>(null);
  const [cSearching, setCSearching] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await citizenNotificationService.list();
      setRows(res?.success && res.data ? res.data.rows || [] : []);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    document.title = 'नागरिक सूचना';
    if (!allowed) return;
    load();
    (async () => {
      try {
        const res = await commonDdlService.getWards();
        if (res.success) {
          const opts = ((res.data as { ward_number: string | number }[]) || [])
            .map((w) => w.ward_number).filter((w) => w !== null && w !== undefined && w !== '')
            .map((w) => ({ value: String(w), label: `प्रभाग ${w}` }));
          setWards(opts);
        }
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced citizen search
  useEffect(() => {
    if (target !== 'user') return;
    const t = setTimeout(async () => {
      setCSearching(true);
      try {
        const res = await citizenNotificationService.searchCitizens(cq.trim());
        setCResults(res?.success && Array.isArray(res.data) ? res.data : []);
      } catch { setCResults([]); }
      finally { setCSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [cq, target]);

  const targetOk = target === 'all' || (target === 'ward' && ward) || (target === 'user' && cUser);
  const canSend = !!title.trim() && !!targetOk && !sending;

  const send = async () => {
    if (!title.trim()) { toast.error('शीर्षक आवश्यक आहे'); return; }
    setSending(true);
    try {
      const res = await citizenNotificationService.create({
        title: title.trim(), body: body.trim(), category, target_type: target,
        ward: target === 'ward' ? ward : undefined,
        target_user_id: target === 'user' ? cUser?.id : undefined,
      });
      if (res?.success) {
        toast.success('सूचना पाठवली');
        setTitle(''); setBody(''); setCategory('general'); setTarget('all'); setWard(''); setCUser(null); setCq('');
        load();
      } else toast.error(res?.message || 'पाठवता आले नाही');
    } catch (e) { toast.error((e as { message?: string })?.message || 'त्रुटी'); }
    finally { setSending(false); }
  };

  const del = async (id: number) => {
    try { const res = await citizenNotificationService.remove(id); if (res?.success) { toast.success('हटवले'); load(); } }
    catch { toast.error('त्रुटी'); }
  };

  const targetLabel = (n: CitizenNotification) =>
    n.target_type === 'all' ? 'सर्व नागरिक'
      : n.target_type === 'ward' ? `प्रभाग ${n.ward}`
        : (n.target_user_name || 'एक नागरिक');

  const TargetBtn = ({ t, Icon, label }: { t: NotifTarget; Icon: typeof Users; label: string }) => (
    <button type="button" onClick={() => setTarget(t)}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${target === t ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300'}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  const catOptions = useMemo(() => CATS, []);

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
          <Bell className="h-6 w-6 text-primary-600" /> नागरिक सूचना
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">नागरिकांना सूचना पाठवा (bill-due / reminder / general)</p>

        {/* compose */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">शीर्षक *</label>
              <MarathiInput name="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="उदा. कर भरण्याची अंतिम तारीख" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">प्रकार</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as NotifCategory)} className={inp}>
                {catOptions.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">तपशील</label>
              <MarathiInput name="body" multiline rows={3} value={body} onChange={(e) => setBody(e.target.value)} className={inp} placeholder="सूचनेचा तपशील..." />
            </div>
          </div>

          {/* target */}
          <div className="mt-3">
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">कोणाला पाठवायचे?</label>
            <div className="flex flex-wrap gap-2">
              <TargetBtn t="all" Icon={Users} label="सर्व नागरिक" />
              <TargetBtn t="ward" Icon={MapPin} label="प्रभाग" />
              <TargetBtn t="user" Icon={UserIcon} label="एक नागरिक" />
            </div>
          </div>

          {target === 'ward' && (
            <div className="mt-3 w-full sm:w-72">
              <Select2 options={wards} value={ward} onChange={(v) => setWard(String(v))} placeholder="प्रभाग निवडा" searchable clearable />
            </div>
          )}

          {target === 'user' && (
            <div className="mt-3 w-full sm:w-96">
              {cUser ? (
                <div className="flex items-center justify-between rounded-lg border border-primary-300 bg-primary-50 px-3 py-2 text-sm dark:border-primary-700 dark:bg-primary-900/20">
                  <span className="font-medium text-primary-800 dark:text-primary-200">{cUser.name} {cUser.mobile_no ? `· ${cUser.mobile_no}` : ''}</span>
                  <button onClick={() => setCUser(null)} className="text-xs text-primary-600 hover:underline">बदला</button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input value={cq} onChange={(e) => setCq(e.target.value)} placeholder="नागरिक शोधा (नाव / मोबाईल)" className={`${inp} pl-9`} />
                  {(cSearching || cResults.length > 0) && (
                    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                      {cSearching ? (
                        <div className="px-3 py-2 text-xs text-gray-400">शोधत आहे...</div>
                      ) : cResults.map((c) => (
                        <button key={c.id} onClick={() => { setCUser(c); setCResults([]); }}
                          className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-600">
                          {c.name} {c.mobile_no ? <span className="text-gray-400">· {c.mobile_no}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <button onClick={send} disabled={!canSend}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} सूचना पाठवा
            </button>
          </div>
        </div>

        {/* sent list */}
        <h2 className="m-t mt-6 mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">पाठवलेल्या सूचना</h2>
        {loading ? (
          <div className="flex items-center justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-primary-500" /></div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-600 dark:bg-gray-800">
            <Bell className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">अद्याप कोणतीही सूचना पाठवलेली नाही</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {rows.map((n) => (
              <div key={n.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{CAT_LABEL[n.category] || n.category}</span>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">{targetLabel(n)}</span>
                      <span className="text-[11px] text-gray-400">{fmt(n.created_at)}</span>
                    </div>
                    <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{n.title}</h3>
                    {n.body && <p className="mt-0.5 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-gray-400">वाचले: {n.read_count ?? 0}</p>
                  </div>
                  <button onClick={() => del(n.id)} className="shrink-0 rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20" title="हटवा">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CitizenNotifications;

import { useEffect, useState } from 'react';
import { MessageSquarePlus, Send, Clock, CheckCircle2, XCircle, Loader2, History } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { grievanceService, type Grievance, type GrievanceStatus } from '../../services';
import { MarathiInput } from '../../components/common';
import GrievanceTimeline from '../../components/GrievanceTimeline';

/* माझ्या तक्रारी — citizen apni complaint raise kare + status track kare (view + create only). */

const CATEGORIES = ['पाणी', 'रस्ता', 'स्वच्छता', 'वीज', 'कर', 'इतर'];

const STATUS_META: Record<GrievanceStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  open: { label: 'प्रलंबित', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', Icon: Clock },
  in_progress: { label: 'प्रगतीपथावर', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', Icon: Loader2 },
  resolved: { label: 'निकाली', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', Icon: CheckCircle2 },
  rejected: { label: 'नाकारली', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', Icon: XCircle },
};

const inpCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const MyComplaints = () => {
  const { toast, ToastContainer } = useToast();
  const [list, setList] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'इतर', subject: '', description: '' });
  const [openId, setOpenId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await grievanceService.getMy();
      setList(res?.success && Array.isArray(res.data) ? res.data : []);
    } catch { setList([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { document.title = 'माझ्या तक्रारी'; load(); }, []);

  const submit = async () => {
    if (!form.subject.trim()) { toast.error('विषय आवश्यक आहे'); return; }
    setSaving(true);
    try {
      const res = await grievanceService.create({ subject: form.subject.trim(), category: form.category, description: form.description.trim() });
      if (res?.success) {
        toast.success('तक्रार नोंदवली गेली');
        setForm({ category: 'इतर', subject: '', description: '' });
        load();
      } else toast.error(res?.message || 'नोंदवण्यात त्रुटी');
    } catch (e) { toast.error((e as { message?: string })?.message || 'नोंदवण्यात त्रुटी'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <MessageSquarePlus className="h-6 w-6 text-primary-600" /> माझ्या तक्रारी
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">तक्रार नोंदवा व तिची स्थिती पहा (Raise a complaint & track its status)</p>

        {/* raise form */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-sm font-bold text-primary-700 dark:text-primary-300">नवीन तक्रार</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">प्रकार</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inpCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">विषय *</label>
              <MarathiInput name="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inpCls} placeholder="उदा. रस्त्यावर पाणी साचते" />
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">तपशील</label>
              <MarathiInput name="description" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inpCls} placeholder="तक्रारीचा तपशील लिहा..." />
            </div>
          </div>
          <div className="mt-3">
            <button onClick={submit} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} तक्रार नोंदवा
            </button>
          </div>
        </div>

        {/* my complaints list */}
        <div className="mt-5">
          <h2 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-100">माझ्या नोंदवलेल्या तक्रारी</h2>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-600 dark:bg-gray-800">
              <MessageSquarePlus className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">अजून कोणतीही तक्रार नाही</p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((g) => {
                const s = STATUS_META[g.status] || STATUS_META.open;
                return (
                  <div key={g.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{g.category || 'इतर'}</span>
                        <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{g.subject}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>
                        <s.Icon className="h-3.5 w-3.5" /> {s.label}
                      </span>
                    </div>
                    {g.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{g.description}</p>}
                    {g.staff_remark && (
                      <div className="mt-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
                        <b>ग्रामपंचायत शेरा:</b> {g.staff_remark}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[11px] text-gray-400">दि. {String(g.created_at).slice(0, 10)}</p>
                      <button onClick={() => setOpenId(openId === g.id ? null : g.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:underline dark:text-primary-400">
                        <History className="h-3.5 w-3.5" /> {openId === g.id ? 'प्रगती लपवा' : 'प्रगती पहा'}
                      </button>
                    </div>
                    {openId === g.id && (
                      <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                        <GrievanceTimeline grievanceId={g.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyComplaints;

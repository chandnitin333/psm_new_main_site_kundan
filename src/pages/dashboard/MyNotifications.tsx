import { useEffect, useState } from 'react';
import { Bell, Loader2, CheckCheck, IndianRupee, Droplet, Info } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { citizenNotificationService, type CitizenNotification, type NotifCategory } from '../../services';

/* माझ्या सूचना — citizen apni notifications dekhe (bill-due / reminder / general).
   Direct (no permission). Read/unread tracking. */

const CAT_META: Record<NotifCategory, { label: string; cls: string; Icon: typeof Info }> = {
  kar: { label: 'कर', cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300', Icon: IndianRupee },
  pani: { label: 'पाणी', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300', Icon: Droplet },
  general: { label: 'सामान्य', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', Icon: Info },
};
const fmt = (v: string) => { const m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10); };

const MyNotifications = () => {
  const { toast, ToastContainer } = useToast();
  const [rows, setRows] = useState<CitizenNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const unread = rows.filter((r) => !r.is_read).length;

  const load = async () => {
    setLoading(true);
    try {
      const res = await citizenNotificationService.getMy();
      setRows(res?.success && Array.isArray(res.data) ? res.data : []);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { document.title = 'माझ्या सूचना'; load(); }, []);

  const openOne = async (n: CitizenNotification) => {
    if (n.is_read) return;
    setRows((prev) => prev.map((r) => (r.id === n.id ? { ...r, is_read: 1 } : r)));
    try { await citizenNotificationService.markRead(n.id); } catch { /* ignore */ }
  };

  const readAll = async () => {
    try {
      const res = await citizenNotificationService.markAllRead();
      if (res?.success) { setRows((prev) => prev.map((r) => ({ ...r, is_read: 1 }))); toast.success('सर्व वाचले'); }
    } catch { toast.error('त्रुटी'); }
  };

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Bell className="h-6 w-6 text-primary-600" /> माझ्या सूचना
            {unread > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>}
          </h1>
          {unread > 0 && (
            <button onClick={readAll} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
              <CheckCheck className="h-4 w-4" /> सर्व वाचले करा
            </button>
          )}
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center dark:border-gray-600 dark:bg-gray-800">
              <Bell className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">कोणतीही सूचना नाही</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rows.map((n) => {
                const c = CAT_META[n.category] || CAT_META.general;
                const isUnread = !n.is_read;
                return (
                  <button key={n.id} onClick={() => openOne(n)}
                    className={`flex w-full gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors ${isUnread ? 'border-primary-200 bg-primary-50/40 dark:border-primary-800 dark:bg-primary-900/10' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.cls}`}><c.Icon className="h-4.5 w-4.5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.cls}`}>{c.label}</span>
                        {isUnread && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                        <span className="ml-auto text-[11px] text-gray-400">{fmt(n.created_at)}</span>
                      </div>
                      <h3 className={`mt-1 ${isUnread ? 'font-bold' : 'font-semibold'} text-gray-900 dark:text-white`}>{n.title}</h3>
                      {n.body && <p className="mt-0.5 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">{n.body}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyNotifications;

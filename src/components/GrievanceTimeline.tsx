import { useEffect, useState } from 'react';
import { Loader2, FileText, Eye, Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { grievanceService, type GrievanceEvent } from '../services';

/* तक्रार टाइमलाइन — delivery-tracking style. Ek grievance ke saare events (नोंदवली → पाहिली →
   प्रगतीपथावर → निकाली) kab, kisne kiye — citizen aur staff dono ko dikhta hai.
   markSeen=true (staff) → open hote hi ek baar 'seen' event log hota hai. */

interface Props {
  grievanceId: number;
  markSeen?: boolean;
  onSeen?: () => void; // parent list refresh (seen event add hone ke baad)
}

type Meta = { label: string; cls: string; Icon: typeof FileText };

const eventMeta = (e: GrievanceEvent): Meta => {
  if (e.event === 'created') return { label: 'तक्रार नोंदवली', cls: 'bg-emerald-500', Icon: FileText };
  if (e.event === 'seen') return { label: 'ग्रामपंचायतीने पाहिली', cls: 'bg-indigo-500', Icon: Eye };
  switch (e.status) {
    case 'in_progress': return { label: 'प्रगतीपथावर', cls: 'bg-blue-500', Icon: RefreshCw };
    case 'resolved': return { label: 'निकाली काढली', cls: 'bg-emerald-500', Icon: CheckCircle2 };
    case 'rejected': return { label: 'नाकारली', cls: 'bg-rose-500', Icon: XCircle };
    case 'open': return { label: 'प्रलंबित', cls: 'bg-amber-500', Icon: Clock };
    default: return { label: 'स्थिती बदलली', cls: 'bg-gray-400', Icon: Clock };
  }
};

const fmt = (s: string) => String(s || '').replace('T', ' ').slice(0, 16);

const GrievanceTimeline = ({ grievanceId, markSeen, onSeen }: Props) => {
  const [events, setEvents] = useState<GrievanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (markSeen) {
          try {
            const r = await grievanceService.markSeen(grievanceId);
            if (r?.success) onSeen?.();
          } catch { /* ignore */ }
        }
        const res = await grievanceService.getHistory(grievanceId);
        if (alive) setEvents(res?.success && Array.isArray(res.data) ? res.data : []);
      } catch { if (alive) setEvents([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grievanceId]);

  if (loading) {
    return <div className="flex items-center gap-2 py-4 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> टाइमलाइन लोड होत आहे...</div>;
  }
  if (events.length === 0) {
    return <p className="py-3 text-sm text-gray-400">अद्याप कोणतीही अद्यतने नाहीत</p>;
  }

  return (
    <ol className="relative ml-1 mt-2 border-l-2 border-gray-200 dark:border-gray-600">
      {events.map((e) => {
        const m = eventMeta(e);
        return (
          <li key={e.id} className="mb-4 ml-4 last:mb-1">
            <span className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800 ${m.cls}`}>
              <m.Icon className="h-3 w-3 text-white" />
            </span>
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.label}</span>
              <span className="text-[11px] text-gray-400">{fmt(e.created_at)}</span>
            </div>
            {e.changed_by_name && <p className="text-[11px] text-gray-500 dark:text-gray-400">{e.changed_by_name}</p>}
            {e.event === 'status' && e.remark && (
              <p className="mt-0.5 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">{e.remark}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default GrievanceTimeline;

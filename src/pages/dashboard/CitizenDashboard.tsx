import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BadgeCheck, Building2, KeyRound, FileText, Droplet, Receipt, Bell, MessagesSquare,
  IndianRupee, Wallet, ChevronRight, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import {
  commonDdlService, nodniService, vasuliService, citizenNotificationService, grievanceService,
  type MyPayment,
} from '../../services';

/* नागरिक डॅशबोर्ड — citizen ke liye ek overview: थकबाकी/देय, मालमत्ता, एकूण भरणा, unread सूचना,
   open तक्रारी, अलीकडील भरणे + quick links. Sab direct (citizen), koi permission nahi. */

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const money = (v: number) => `₹ ${Math.round(v || 0).toLocaleString('en-IN')}`;
const fmtD = (v?: string | null) => { if (!v) return '-'; const m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10); };

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('नागरिक');
  const [gp, setGp] = useState('');
  const [designation, setDesignation] = useState('');
  const [props, setProps] = useState(0);
  const [dues, setDues] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [unread, setUnread] = useState(0);
  const [openComplaints, setOpenComplaints] = useState(0);
  const [recent, setRecent] = useState<MyPayment[]>([]);

  useEffect(() => {
    document.title = 'नागरिक डॅशबोर्ड / Citizen Dashboard';
    let active = true;
    (async () => {
      try {
        const [profile, properties, payments, unreadRes, grv] = await Promise.all([
          commonDdlService.getMyProfile().catch(() => null),
          nodniService.getMyProperties().catch(() => null),
          vasuliService.getMyPayments().catch(() => null),
          citizenNotificationService.getUnreadCount().catch(() => null),
          grievanceService.getMy().catch(() => null),
        ]);
        if (!active) return;

        const u = (profile?.data ?? {}) as Record<string, unknown>;
        const lu = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
        setName(`${u.first_name || lu.first_name || ''} ${u.last_name || lu.last_name || ''}`.trim() || 'नागरिक');
        setGp(String(u.gram_panchayat_name || lu.gram_panchayat_name || lu.gram_panchayat || ''));
        setDesignation(String(u.designation_name || 'मालमत्ता धारक'));

        const recs = ((properties?.data as { records?: Record<string, unknown>[] })?.records) || [];
        setProps(recs.length);
        setDues(recs.reduce((s, r) => s + num(r.chalu_kar) + num(r.magil_baki), 0));

        if (payments?.success && payments.data) {
          setTotalPaid(payments.data.total_paid || 0);
          setRecent((payments.data.payments || []).slice(0, 4));
        }
        setUnread(unreadRes?.success && unreadRes.data ? unreadRes.data.unread || 0 : 0);
        const gs = Array.isArray(grv?.data) ? grv!.data : [];
        setOpenComplaints(gs.filter((g) => g.status === 'open' || g.status === 'in_progress').length);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const stats = [
    { label: 'माझी मालमत्ता', value: String(props), Icon: Building2, cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300', to: '/my-property' },
    { label: 'एकूण भरणा', value: money(totalPaid), Icon: IndianRupee, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', to: '/my-payments' },
    { label: 'सूचना', value: String(unread), Icon: Bell, cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300', to: '/my-notifications' },
    { label: 'तक्रारी', value: String(openComplaints), Icon: MessagesSquare, cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', to: '/my-complaints' },
  ];

  const links = [
    { label: 'माझी मालमत्ता', sub: 'My Property', Icon: Building2, to: '/my-property' },
    { label: 'कर बिल', sub: 'Tax Bill', Icon: FileText, to: '/my-bill' },
    { label: 'माझे भरणे', sub: 'Payments & Receipts', Icon: Receipt, to: '/my-payments' },
    { label: 'पाणी बिल', sub: 'Water Bill', Icon: Droplet, to: '/water-bill' },
    { label: 'माझ्या सूचना', sub: 'Notifications', Icon: Bell, to: '/my-notifications' },
    { label: 'माझ्या तक्रारी', sub: 'Complaints', Icon: MessagesSquare, to: '/my-complaints' },
    { label: 'पासवर्ड बदला', sub: 'Change Password', Icon: KeyRound, to: '/change-password' },
  ];

  return (
    <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl bg-primary-600 p-6 text-white shadow-lg sm:p-7">
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">स्वागत आहे / Welcome</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
              <BadgeCheck className="h-4 w-4" /> {designation}{gp ? ` · ${gp}` : ''}
            </p>
          </div>
          <Home className="pointer-events-none absolute -right-4 -top-4 h-40 w-40 text-white/10" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>
        ) : (
          <>
            {/* Dues highlight */}
            <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 shadow-sm ${dues > 0 ? 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/15' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/15'}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${dues > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>
                  {dues > 0 ? <Wallet className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{dues > 0 ? 'एकूण देय / थकबाकी' : 'थकबाकी'}</p>
                  <p className={`text-2xl font-extrabold ${dues > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{dues > 0 ? money(dues) : 'कोणतीही थकबाकी नाही ✓'}</p>
                </div>
              </div>
              {dues > 0 && (
                <button onClick={() => navigate('/my-bill')} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                  कर बिल पहा <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Stat cards */}
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((s) => (
                <button key={s.label} onClick={() => navigate(s.to)} className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.cls}`}><s.Icon className="h-5 w-5" /></span>
                  <p className="mt-2.5 text-xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
                </button>
              ))}
            </div>

            {/* Recent payments + quick links */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* recent payments */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100"><Receipt className="h-4 w-4 text-primary-600" /> अलीकडील भरणे</h2>
                  <button onClick={() => navigate('/my-payments')} className="text-[11px] font-medium text-primary-600 hover:underline dark:text-primary-400">सर्व पाहा</button>
                </div>
                {recent.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">अद्याप कोणतेही भरणे नाहीत</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recent.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2">
                        <div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{money(Number(p.amount || 0))}</span>
                          <p className="text-[11px] text-gray-400">मालमत्ता {p.malmatta_number || '—'} · {fmtD(p.paid_at)}</p>
                        </div>
                        {p.year && <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">सन {p.year}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* quick links */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-3">
                <h2 className="mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">जलद दुवे / Quick Links</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {links.map((l) => (
                    <button key={l.to} onClick={() => navigate(l.to)} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-primary-200 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-700/40 dark:hover:bg-primary-900/20">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"><l.Icon className="h-4.5 w-4.5" /></span>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{l.label}</p><p className="truncate text-[10px] text-gray-400">{l.sub}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400">
              <AlertTriangle className="h-3.5 w-3.5" /> देय रक्कम अंदाजे आहे — नक्की रक्कमेसाठी "कर बिल" पहा.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;

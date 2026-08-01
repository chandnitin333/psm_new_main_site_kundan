import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import commonDdlService from '../../services/commonDdlService';
import { isCitizen } from '../../utils/permissions';

const FLAG_KEY = 'psm_force_pwd';
const DEFAULT_PASSWORD = 'Pass@123';

const isAuthed = () => localStorage.getItem('isAuthenticated') === 'true';
const mustChange = () => localStorage.getItem(FLAG_KEY) === '1';

/**
 * Blocking, non-dismissable modal shown ONLY to a citizen who is still on the
 * shared default password (Pass@123). They cannot close it, navigate away, or
 * use the app until they set a new password. Other user types never see it.
 *
 * The `psm_force_pwd` flag is set at login (see Login.tsx) and cleared here on
 * a successful change (and on logout).
 */
const ForcePasswordChange = () => {
  const [open, setOpen] = useState<boolean>(isAuthed() && isCitizen() && mustChange());
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Re-evaluate when auth state changes elsewhere (login in another tab, etc.)
  useEffect(() => {
    const check = () => setOpen(isAuthed() && isCitizen() && mustChange());
    window.addEventListener('storage', check);
    window.addEventListener('psm-auth-changed', check);
    return () => {
      window.removeEventListener('storage', check);
      window.removeEventListener('psm-auth-changed', check);
    };
  }, []);

  // Block Escape / browser back while the modal is up
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') e.preventDefault(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const checks = [
    { ok: newPwd.length >= 8, label: 'किमान 8 अक्षरे' },
    { ok: !!newPwd && newPwd !== DEFAULT_PASSWORD, label: 'डीफॉल्ट पासवर्डपेक्षा वेगळा' },
    { ok: !!confirm && newPwd === confirm, label: 'दोन्ही पासवर्ड जुळतात' },
  ];
  const allOk = checks.every((c) => c.ok);

  const submit = useCallback(async () => {
    setError('');
    if (!allOk) { setError('कृपया सर्व अटी पूर्ण करा'); return; }
    setBusy(true);
    try {
      const res = await commonDdlService.changeMyPassword(DEFAULT_PASSWORD, newPwd);
      if (res?.success) {
        localStorage.removeItem(FLAG_KEY);
        setDone(true);
        setTimeout(() => setOpen(false), 1200);
      } else {
        setError(res?.message || 'पासवर्ड बदलण्यात अयशस्वी. पुन्हा प्रयत्न करा.');
      }
    } catch (e) {
      setError((e as { message?: string })?.message || 'पासवर्ड बदलण्यात अयशस्वी. पुन्हा प्रयत्न करा.');
    } finally {
      setBusy(false);
    }
  }, [allOk, newPwd]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-gray-900/90 px-4 backdrop-blur-sm print:hidden">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">पासवर्ड बदलला! 🎉</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">आता तुम्ही अ‍ॅप वापरू शकता.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">पासवर्ड बदला (आवश्यक)</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  सुरक्षेसाठी पहिल्यांदा तुमचा पासवर्ड बदलणे आवश्यक आहे.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="नवीन पासवर्ड"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="toggle"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="पासवर्डची पुष्टी करा"
                autoComplete="new-password"
                onKeyDown={(e) => { if (e.key === 'Enter' && allOk && !busy) submit(); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* live checks */}
            <ul className="mt-3 space-y-1">
              {checks.map((c, i) => (
                <li key={i} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> {c.label}
                </li>
              ))}
            </ul>

            {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}

            <button
              onClick={submit}
              disabled={!allOk || busy}
              className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'बदलत आहे...' : 'पासवर्ड बदला व सुरू ठेवा'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForcePasswordChange;

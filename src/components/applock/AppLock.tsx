import { useEffect, useRef, useState, useCallback } from 'react';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import { appLockService, type LockSettings } from '../../services';
import { biometricUnlock, getStoredCredentialId } from '../../utils/biometric';

const LOCAL_HASH_KEY = 'psm_applock_h';
// Persisted lock flag — survives page refresh/reopen so the lock screen stays up
// until the correct PIN is entered (a refresh must NOT bypass the lock).
export const LOCK_STATE_KEY = 'psm_applock_locked';

const sha256 = async (s: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const isAuthed = () => localStorage.getItem('isAuthenticated') === 'true';

const AppLock = () => {
  const [settings, setSettings] = useState<LockSettings | null>(null);
  // Initialise from the persisted flag so a refresh keeps the lock screen up.
  const [locked, setLocked] = useState<boolean>(() => isAuthed() && localStorage.getItem(LOCK_STATE_KEY) === '1');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef<LockSettings | null>(null);
  settingsRef.current = settings;

  const loadSettings = useCallback(async () => {
    if (!isAuthed()) { setSettings(null); return; }
    try {
      const res = await appLockService.getSettings();
      if (res?.success && res.data) {
        setSettings(res.data);
        // If the feature was turned off since the flag was set, don't keep the
        // user stuck behind a lock they can no longer disable.
        if (!res.data.is_enabled) { localStorage.removeItem(LOCK_STATE_KEY); setLocked(false); }
      }
    } catch { /* ignore */ }
  }, []);

  // fetch settings once authenticated; re-fetch when profile changes them
  useEffect(() => {
    let stop = false;
    const tryLoad = () => { if (!stop && isAuthed() && !settingsRef.current) loadSettings(); };
    tryLoad();
    const iv = setInterval(tryLoad, 3000);
    const onChanged = () => loadSettings();
    window.addEventListener('applock-changed', onChanged);
    return () => { stop = true; clearInterval(iv); window.removeEventListener('applock-changed', onChanged); };
  }, [loadSettings]);

  const doLock = useCallback(() => {
    if (isAuthed() && settingsRef.current?.is_enabled) {
      setPin(''); setError('');
      localStorage.setItem(LOCK_STATE_KEY, '1');
      setLocked(true);
    }
  }, []);

  const resetInactivity = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const mins = settingsRef.current?.auto_lock_minutes || 5;
    timerRef.current = setTimeout(doLock, mins * 60 * 1000);
  }, [doLock]);

  // inactivity + background listeners (only while enabled + authed + unlocked)
  useEffect(() => {
    if (!settings?.is_enabled || !isAuthed()) return;
    const onActivity = () => { if (!locked) resetInactivity(); };
    // Lock on tab-switch / app-close / screen-off ONLY if the user opted in.
    // Otherwise a quick tab switch won't lock — the app just relies on the
    // inactivity timer (less frustrating for everyday use).
    const onVisibility = () => { if (document.hidden && settingsRef.current?.lock_on_background) doLock(); };
    const events: (keyof DocumentEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => document.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    if (!locked) resetInactivity();
    return () => {
      events.forEach((e) => document.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [settings, locked, resetInactivity, doLock]);

  const finishUnlock = useCallback(() => {
    localStorage.removeItem(LOCK_STATE_KEY);
    setLocked(false); setPin(''); setError('');
    resetInactivity();
  }, [resetInactivity]);

  const submitPin = useCallback(async (value: string) => {
    setBusy(true); setError('');
    try {
      const res = await appLockService.verify(value);
      if (res?.success && res.data?.ok) {
        await sha256(value).then((h) => localStorage.setItem(LOCAL_HASH_KEY, h)).catch(() => {});
        finishUnlock();
      } else {
        setError('चुकीचा PIN / Wrong PIN'); setPin('');
      }
    } catch {
      // offline fallback — compare against last cached hash
      try {
        const h = await sha256(value);
        if (localStorage.getItem(LOCAL_HASH_KEY) === h) { finishUnlock(); return; }
      } catch { /* ignore */ }
      setError('पडताळणी अयशस्वी / Verify failed'); setPin('');
    } finally {
      setBusy(false);
    }
  }, [finishUnlock]);

  const busyRef = useRef(false);
  busyRef.current = busy;

  const press = (d: string) => {
    if (busy) return;
    setError('');
    setPin((p) => {
      const next = (p + d).slice(0, 4);
      if (next.length === 4) submitPin(next);
      return next;
    });
  };
  const backspace = () => setPin((p) => p.slice(0, -1));

  // physical keyboard support while the lock screen is shown
  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (busyRef.current) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setError('');
        setPin((p) => {
          const next = (p + e.key).slice(0, 4);
          if (next.length === 4) submitPin(next);
          return next;
        });
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setPin((p) => p.slice(0, -1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked, submitPin]);

  const tryBiometric = useCallback(async () => {
    setBusy(true); setError('');
    const ok = await biometricUnlock(getStoredCredentialId() || undefined);
    setBusy(false);
    if (ok) finishUnlock();
    else setError('बायोमेट्रिक अयशस्वी / Biometric failed');
  }, [finishUnlock]);

  // auto-prompt biometric when the lock appears (if enabled)
  useEffect(() => {
    if (locked && settings?.biometric_enabled) {
      const t = setTimeout(() => { tryBiometric(); }, 400);
      return () => clearTimeout(t);
    }
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!locked || !isAuthed()) return null;

  const biometricOn = !!settings?.biometric_enabled;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-gray-900/95 px-6 backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-white">अ‍ॅप लॉक / App Locked</h2>
      <p className="mt-1 text-sm text-gray-300">PIN टाका / Enter your PIN</p>

      {/* PIN dots */}
      <div className="mt-6 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full border-2 ${i < pin.length ? 'border-primary-400 bg-primary-400' : 'border-gray-500'}`} />
        ))}
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-400">{error}</p>}

      {/* keypad */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {keys.map((k) => (
          <button key={k} type="button" onClick={() => press(k)} disabled={busy}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50">
            {k}
          </button>
        ))}
        {/* bottom row: biometric (if on) | 0 | backspace */}
        {biometricOn ? (
          <button type="button" onClick={tryBiometric} disabled={busy} title="Fingerprint / Face"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50">
            <Fingerprint className="h-7 w-7" />
          </button>
        ) : <span />}
        <button type="button" onClick={() => press('0')} disabled={busy}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50">
          0
        </button>
        <button type="button" onClick={backspace} disabled={busy}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50">
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default AppLock;

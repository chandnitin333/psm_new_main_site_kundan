import { useEffect, useState } from 'react';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { appLockService, type LockSettings } from '../../services';
import { biometricAvailable, registerBiometric, clearStoredCredential } from '../../utils/biometric';

const notifyChanged = () => window.dispatchEvent(new Event('applock-changed'));

const AppLockSettings = () => {
  const { toast, ToastContainer } = useToast();
  const [s, setS] = useState<LockSettings | null>(null);
  const [bioAvail, setBioAvail] = useState(false);
  const [curPin, setCurPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await appLockService.getSettings();
      if (res?.success && res.data) setS(res.data);
    } catch { /* ignore */ }
  };
  useEffect(() => { load(); biometricAvailable().then(setBioAvail); }, []);

  const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 4);

  const toggleEnabled = async () => {
    if (!s) return;
    const next = !s.is_enabled;
    setS({ ...s, is_enabled: next });
    try { await appLockService.toggle(next); notifyChanged(); toast.success(next ? 'अ‍ॅप लॉक सुरू' : 'अ‍ॅप लॉक बंद'); }
    catch { setS({ ...s, is_enabled: !next }); toast.error('अयशस्वी'); }
  };

  const changeTimeout = async (mins: number) => {
    if (!s) return;
    const prev = s.auto_lock_minutes;
    setS({ ...s, auto_lock_minutes: mins });
    try { await appLockService.setTimeoutMinutes(mins); notifyChanged(); toast.success(`${mins} मिनिटांनी लॉक होईल`); }
    catch { setS({ ...s, auto_lock_minutes: prev }); toast.error('अयशस्वी'); }
  };

  const changePin = async () => {
    if (!/^\d{4}$/.test(newPin)) { toast.error('नवीन PIN ४ अंकी असावा'); return; }
    if (newPin !== confirmPin) { toast.error('PIN जुळत नाही'); return; }
    setSaving(true);
    try {
      const res = await appLockService.changePin(curPin || '1234', newPin);
      if (res?.success) {
        toast.success('PIN बदलला!'); setCurPin(''); setNewPin(''); setConfirmPin('');
        notifyChanged(); load();
      } else toast.error(res?.message || 'चुकीचा सध्याचा PIN');
    } catch (e) { toast.error((e as { message?: string })?.message || 'PIN बदलणे अयशस्वी'); }
    finally { setSaving(false); }
  };

  const toggleBiometric = async () => {
    if (!s) return;
    if (!s.biometric_enabled) {
      // enroll
      const u = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const credId = await registerBiometric(u?.id || 'user', `${u?.first_name || 'User'} ${u?.last_name || ''}`.trim());
      if (!credId) { toast.error('बायोमेट्रिक नोंदणी अयशस्वी / not enrolled'); return; }
      try { await appLockService.setBiometric(true, credId); setS({ ...s, biometric_enabled: true }); notifyChanged(); toast.success('बायोमेट्रिक सुरू'); }
      catch { toast.error('अयशस्वी'); }
    } else {
      try { await appLockService.setBiometric(false); clearStoredCredential(); setS({ ...s, biometric_enabled: false }); notifyChanged(); toast.success('बायोमेट्रिक बंद'); }
      catch { toast.error('अयशस्वी'); }
    }
  };

  const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  if (!s) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
      <ToastContainer />
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <Lock className="h-5 w-5 text-primary-600" /> अ‍ॅप लॉक (MPIN/WPIN)
        </h3>
        {/* enable/disable switch */}
        <button type="button" role="switch" aria-checked={s.is_enabled} onClick={toggleEnabled}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${s.is_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${s.is_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        ५ मिनिट निष्क्रिय राहिल्यास किंवा अ‍ॅप बंद/स्क्रीन ऑफ केल्यास अ‍ॅप लॉक होईल.
      </p>

      {s.is_default_pin && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          हा default PIN <b>1234</b> आहे. तुम्ही तो खाली बदलू शकता किंवा वरील बटणाने बंद करू शकता.
        </div>
      )}

      {s.is_enabled && (
        <>
          {/* inactivity timeout */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <label className="text-sm text-gray-700 dark:text-gray-200">
              निष्क्रियतेनंतर लॉक करा / Auto-lock after inactivity
            </label>
            <select
              value={s.auto_lock_minutes}
              onChange={(e) => changeTimeout(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {[1, 2, 3, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>{m} मिनिट</option>
              ))}
            </select>
          </div>

          {/* change PIN */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">सध्याचा PIN</label>
              <input type="password" inputMode="numeric" value={curPin} onChange={(e) => setCurPin(onlyDigits(e.target.value))} className={inp} placeholder={s.is_default_pin ? '1234' : '••••'} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">नवीन PIN</label>
              <input type="password" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(onlyDigits(e.target.value))} className={inp} placeholder="नवीन ४ अंकी" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">पुन्हा नवीन PIN</label>
              <input type="password" inputMode="numeric" value={confirmPin} onChange={(e) => setConfirmPin(onlyDigits(e.target.value))} className={inp} placeholder="पुन्हा टाका" />
            </div>
          </div>
          <button type="button" onClick={changePin} disabled={saving}
            className="mt-3 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50">
            <ShieldCheck className="h-4 w-4" /> PIN बदला
          </button>

          {/* biometric */}
          {bioAvail && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
              <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <Fingerprint className="h-5 w-5 text-primary-600" /> फिंगरप्रिंट / फेस अनलॉक
              </span>
              <button type="button" role="switch" aria-checked={s.biometric_enabled} onClick={toggleBiometric}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${s.biometric_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${s.biometric_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppLockSettings;

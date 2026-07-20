import { useState, useEffect, useMemo } from 'react';
import { Lock, Eye, EyeOff, Save, X, ShieldCheck, KeyRound, Check } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { commonDdlService } from '../../services/commonDdlService';
import { trackAction } from '../../utils/tracker';
import type { PasswordData } from '../../interfaces/dashboard/ChangePassword.types';

/** Live password-strength score (0–4) + label/colour */
const scorePassword = (pw: string) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const STRENGTH = [
  { label: '', bar: '', text: '' },
  { label: 'कमकुवत / Weak', bar: 'bg-red-500', text: 'text-red-600' },
  { label: 'ठीक / Fair', bar: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'चांगला / Good', bar: 'bg-blue-500', text: 'text-blue-600' },
  { label: 'मजबूत / Strong', bar: 'bg-emerald-500', text: 'text-emerald-600' },
];

/** Password input with leading key icon + show/hide toggle (module-scope to keep focus) */
const PwInput = ({
  name, value, label, show, onToggle, placeholder, onChange, autoFocus,
}: {
  name: string; value: string; label: string; show: boolean;
  onToggle: () => void; placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; autoFocus?: boolean;
}) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        required
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-11 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  </div>
);

const ChangePassword = () => {
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    document.title = 'Change Password - पासवर्ड बदला';
  }, []);

  const [passwordData, setPasswordData] = useState<PasswordData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { oldPassword, newPassword, confirmPassword } = passwordData;

  // live requirement checks
  const checks = useMemo(() => ([
    { ok: newPassword.length >= 8, label: 'किमान 8 अक्षरे / At least 8 characters' },
    { ok: !!newPassword && newPassword !== oldPassword, label: 'जुन्या पासवर्डपेक्षा वेगळा / Different from old password' },
    { ok: !!confirmPassword && newPassword === confirmPassword, label: 'दोन्ही पासवर्ड जुळतात / Both passwords match' },
  ]), [newPassword, oldPassword, confirmPassword]);

  const strength = scorePassword(newPassword);
  const strengthInfo = STRENGTH[strength];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = () => {
    if (!oldPassword) {
      toast.error('कृपया जुना पासवर्ड प्रविष्ट करा! / Please enter your old password!');
      return false;
    }
    if (!newPassword) {
      toast.error('कृपया नवीन पासवर्ड प्रविष्ट करा! / Please enter your new password!');
      return false;
    }
    if (newPassword.length < 8) {
      toast.error('नवीन पासवर्ड किमान 8 अक्षरांचा असावा! / New password must be at least 8 characters!');
      return false;
    }
    if (!confirmPassword) {
      toast.error('कृपया नवीन पासवर्डची पुष्टी करा! / Please confirm your new password!');
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error('नवीन पासवर्ड आणि पुष्टी पासवर्ड जुळत नाहीत! / Passwords do not match!');
      return false;
    }
    if (oldPassword === newPassword) {
      toast.error('नवीन पासवर्ड जुन्या पासवर्डपेक्षा वेगळा असावा! / New password must be different!');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsSubmitting(true);
    try {
      const res = await commonDdlService.changeMyPassword(oldPassword, newPassword);
      if (res?.success) {
        trackAction('पासवर्ड बदलला (Password changed)', { page: '/change-password' });
        toast.success('पासवर्ड यशस्वीरित्या बदलला! / Password changed successfully!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(res?.message || 'पासवर्ड बदलण्यात अयशस्वी! / Failed to change password!');
      }
    } catch (error) {
      const msg = (error as { message?: string })?.message;
      toast.error(msg || 'पासवर्ड बदलण्यात अयशस्वी! / Failed to change password!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () =>
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });

  return (
    <>
      <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">पासवर्ड बदला / Change Password</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">आपला खाते पासवर्ड सुरक्षितपणे अपडेट करा / Securely update your account password</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* LEFT — security info panel */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col items-center bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 px-6 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-white">खाते सुरक्षा / Account Security</h2>
                  <p className="mt-1 text-xs text-white/85">तुमचा पासवर्ड गोपनीय ठेवा</p>
                </div>

                <div className="p-6">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">पासवर्ड आवश्यकता / Requirements</h3>
                  <ul className="space-y-3">
                    {checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-2.5 text-sm">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${c.ok ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400 dark:bg-gray-700'}`}>
                          <Check className="h-3 w-3" />
                        </span>
                        <span className={c.ok ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* RIGHT — form */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                  <Lock className="h-5 w-5 text-primary-600" />
                  पासवर्ड अपडेट करा / Update Password
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <PwInput name="oldPassword" value={oldPassword} label="जुना पासवर्ड / Old Password"
                    show={showOldPassword} onToggle={() => setShowOldPassword((v) => !v)} onChange={handleInputChange}
                    placeholder="जुना पासवर्ड प्रविष्ट करा" autoFocus />

                  <div>
                    <PwInput name="newPassword" value={newPassword} label="नवीन पासवर्ड / New Password"
                      show={showNewPassword} onToggle={() => setShowNewPassword((v) => !v)} onChange={handleInputChange}
                      placeholder="नवीन पासवर्ड प्रविष्ट करा" />
                    {/* strength meter */}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthInfo.bar : 'bg-gray-200 dark:bg-gray-700'}`} />
                          ))}
                        </div>
                        {strengthInfo.label && (
                          <p className={`mt-1 text-xs font-medium ${strengthInfo.text}`}>{strengthInfo.label}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <PwInput name="confirmPassword" value={confirmPassword} label="पासवर्डची पुष्टी / Confirm Password"
                    show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} onChange={handleInputChange}
                    placeholder="नवीन पासवर्ड पुन्हा प्रविष्ट करा" />

                  <div className="flex gap-3 border-t border-gray-100 pt-5 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      <X className="h-5 w-5" />
                      रीसेट / Reset
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          बदलत आहे...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          पासवर्ड बदला / Change
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default ChangePassword;

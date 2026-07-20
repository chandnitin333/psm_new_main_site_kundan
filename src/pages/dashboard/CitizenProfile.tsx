import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, CreditCard, MapPin, Landmark, Map as MapIcon, Building2,
  Camera, KeyRound, BadgeCheck, Mail, Pencil, Save, X,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { commonDdlService } from '../../services/commonDdlService';
import { config } from '../../config';
import { trackAction } from '../../utils/tracker';

const backendBase = config.api.baseUrl.replace(/\/api$/, '');

interface CitizenState {
  firstName: string;
  lastName: string;
  mobileNo: string;
  email: string;
  aadharCardNo: string;
  panCardNo: string;
  address: string;
  designation: string;
  district: string;
  taluka: string;
  gramPanchayat: string;
}

const EMPTY: CitizenState = {
  firstName: '', lastName: '', mobileNo: '', email: '', aadharCardNo: '', panCardNo: '',
  address: '', designation: '', district: '', taluka: '', gramPanchayat: '',
};

/** Read-only label/value row */
const Field = ({
  icon: Icon, label, value,
}: { icon: typeof User; label: string; value: string }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
      <p className="break-words font-semibold text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  </div>
);

/** Editable input row */
const EditField = ({
  icon: Icon, label, value, onChange, placeholder, disabled, hint, below, invalid,
}: {
  icon: typeof User; label: string; value: string;
  onChange?: (v: string) => void; placeholder?: string; disabled?: boolean;
  hint?: string; below?: React.ReactNode; invalid?: boolean;
}) => (
  <div className="flex items-start gap-3 py-3">
    <div className="mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800 ${
          invalid
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 dark:border-gray-600'
        }`}
      />
      {below}
      {hint && !below && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  </div>
);

const CitizenProfile = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const [profileImage, setProfileImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [data, setData] = useState<CitizenState>(EMPTY);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<CitizenState>(EMPTY);
  // 'idle'|'empty'|'checking'|'available'|'self'|'taken'|'invalid'
  const [emailStatus, setEmailStatus] = useState<string>('idle');
  const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = 'माझी प्रोफाइल / My Profile';
  }, []);

  const load = async () => {
    try {
      const res = await commonDdlService.getMyProfile();
      const u = (res?.data ?? {}) as Record<string, unknown>;
      const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
      const next: CitizenState = {
        firstName: str(u.first_name),
        lastName: str(u.last_name),
        mobileNo: str(u.mobile_no),
        email: str(u.email),
        aadharCardNo: str(u.aadhar_card_no),
        panCardNo: str(u.pan_card_no),
        address: str(u.address),
        designation: str(u.designation_name),
        district: str(u.district_name),
        taluka: str(u.taluka_name),
        gramPanchayat: str(u.gram_panchayat_name),
      };
      setData(next);
      const img = str(u.profile_image);
      if (img) setProfileImage(`${backendBase}/${img}`);
    } catch {
      toast.error('प्रोफाइल माहिती मिळवण्यात अयशस्वी / Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'नागरिक';
  const initials = `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`.toUpperCase() || 'N';
  const hasImage = !!profileImage && !imgError;

  const startEdit = () => { setDraft(data); setEmailStatus('idle'); setIsEditing(true); };
  const cancelEdit = () => { setIsEditing(false); setDraft(data); setEmailStatus('idle'); };
  const setField = (k: keyof CitizenState) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));

  // Debounced live email-availability check while editing
  useEffect(() => {
    if (!isEditing) return;
    const email = draft.email.trim();
    if (emailTimer.current) clearTimeout(emailTimer.current);
    if (!email) { setEmailStatus('empty'); return; }
    // unchanged from the saved value -> it's already theirs, no check needed
    if (email.toLowerCase() === (data.email || '').trim().toLowerCase()) {
      setEmailStatus('self');
      return;
    }
    setEmailStatus('checking');
    emailTimer.current = setTimeout(async () => {
      try {
        const res = await commonDdlService.checkMyEmail(email);
        setEmailStatus(res?.data?.status || 'available');
      } catch {
        setEmailStatus('idle'); // network hiccup -> don't block; server re-checks on save
      }
    }, 450);
    return () => { if (emailTimer.current) clearTimeout(emailTimer.current); };
  }, [draft.email, isEditing, data.email]);

  const emailBlocks = emailStatus === 'taken' || emailStatus === 'invalid';
  const saveDisabled = isSaving || emailBlocks || emailStatus === 'checking';

  const handleSave = async () => {
    if (emailBlocks) {
      toast.error('कृपया ईमेल दुरुस्त करा / Please fix the email first');
      return;
    }
    setIsSaving(true);
    try {
      const res = await commonDdlService.updateMyProfile({
        first_name: draft.firstName.trim(),
        last_name: draft.lastName.trim(),
        email: draft.email.trim(),
        pan_card_no: draft.panCardNo.trim().toUpperCase(),
        aadhar_card_no: draft.aadharCardNo.trim(),
        address: draft.address.trim(),
      });
      if (res?.success) {
        trackAction('प्रोफाइल अपडेट केली (Profile updated)', { page: '/profile' });
        toast.success('प्रोफाइल यशस्वीरित्या अपडेट केली! / Profile updated!');
        setIsEditing(false);
        await load();
      } else {
        toast.error(res?.message || 'अपडेट अयशस्वी / Update failed');
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message;
      toast.error(msg || 'अपडेट अयशस्वी / Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('कृपया वैध इमेज फाइल निवडा / Please select a valid image file');
      return;
    }
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => { setImgError(false); setProfileImage(reader.result as string); };
    reader.readAsDataURL(file);
    try {
      const res = await commonDdlService.uploadMyProfileImage(file);
      const savedPath = res?.data?.profile_image;
      if (res?.success && savedPath) {
        setImgError(false);
        setProfileImage(`${backendBase}/${savedPath}?t=${Date.now()}`);
        trackAction('प्रोफाइल फोटो अपडेट केला (Profile photo updated)', { page: '/profile' });
        toast.success('प्रोफाइल फोटो यशस्वीरित्या अपडेट केला! / Profile picture updated!');
      } else {
        throw new Error(res?.message || 'upload failed');
      }
    } catch {
      toast.error('प्रोफाइल फोटो अपलोड करण्यात अयशस्वी! / Failed to upload picture!');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">माझी प्रोफाइल / My Profile</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">आपली वैयक्तिक माहिती / Your personal details</p>
            </div>
            {!isLoading && !isEditing && (
              <button
                type="button"
                onClick={startEdit}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                <Pencil className="h-4 w-4" /> संपादित करा / Edit
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hero banner */}
              <div className="relative overflow-hidden rounded-2xl bg-primary-600 px-6 py-8 text-white shadow-lg">
                <div className="relative z-10 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 bg-white/20 text-3xl font-bold">
                      {hasImage ? (
                        <img src={profileImage} alt={fullName} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-primary-600 shadow-md transition hover:bg-primary-50">
                      {isUploadingImage ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isUploadingImage} />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold">{fullName}</h2>
                    <p className="mt-1 flex items-center justify-center gap-2 text-sm text-white/85 sm:justify-start">
                      <BadgeCheck className="h-4 w-4" />
                      {data.designation || 'मालमत्ता धारक'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal info */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">वैयक्तिक माहिती / Personal Info</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    <EditField icon={User} label="नाव / First Name" value={draft.firstName} onChange={setField('firstName')} placeholder="First name" />
                    <EditField icon={User} label="आडनाव / Last Name" value={draft.lastName} onChange={setField('lastName')} placeholder="Last name" />
                    <EditField icon={Phone} label="मोबाईल / Mobile (login)" value={draft.mobileNo} disabled hint="मोबाईल क्रमांक बदलता येणार नाही (लॉगिन आयडी)" />
                    <EditField
                      icon={Mail}
                      label="ईमेल / Email"
                      value={draft.email}
                      onChange={setField('email')}
                      placeholder="you@example.com"
                      invalid={emailBlocks}
                      below={
                        emailStatus === 'checking' ? (
                          <p className="mt-1 text-[11px] text-gray-400">तपासत आहे… / Checking…</p>
                        ) : emailStatus === 'taken' ? (
                          <p className="mt-1 text-[11px] font-medium text-red-500">हा ईमेल आधीच दुसऱ्या खात्यात वापरला आहे / This email is already used by another account</p>
                        ) : emailStatus === 'invalid' ? (
                          <p className="mt-1 text-[11px] font-medium text-red-500">वैध ईमेल टाका / Enter a valid email</p>
                        ) : emailStatus === 'self' ? (
                          <p className="mt-1 text-[11px] font-medium text-amber-600">हा तुमचा सध्याचा ईमेल आहे / This is your existing email</p>
                        ) : emailStatus === 'available' ? (
                          <p className="mt-1 text-[11px] font-medium text-green-600">ईमेल उपलब्ध आहे / Email available</p>
                        ) : null
                      }
                    />
                    <EditField icon={CreditCard} label="आधार क्रमांक / Aadhar" value={draft.aadharCardNo} onChange={setField('aadharCardNo')} placeholder="12 अंकी" hint="12 digits" />
                    <EditField icon={CreditCard} label="पॅन कार्ड / PAN" value={draft.panCardNo} onChange={setField('panCardNo')} placeholder="ABCDE1234F" hint="e.g. ABCDE1234F" />
                    <EditField icon={MapPin} label="पत्ता / Address" value={draft.address} onChange={setField('address')} placeholder="पत्ता" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    <Field icon={User} label="नाव / Name" value={fullName} />
                    <Field icon={Phone} label="मोबाईल / Mobile" value={data.mobileNo} />
                    <Field icon={Mail} label="ईमेल / Email" value={data.email} />
                    <Field icon={CreditCard} label="आधार क्रमांक / Aadhar" value={data.aadharCardNo} />
                    <Field icon={CreditCard} label="पॅन कार्ड / PAN" value={data.panCardNo} />
                    <Field icon={MapPin} label="पत्ता / Address" value={data.address} />
                  </div>
                )}

                {isEditing && (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saveDisabled}
                      title={emailBlocks ? 'कृपया ईमेल दुरुस्त करा / Please fix the email first' : undefined}
                      className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      जतन करा / Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" /> रद्द / Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Location (read-only) */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">स्थान / Location</h3>
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <Field icon={Building2} label="जिल्हा / District" value={data.district} />
                  <Field icon={MapIcon} label="तालुका / Taluka" value={data.taluka} />
                  <Field icon={Landmark} label="ग्रामपंचायत / Gram Panchayat" value={data.gramPanchayat} />
                </div>
              </div>

              {/* Change password */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => navigate('/change-password')}
                  className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">पासवर्ड बदला</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Change Password</p>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default CitizenProfile;

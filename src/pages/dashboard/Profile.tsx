import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Camera, CreditCard, Building2, Calendar,
  BadgeCheck, Landmark, Map as MapIcon, Home,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { commonDdlService } from '../../services/commonDdlService';
import { config } from '../../config';
import { trackAction } from '../../utils/tracker';
import AppLockSettings from '../../components/applock/AppLockSettings';
import { useBranding } from '../../utils/branding';

const backendBase = config.api.baseUrl.replace(/\/api$/, '');

/** Format a backend date value (ISO / RFC string) to DD-MM-YYYY; '' if missing/invalid */
const formatDate = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '';
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) return String(v);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

interface ProfileState {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  aadharCardNo: string;
  address: string;
  designation: string;
  dateOfJoining: string;
  district: string;
  taluka: string;
  gramPanchayat: string;
  gatGramPanchayat: string;
}

const EMPTY: ProfileState = {
  id: '', firstName: '', lastName: '', email: '', mobileNo: '', aadharCardNo: '',
  address: '', designation: '', dateOfJoining: '',
  district: '', taluka: '', gramPanchayat: '', gatGramPanchayat: '',
};

/** Floating logo decorations scattered across the banner */
const FLOAT_LOGOS = [
  { top: '16%', left: '10%', size: 40, dur: 6, delay: 0, op: 0.22 },
  { top: '52%', left: '26%', size: 30, dur: 7.5, delay: 1.2, op: 0.18 },
  { top: '22%', left: '64%', size: 46, dur: 5.5, delay: 0.6, op: 0.22 },
  { top: '58%', left: '82%', size: 34, dur: 8, delay: 2, op: 0.16 },
  { top: '12%', left: '40%', size: 26, dur: 6.5, delay: 1.6, op: 0.18 },
  { top: '60%', left: '52%', size: 30, dur: 7, delay: 0.9, op: 0.16 },
];

/** A single label/value detail row with a soft icon badge */
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

/** Highlight stat tile */
const Tile = ({
  icon: Icon, label, value, bar, badge,
}: { icon: typeof User; label: string; value: string; bar: string; badge: string }) => (
  <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
    <div className="flex items-center gap-3 pl-1">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${badge}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        <p className="truncate font-bold text-gray-900 dark:text-white">{value || '-'}</p>
      </div>
    </div>
  </div>
);

const Profile = () => {
  const { toast, ToastContainer } = useToast();
  const { logo_url: brandLogo } = useBranding();
  const [profileImage, setProfileImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [data, setData] = useState<ProfileState>(EMPTY);

  useEffect(() => {
    document.title = 'Profile - प्रोफाइल';
  }, []);

  // Load the logged-in user's real profile
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await commonDdlService.getMyProfile();
        if (!active) return;
        const u = (res?.data ?? {}) as Record<string, unknown>;
        const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

        setData({
          id: str(u.id),
          firstName: str(u.first_name),
          lastName: str(u.last_name),
          email: str(u.email),
          mobileNo: str(u.mobile_no),
          aadharCardNo: str(u.aadhar_card_no),
          address: str(u.address),
          designation: str(u.designation_name),
          dateOfJoining: formatDate(u.date_of_joning),
          district: str(u.district_name),
          taluka: str(u.taluka_name),
          gramPanchayat: str(u.gram_panchayat_name),
          gatGramPanchayat: str(u.gat_gram_panchayat_name),
        });

        const img = str(u.profile_image);
        if (img) setProfileImage(`${backendBase}/${img}`);
      } catch {
        if (active) toast.error('प्रोफाइल माहिती मिळवण्यात अयशस्वी / Failed to load profile');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'User';
  const initials = `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  const hasImage = !!profileImage && !imgError;

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
       <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">माझी प्रोफाइल / My Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">आपली वैयक्तिक माहिती / Your personal details</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero banner */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="relative h-44 sm:h-52">
                {/* Green nature scene (sky, sun, rolling hills) — clipped to the banner */}
                <svg
                  className="absolute inset-0 h-full w-full overflow-hidden rounded-t-2xl"
                  viewBox="0 0 1200 320"
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7dd3fc" />
                      <stop offset="55%" stopColor="#a7f3d0" />
                      <stop offset="100%" stopColor="#6ee7b7" />
                    </linearGradient>
                  </defs>
                  {/* sky */}
                  <rect width="1200" height="320" fill="url(#pf-sky)" />
                  {/* sun */}
                  <circle cx="1010" cy="78" r="46" fill="#fde68a" />
                  <circle cx="1010" cy="78" r="62" fill="#fef9c3" opacity="0.35" />
                  {/* clouds */}
                  <g fill="#ffffff" opacity="0.85">
                    <ellipse cx="240" cy="70" rx="55" ry="18" />
                    <ellipse cx="290" cy="78" rx="40" ry="15" />
                    <ellipse cx="520" cy="50" rx="42" ry="14" />
                  </g>
                  {/* back hills */}
                  <path d="M0,210 Q300,140 620,195 T1200,180 V320 H0 Z" fill="#34d399" opacity="0.7" />
                  {/* mid hills */}
                  <path d="M0,245 Q360,180 760,235 T1200,225 V320 H0 Z" fill="#22c55e" opacity="0.85" />
                  {/* front hill / field */}
                  <path d="M0,280 Q420,235 820,275 T1200,272 V320 H0 Z" fill="#15803d" />
                  {/* simple trees on the front hill */}
                  <g>
                    <rect x="156" y="252" width="6" height="20" fill="#854d0e" />
                    <circle cx="159" cy="246" r="16" fill="#166534" />
                    <rect x="930" y="246" width="7" height="24" fill="#854d0e" />
                    <circle cx="933" cy="238" r="19" fill="#166534" />
                  </g>
                </svg>

                {/* animated floating logos */}
                <style>{`
                  @keyframes pf-float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-14px) rotate(8deg); }
                  }
                `}</style>
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  {FLOAT_LOGOS.map((l, i) => (
                    <img
                      key={i}
                      src="/psm_logo1.png"
                      alt=""
                      className="absolute drop-shadow-sm"
                      style={{
                        top: l.top,
                        left: l.left,
                        width: l.size,
                        height: l.size,
                        opacity: l.op,
                        objectFit: 'contain',
                        animation: `pf-float ${l.dur}s ease-in-out ${l.delay}s infinite`,
                      }}
                    />
                  ))}
                </div>

                {/* center logo crest */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 p-2 shadow-lg ring-2 ring-white/60 backdrop-blur-sm sm:h-24 sm:w-24"
                    style={{ animation: 'pf-float 5s ease-in-out infinite' }}
                  >
                    <img src={brandLogo || '/psm_logo1.png'} alt="PSM" className="h-full w-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/psm_logo1.png'; }} />
                  </div>
                </div>

                {/* avatar overlapping bottom */}
                <div className="absolute -bottom-12 left-6 sm:left-8">
                  <div className="relative">
                    {hasImage ? (
                      <img
                        src={profileImage}
                        alt={fullName}
                        className="h-28 w-28 rounded-full border-4 border-white bg-gray-100 object-cover shadow-lg dark:border-gray-800 dark:bg-gray-700"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="flex h-28 w-28 select-none items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-primary-600 text-4xl font-bold text-white shadow-lg dark:border-gray-800">
                        {initials}
                      </div>
                    )}
                    <label
                      htmlFor="profile-image"
                      className={`absolute bottom-1 right-1 cursor-pointer rounded-full bg-primary-600 p-2 text-white shadow-lg transition-colors hover:bg-primary-700 ${isUploadingImage ? 'cursor-not-allowed opacity-60' : ''}`}
                      title="फोटो बदला / Change photo"
                    >
                      {isUploadingImage ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <input
                        type="file" id="profile-image" accept="image/*"
                        onChange={handleImageChange} disabled={isUploadingImage} className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* name + designation */}
              <div className="px-6 pb-6 pl-6 pt-16 sm:pl-44 sm:pt-4">
                <h2 className="flex items-center gap-1.5 text-xl font-bold text-gray-900 dark:text-white">
                  {fullName}
                  <BadgeCheck className="h-5 w-5 fill-emerald-500 text-white" />
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  <span className="inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {data.designation || 'सदस्य'}
                  </span>
                  {data.email && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"><Mail className="h-4 w-4" />{data.email}</span>
                  )}
                  {data.mobileNo && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"><Phone className="h-4 w-4" />{data.mobileNo}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Tile icon={Building2} label="पद / Designation" value={data.designation} bar="bg-purple-500" badge="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300" />
              <Tile icon={Calendar} label="रुजू / Joined" value={data.dateOfJoining} bar="bg-blue-500" badge="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" />
              <Tile icon={Landmark} label="ग्रामपंचायत" value={data.gramPanchayat} bar="bg-emerald-500" badge="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" />
              <Tile icon={BadgeCheck} label="स्थिती / Status" value="कार्यरत" bar="bg-amber-500" badge="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300" />
            </div>

            {/* Detail sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Personal Information */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-2 flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                  <User className="h-5 w-5 text-primary-600" />
                  वैयक्तिक माहिती / Personal Information
                </h3>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  <Field icon={User} label="Full Name / पूर्ण नाव" value={fullName} />
                  <Field icon={Mail} label="Email / ईमेल" value={data.email} />
                  <Field icon={Phone} label="Mobile No. / मोबाइल नंबर" value={data.mobileNo} />
                  <Field icon={CreditCard} label="Aadhar Card / आधार कार्ड" value={data.aadharCardNo} />
                  <Field icon={Calendar} label="Date of Joining / रुजू दिनांक" value={data.dateOfJoining} />
                </div>
              </div>

              {/* Location & Address */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-2 flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  स्थान आणि पत्ता / Location &amp; Address
                </h3>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  <Field icon={MapPin} label="District / जिल्हा" value={data.district} />
                  <Field icon={MapIcon} label="Taluka / तालुका" value={data.taluka} />
                  <Field icon={Landmark} label="Gram Panchayat / ग्रामपंचायत" value={data.gramPanchayat} />
                  <Field icon={Building2} label="Gat Gram Panchayat / गट ग्रामपंचायत" value={data.gatGramPanchayat} />
                  <Field icon={Home} label="Address / पत्ता" value={data.address} />
                </div>
              </div>
            </div>

            {/* App lock (MPIN/WPIN) */}
            <AppLockSettings />
          </div>
        )}
       </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Profile;

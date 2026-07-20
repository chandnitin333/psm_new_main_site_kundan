import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, CreditCard, MapPin, Landmark, KeyRound, Home, BadgeCheck, Building2,
} from 'lucide-react';
import { commonDdlService } from '../../services/commonDdlService';

/** Small label/value row with a soft icon badge */
const Info = ({
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

interface CitizenInfo {
  firstName: string;
  lastName: string;
  mobileNo: string;
  aadharCardNo: string;
  address: string;
  gramPanchayat: string;
  designation: string;
}

const EMPTY: CitizenInfo = {
  firstName: '', lastName: '', mobileNo: '', aadharCardNo: '',
  address: '', gramPanchayat: '', designation: '',
};

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CitizenInfo>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'नागरिक डॅशबोर्ड / Citizen Dashboard';
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await commonDdlService.getMyProfile();
        if (!active) return;
        const u = (res?.data ?? {}) as Record<string, unknown>;
        const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
        setData({
          firstName: str(u.first_name),
          lastName: str(u.last_name),
          mobileNo: str(u.mobile_no),
          aadharCardNo: str(u.aadhar_card_no),
          address: str(u.address),
          gramPanchayat: str(u.gram_panchayat_name),
          designation: str(u.designation_name),
        });
      } catch {
        // fall back to whatever is in localStorage
        try {
          const lu = JSON.parse(localStorage.getItem('user') || '{}');
          setData((d) => ({
            ...d,
            firstName: lu?.first_name || '',
            lastName: lu?.last_name || '',
            mobileNo: lu?.mobile_no || lu?.username || '',
          }));
        } catch { /* ignore */ }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'नागरिक';

  return (
    <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-4xl">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl bg-primary-600 p-6 text-white shadow-lg sm:p-8">
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">स्वागत आहे / Welcome</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{fullName}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
              <BadgeCheck className="h-4 w-4" />
              {data.designation || 'मालमत्ता धारक'}
              {data.gramPanchayat ? ` · ${data.gramPanchayat}` : ''}
            </p>
          </div>
          <Home className="pointer-events-none absolute -right-4 -top-4 h-40 w-40 text-white/10" />
        </div>

        {/* Details card */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">माझी माहिती / My Details</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <Info icon={User} label="नाव / Name" value={fullName} />
              <Info icon={Phone} label="मोबाईल / Mobile" value={data.mobileNo} />
              <Info icon={CreditCard} label="आधार क्रमांक / Aadhar" value={data.aadharCardNo} />
              <Info icon={Landmark} label="ग्रामपंचायत / Gram Panchayat" value={data.gramPanchayat} />
              <Info icon={MapPin} label="पत्ता / Address" value={data.address} />
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/my-property')}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">माझी मालमत्ता</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">My Property — details, history, print, image</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/change-password')}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">पासवर्ड बदला</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Change Password</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;

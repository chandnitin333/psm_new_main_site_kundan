import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, Eye, EyeOff, ShieldCheck, Landmark, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useLoading } from '../../contexts/LoadingContext';
import { authService, type ApiError } from '../../services';
import { api } from '../../services/api';
import { getCmsIcon } from '../../utils/cmsIcons';
import { getLandingPath } from '../../utils/permissions';
import { isSuperUser, getActiveGp } from '../../utils/activeGp';

// fallback icons cycled when an item has no icon chosen in admin
const FEATURE_ICONS = [Landmark, FileText, ShieldCheck];
interface LoginCmsSection {
  section_key: string;
  heading: string | null;
  sub_heading: string | null;
  items: { id: number; heading: string | null; icon: string | null }[];
}
interface Feature { text: string; icon: string | null }

type LoginRole = 'grampanchayat' | 'bdo' | 'super_user';

const Login = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { setLoaderConfig } = useLoading();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [formData, setFormData] = useState({
    loginAs: 'grampanchayat' as LoginRole,
    email: '',
    password: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // dynamic left-panel content (managed from admin → Website Content → Login Page)
  const [brand, setBrand] = useState<{ title: string; subtitle: string; features: Feature[] } | null>(null);

  useEffect(() => {
    api.get<LoginCmsSection[]>('/public/page/login')
      .then((res) => {
        const data = (res?.data || []) as LoginCmsSection[];
        if (!Array.isArray(data) || !data.length) return;
        const hero = data.find((s) => s.section_key === 'hero');
        const feat = data.find((s) => s.section_key === 'features');
        setBrand({
          title: hero?.heading || '',
          subtitle: hero?.sub_heading || '',
          features: (feat?.items || [])
            .map((i) => ({ text: i.heading || '', icon: i.icon }))
            .filter((f) => f.text),
        });
      })
      .catch(() => { /* fall back to static defaults */ });
  }, []);

  const brandTitle = brand?.title || 'ग्रामपंचायत\nडिजिटल प्रशासन';
  const brandSubtitle = brand?.subtitle || 'मालमत्ता नोंदणी, कर आकारणी व वसुली — सर्व एका ठिकाणी, सुरक्षित आणि सोपे.';
  const brandFeatures: Feature[] = brand?.features?.length
    ? brand.features
    : [
        { text: 'मालमत्ता व कर व्यवस्थापन', icon: 'Landmark' },
        { text: 'नमुना ८ / ९ व बिल अहवाल', icon: 'FileText' },
        { text: 'सुरक्षित लॉगिन व OTP पडताळणी', icon: 'ShieldCheck' },
      ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Set page title
  useEffect(() => {
    document.title = 'Login - लॉगिन';
  }, []);

  // Focus on first OTP input when OTP step is shown
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        document.getElementById('otp-0')?.focus();
      }, 100);
    }
  }, [step]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.login(
        formData.email,
        formData.password,
        formData.loginAs
      );

      if (response.success && response.data) {
        // Check if OTP was sent (user/bdo login with OTP enabled)
        if (response.data.otp_sent && response.data.user_id) {
          setUserId(response.data.user_id);
          toast.success(response.message || 'OTP sent to your registered email.');
          setStep('otp');
        } else if (response.data.access_token && response.data.user) {
          // Direct login (admin or OTP disabled) - store auth data
          localStorage.setItem('accessToken', response.data.access_token);
          if (response.data.refresh_token) {
            localStorage.setItem('refreshToken', response.data.refresh_token);
          }
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('userRole', formData.loginAs);
          localStorage.setItem('isAuthenticated', 'true');

          // Set loader config
          setLoaderConfig('ring', 'white-900');

          toast.success(response.message || 'Login successful! Redirecting to dashboard...');
          setTimeout(() => {
            navigate(isSuperUser() && !getActiveGp() ? '/select-gp' : getLandingPath());
          }, 1000);
        }
      } else {
        toast.error(response.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);

    // Focus the next empty box or the last one
    const focusIndex = Math.min(pastedData.length, 5);
    document.getElementById(`otp-${focusIndex}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      toast.error('Please enter all 6 digits of OTP.');
      return;
    }

    if (!userId) {
      toast.error('Session expired. Please login again.');
      setStep('login');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.verifyOtp(
        userId,
        otpValue,
        formData.loginAs
      );

      if (response.success && response.data) {
        toast.success(response.message || 'Login successful! Redirecting to dashboard...');

        // Set loader configuration if provided by backend
        const loaderConfig = response.data.loader_config;
        if (loaderConfig) {
          setLoaderConfig(loaderConfig.type, loaderConfig.color);
        } else {
          // Default loader config
          setLoaderConfig('ring', 'white-900');
        }

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate(isSuperUser() && !getActiveGp() ? '/select-gp' : getLandingPath());
        }, 1000);
      } else {
        toast.error(response.message || 'OTP verification failed. Please try again.');
        // keep the entered OTP so the user can correct it instead of re-typing all 6
        document.getElementById('otp-0')?.focus();
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'OTP verification failed. Please try again.');
      // keep the entered OTP so the user can correct it
      document.getElementById('otp-0')?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <ToastContainer />

      {/* Left Side - Branding with nature scene */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden">
        {/* gradient + decorative scene */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-700" />
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,210 Q300,150 620,195 T1200,180 V300 H0 Z" fill="#ffffff" opacity="0.08" />
          <path d="M0,250 Q360,190 760,240 T1200,230 V300 H0 Z" fill="#ffffff" opacity="0.10" />
        </svg>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-32 top-24 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col justify-center px-14 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 shadow-lg p-2">
            <img src="/psm_logo1.png" alt="PSM" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight">
            {brandTitle.split('\n').map((line, i) => (
              <span key={i}>{i > 0 && <br />}{line}</span>
            ))}
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-primary-50/90">
            {brandSubtitle}
          </p>

          <div className="mt-12 space-y-5">
            {brandFeatures.map((feature, index) => {
              const Icon = getCmsIcon(feature.icon) || FEATURE_ICONS[index % FEATURE_ICONS.length];
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-primary-50">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:p-9">
            {/* Logo */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-2 shadow-md">
                <img src="/psm_logo1.png" alt="PSM" className="h-full w-full object-contain" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                {step === 'login' ? 'पुन्हा स्वागत आहे' : 'OTP पडताळणी'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {step === 'login'
                  ? 'लॉगिन करण्यासाठी तपशील भरा / Sign in to continue'
                  : 'तुमच्या ईमेलवर पाठवलेला 6-अंकी कोड भरा'}
              </p>
            </div>

            {step === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email / Username / Mobile
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="ईमेल, युजरनेम किंवा मोबाइल"
                      className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-gray-900 transition placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password / पासवर्ड
                    </label>
                    <Link
                      to="/forgot-password"
                      tabIndex={-1}
                      className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-11 text-gray-900 transition placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign in / लॉगिन
                    </>
                  )}
                </button>

                {/* Registration temporarily hidden (code kept for later) */}
                <div className="hidden text-center text-sm text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    Register here
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="h-12 w-11 rounded-lg border border-gray-300 bg-white text-center text-lg font-bold text-gray-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:h-14 sm:w-12"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify OTP / पडताळणी'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </button>
              </form>
            )}
          </div>

          {/* Secure note */}
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5" /> सुरक्षित व एन्क्रिप्टेड लॉगिन
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Users } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useLoading } from '../../contexts/LoadingContext';
import { authService, type ApiError } from '../../services';

type LoginRole = 'grampanchayat' | 'bdo';

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
            navigate('/dashboard');
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
          navigate('/dashboard');
        }, 1000);
      } else {
        toast.error(response.message || 'OTP verification failed. Please try again.');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'OTP verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <ToastContainer />

      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <LogIn className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Welcome Back
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            Access your Gram Panchayat dashboard and manage your community's digital governance efficiently.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-primary-50">Role-based access control</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-primary-50">Secure OTP verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg">
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center">
              <LogIn className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {step === 'login' ? 'Welcome back' : 'Verify OTP'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step === 'login'
                ? 'Please enter your details to sign in'
                : 'Enter the 6-digit code sent to your mobile'}
            </p>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {/* Login As */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  Login As
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, loginAs: 'grampanchayat' }))}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.loginAs === 'grampanchayat'
                        ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    Grampanchayat
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, loginAs: 'bdo' }))}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.loginAs === 'bdo'
                        ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    BDO
                  </button>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Demo OTP: <span className="font-semibold text-primary-600 dark:text-primary-400">123456</span>
                  </p>
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
              >
                ← Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

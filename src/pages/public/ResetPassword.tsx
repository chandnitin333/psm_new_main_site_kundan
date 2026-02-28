import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, Key, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { authService, type ApiError } from '../../services';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Reset Password - पासवर्ड रीसेट करा';
  }, []);

  // Auto-focus on password input when page loads
  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if token exists
    if (!token) {
      toast.error('Invalid or missing reset token.');
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long!');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.resetPassword(
        token,
        formData.password
      );

      if (response.success) {
        toast.success(response.message || 'Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show error if no token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <ToastContainer />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <Key className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Create New Password
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            Choose a strong password to secure your account.
          </p>
          <div className="mt-8 space-y-2 text-primary-100">
            <p className="flex items-center">
              <span className="w-2 h-2 bg-primary-300 rounded-full mr-3"></span>
              Use at least 6 characters
            </p>
            <p className="flex items-center">
              <span className="w-2 h-2 bg-primary-300 rounded-full mr-3"></span>
              Include letters and numbers
            </p>
            <p className="flex items-center">
              <span className="w-2 h-2 bg-primary-300 rounded-full mr-3"></span>
              Avoid common passwords
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Back to Login Link */}
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your new password below.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={passwordInputRef}
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Confirm new password"
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

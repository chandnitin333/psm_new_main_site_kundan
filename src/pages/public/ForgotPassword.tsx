import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Key } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { authService, type ApiError } from '../../services';

const ForgotPassword = () => {
  const { toast, ToastContainer } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Forgot Password - पासवर्ड विसरलात';
  }, []);

  // Auto-focus on email input when page loads
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword(email.trim());

      if (response.success) {
        toast.success(response.message || 'Password reset link has been sent to your email address!');
        setEmail('');
      } else {
        toast.error(response.message || 'Failed to send reset link. Please try again.');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Reset Your Password
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <div className="mt-8 space-y-2 text-primary-100">
            <p className="flex items-center">
              <span className="w-2 h-2 bg-primary-300 rounded-full mr-3"></span>
              Secure password reset process
            </p>
            <p className="flex items-center">
              <span className="w-2 h-2 bg-primary-300 rounded-full mr-3"></span>
              Link expires in 24 hours
            </p>
            <p className="flex items-center">
              <span className="w-2 h-2 bg-primary-300 rounded-full mr-3"></span>
              Check your spam folder if not received
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
              Forgot Password?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;

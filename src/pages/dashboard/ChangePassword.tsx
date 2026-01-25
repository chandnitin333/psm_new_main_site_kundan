import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Save, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import type { PasswordData } from '../../interfaces/dashboard/ChangePassword.types';

const ChangePassword = () => {
  const { toast, ToastContainer } = useToast();

  // Set page title
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = () => {
    if (!passwordData.oldPassword) {
      toast.error('Please enter your old password! / कृपया जुना पासवर्ड प्रविष्ट करा!');
      return false;
    }

    if (!passwordData.newPassword) {
      toast.error('Please enter your new password! / कृपया नवीन पासवर्ड प्रविष्ट करा!');
      return false;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters! / नवीन पासवर्ड किमान 8 अक्षरांचा असावा!');
      return false;
    }

    if (!passwordData.confirmPassword) {
      toast.error('Please confirm your new password! / कृपया नवीन पासवर्डची पुष्टी करा!');
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match! / नवीन पासवर्ड आणि पुष्टी पासवर्ड जुळत नाहीत!');
      return false;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error('New password must be different from old password! / नवीन पासवर्ड जुन्या पासवर्डपेक्षा वेगळा असावा!');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // const response = await changePassword({
      //   oldPassword: passwordData.oldPassword,
      //   newPassword: passwordData.newPassword,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSubmitting(false);
      toast.success('Password changed successfully! / पासवर्ड यशस्वीरित्या बदलला!');

      // Reset form
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Failed to change password! / पासवर्ड बदलण्यात अयशस्वी!');
    }
  };

  const handleReset = () => {
    setPasswordData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Change Password / पासवर्ड बदला
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your account password / आपला खाते पासवर्ड अपडेट करा
          </p>
        </div>

        {/* Change Password Card */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg">
              <Lock className="w-12 h-12 text-primary-600" />
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Old Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Old Password / जुना पासवर्ड <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handleInputChange}
                    required
                    autoFocus
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your old password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password / नवीन पासवर्ड <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 8 characters / पासवर्ड किमान 8 अक्षरांचा असावा
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password / पासवर्डची पुष्टी करा <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Re-enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                  Reset / रीसेट करा
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Change Password / पासवर्ड बदला
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Password Requirements */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Password Requirements / पासवर्ड आवश्यकता:
              </h3>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Minimum 8 characters / किमान 8 अक्षरे</li>
                <li>• Must be different from old password / जुन्या पासवर्डपेक्षा वेगळा असावा</li>
                <li>• New password and confirm password must match / नवीन पासवर्ड आणि पुष्टी पासवर्ड समान असावा</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default ChangePassword;

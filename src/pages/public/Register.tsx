import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, MapPin, User, Mail, Phone, Lock } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { DISTRICTS, TALUKAS, GRAM_PANCHAYATS, GAT_GRAM_PANCHAYATS } from '../../assets/data/locations';
import { DESIGNATIONS } from '../../constants';
import { Select2, type Select2Option } from '../../components/common';
import type { RegisterData } from '../../interfaces';

const Register = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Register - नोंदणी';
  }, []);
  const [formData, setFormData] = useState<RegisterData>({
    district: '',
    taluka: '',
    gramPanchayat: '',
    gatGramPanchayat: '',
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    designation: ''
  });

  // Convert data to Select2 options
  const districtOptions: Select2Option[] = useMemo(
    () => DISTRICTS.map(d => ({ value: d.id, label: d.name })),
    []
  );

  const talukaOptions: Select2Option[] = useMemo(
    () => TALUKAS.filter(t => t.parentId === formData.district).map(t => ({ value: t.id, label: t.name })),
    [formData.district]
  );

  const gramPanchayatOptions: Select2Option[] = useMemo(
    () => GRAM_PANCHAYATS.filter(gp => gp.parentId === formData.taluka).map(gp => ({ value: gp.id, label: gp.name })),
    [formData.taluka]
  );

  const gatGramPanchayatOptions: Select2Option[] = useMemo(
    () => GAT_GRAM_PANCHAYATS.filter(ggp => ggp.parentId === formData.gramPanchayat).map(ggp => ({ value: ggp.id, label: ggp.name })),
    [formData.gramPanchayat]
  );

  const designationOptions: Select2Option[] = useMemo(
    () => DESIGNATIONS.map(d => ({ value: d, label: d })),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDistrictChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({
      ...prev,
      district: value as string,
      taluka: '',
      gramPanchayat: '',
      gatGramPanchayat: ''
    }));
  };

  const handleTalukaChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({
      ...prev,
      taluka: value as string,
      gramPanchayat: '',
      gatGramPanchayat: ''
    }));
  };

  const handleGramPanchayatChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({
      ...prev,
      gramPanchayat: value as string,
      gatGramPanchayat: ''
    }));
  };

  const handleGatGramPanchayatChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({
      ...prev,
      gatGramPanchayat: value as string
    }));
  };

  const handleDesignationChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({
      ...prev,
      designation: value as string
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long!');
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number!');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <ToastContainer />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <UserPlus className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Join Us Today
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            Create your account and start managing your Gram Panchayat's digital governance efficiently.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-primary-50">Location-based registration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <span className="text-primary-50">Role-based access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Create an account
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please fill in the details to register
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Location
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    District *
                  </label>
                  <Select2
                    options={districtOptions}
                    value={formData.district}
                    onChange={handleDistrictChange}
                    placeholder="Select District"
                    searchable={true}
                    clearable={false}
                    tabIndex={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Taluka *
                  </label>
                  <Select2
                    options={talukaOptions}
                    value={formData.taluka}
                    onChange={handleTalukaChange}
                    placeholder="Select Taluka"
                    searchable={true}
                    clearable={false}
                    disabled={!formData.district}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Gram Panchayat *
                  </label>
                  <Select2
                    options={gramPanchayatOptions}
                    value={formData.gramPanchayat}
                    onChange={handleGramPanchayatChange}
                    placeholder="Select Gram Panchayat"
                    searchable={true}
                    clearable={false}
                    disabled={!formData.taluka}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Gat Gram Panchayat
                  </label>
                  <Select2
                    options={gatGramPanchayatOptions}
                    value={formData.gatGramPanchayat}
                    onChange={handleGatGramPanchayatChange}
                    placeholder="Select Gat GP (Optional)"
                    searchable={true}
                    clearable={true}
                    disabled={!formData.gramPanchayat}
                  />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Enter first name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Last Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Choose username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10}"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Designation *
                  </label>
                  <Select2
                    options={designationOptions}
                    value={formData.designation}
                    onChange={handleDesignationChange}
                    placeholder="Select Designation"
                    searchable={true}
                    clearable={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
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
                      placeholder="Confirm password"
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

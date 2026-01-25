import { useState, useEffect, useMemo } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, X, CreditCard, Building2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { DISTRICTS, TALUKAS, GRAM_PANCHAYATS, GAT_GRAM_PANCHAYATS } from '../../assets/data/locations';
import { Select2, type Select2Option } from '../../components/common';
import type { ProfileData } from '../../interfaces/dashboard/Profile.types';

const Profile = () => {
  const { toast, ToastContainer } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('/default-avatar.png');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'Profile - प्रोफाइल';
  }, []);

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@grampanchayat.in',
    mobileNo: '+91 9876543210',
    aadharCardNo: '1234 5678 9012',
    district: 'd1',
    taluka: 't1',
    gramPanchayat: 'gp1',
    gatGramPanchayat: 'ggp1',
    address: 'Village Office, Mundikota',
    department: 'Administration',
    bio: 'Dedicated public servant working for the development of Gram Panchayat.',
  });

  // Convert data to Select2 options
  const districtOptions: Select2Option[] = useMemo(
    () => DISTRICTS.map(d => ({ value: d.id, label: d.name })),
    []
  );

  const talukaOptions: Select2Option[] = useMemo(
    () => TALUKAS.filter(t => t.parentId === profileData.district).map(t => ({ value: t.id, label: t.name })),
    [profileData.district]
  );

  const gramPanchayatOptions: Select2Option[] = useMemo(
    () => GRAM_PANCHAYATS.filter(gp => gp.parentId === profileData.taluka).map(gp => ({ value: gp.id, label: gp.name })),
    [profileData.taluka]
  );

  const gatGramPanchayatOptions: Select2Option[] = useMemo(
    () => GAT_GRAM_PANCHAYATS.filter(ggp => ggp.parentId === profileData.gramPanchayat).map(ggp => ({ value: ggp.id, label: ggp.name })),
    [profileData.gramPanchayat]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDistrictChange = (value: string | number | (string | number)[]) => {
    setProfileData(prev => ({
      ...prev,
      district: value as string,
      taluka: '',
      gramPanchayat: '',
      gatGramPanchayat: ''
    }));
  };

  const handleTalukaChange = (value: string | number | (string | number)[]) => {
    setProfileData(prev => ({
      ...prev,
      taluka: value as string,
      gramPanchayat: '',
      gatGramPanchayat: ''
    }));
  };

  const handleGramPanchayatChange = (value: string | number | (string | number)[]) => {
    setProfileData(prev => ({
      ...prev,
      gramPanchayat: value as string,
      gatGramPanchayat: ''
    }));
  };

  const handleGatGramPanchayatChange = (value: string | number | (string | number)[]) => {
    setProfileData(prev => ({
      ...prev,
      gatGramPanchayat: value as string
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);

      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate API call to upload profile image
      try {
        // TODO: Replace with actual API call
        // const formData = new FormData();
        // formData.append('profileImage', file);
        // await uploadProfileImage(formData);

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay

        setIsUploadingImage(false);
        toast.success('Profile picture updated successfully! / प्रोफाइल फोटो यशस्वीरित्या अपडेट केला!');
      } catch (error) {
        setIsUploadingImage(false);
        toast.error('Failed to upload profile picture! / प्रोफाइल फोटो अपलोड करण्यात अयशस्वी!');
      }
    }
  };

  const handleSave = () => {
    // Validation
    if (!profileData.firstName || !profileData.lastName) {
      toast.error('Please fill in all required fields! / सर्व आवश्यक फील्ड भरा!');
      return;
    }

    // Save profile data (integrate with your API)
    // TODO: Call API to update profile
    setIsEditing(false);
    toast.success('Profile updated successfully! / प्रोफाइल यशस्वीरित्या अपडेट केले!');
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data if needed
  };

  // Get display names for location fields
  const getDistrictName = () => DISTRICTS.find(d => d.id === profileData.district)?.name || '';
  const getTalukaName = () => TALUKAS.find(t => t.id === profileData.taluka)?.name || '';
  const getGramPanchayatName = () => GRAM_PANCHAYATS.find(gp => gp.id === profileData.gramPanchayat)?.name || '';
  const getGatGramPanchayatName = () => GAT_GRAM_PANCHAYATS.find(ggp => ggp.id === profileData.gatGramPanchayat)?.name || '';

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile / प्रोफाइल
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal information / आपली वैयक्तिक माहिती व्यवस्थापित करा
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700"></div>

          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Profile Image */}
            <div className="relative -mt-16 mb-4">
              <div className="relative inline-block">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover bg-gray-200 dark:bg-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Admin+User&size=128&background=3b82f6&color=fff';
                  }}
                />
                <label
                  htmlFor="profile-image"
                  className={`absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors ${
                    isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Upload Profile Picture / प्रोफाइल फोटो अपलोड करा"
                >
                  {isUploadingImage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mb-6 gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Edit Profile / प्रोफाइल संपादित करा
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel / रद्द करा
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes / बदल जतन करा
                  </button>
                </>
              )}
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <User className="w-5 h-5 text-primary-600" />
                  Personal Information / वैयक्तिक माहिती
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name / पहिले नाव <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {profileData.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name / आडनाव <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {profileData.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email / ईमेल
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {profileData.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Mobile No. / मोबाइल नंबर
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="mobileNo"
                      value={profileData.mobileNo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {profileData.mobileNo}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Aadhar Card No. / आधार कार्ड क्रमांक
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="aadharCardNo"
                      value={profileData.aadharCardNo}
                      onChange={handleInputChange}
                      maxLength={14}
                      placeholder="1234 5678 9012"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {profileData.aadharCardNo}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Department / विभाग
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={profileData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {profileData.department}
                    </p>
                  )}
                </div>
              </div>

              {/* Location & Address Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  Location & Address / स्थान आणि पत्ता
                </h2>

                <div>
                  {isEditing ? (
                    <Select2
                      options={districtOptions}
                      value={profileData.district}
                      onChange={handleDistrictChange}
                      placeholder="Select District / जिल्हा निवडा"
                      label="District / जिल्हा"
                      searchable={true}
                      clearable={false}
                    />
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        District / जिल्हा
                      </label>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {getDistrictName()}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {isEditing ? (
                    <Select2
                      options={talukaOptions}
                      value={profileData.taluka}
                      onChange={handleTalukaChange}
                      placeholder="Select Taluka / तालुका निवडा"
                      label="Taluka / तालुका"
                      searchable={true}
                      clearable={false}
                      disabled={!profileData.district}
                    />
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Taluka / तालुका
                      </label>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {getTalukaName()}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {isEditing ? (
                    <Select2
                      options={gramPanchayatOptions}
                      value={profileData.gramPanchayat}
                      onChange={handleGramPanchayatChange}
                      placeholder="Select Gram Panchayat / ग्रामपंचायत निवडा"
                      label="Gram Panchayat / ग्रामपंचायत"
                      searchable={true}
                      clearable={false}
                      disabled={!profileData.taluka}
                    />
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gram Panchayat / ग्रामपंचायत
                      </label>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {getGramPanchayatName()}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {isEditing ? (
                    <Select2
                      options={gatGramPanchayatOptions}
                      value={profileData.gatGramPanchayat}
                      onChange={handleGatGramPanchayatChange}
                      placeholder="Select Gat Gram Panchayat / गट ग्रामपंचायत निवडा"
                      label="Gat Gram Panchayat / गट ग्रामपंचायत"
                      searchable={true}
                      clearable={false}
                      disabled={!profileData.gramPanchayat}
                    />
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gat Gram Panchayat / गट ग्रामपंचायत
                      </label>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {getGatGramPanchayatName()}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address / पत्ता
                  </label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">
                      {profileData.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio / माहिती
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">
                      {profileData.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Profile;

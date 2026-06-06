import { useState, useEffect, useMemo } from 'react';
import { User, Mail, Phone, MapPin, Camera, CreditCard, Building2, Calendar } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { DISTRICTS, TALUKAS, GRAM_PANCHAYATS, GAT_GRAM_PANCHAYATS } from '../../assets/data/locations';
import { Select2, type Select2Option } from '../../components/common';
import type { ProfileData } from '../../interfaces/dashboard/Profile.types';
import { commonDdlService } from '../../services/commonDdlService';
import { config } from '../../config';

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

/** Display names that come straight from the backend (joined) */
interface ProfileDisplay {
  district: string;
  taluka: string;
  gramPanchayat: string;
  gatGramPanchayat: string;
  designation: string;
  dateOfJoining: string;
}

const Profile = () => {
  const { toast, ToastContainer } = useToast();
  const [isEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('/default-avatar.png');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    aadharCardNo: '',
    district: '',
    taluka: '',
    gramPanchayat: '',
    gatGramPanchayat: '',
    address: '',
    department: '',
    bio: '',
  });

  // Names + extra fields resolved by the backend (used for read-only display)
  const [display, setDisplay] = useState<ProfileDisplay>({
    district: '',
    taluka: '',
    gramPanchayat: '',
    gatGramPanchayat: '',
    designation: '',
    dateOfJoining: '',
  });

  // Set page title
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

        setProfileData((prev) => ({
          ...prev,
          firstName: str(u.first_name),
          lastName: str(u.last_name),
          email: str(u.email),
          mobileNo: str(u.mobile_no),
          aadharCardNo: str(u.aadhar_card_no),
          district: str(u.district_id),
          taluka: str(u.taluka_id),
          gramPanchayat: str(u.gram_panchayat_id),
          gatGramPanchayat: str(u.gat_gram_panchayat_id),
          address: str(u.address),
          department: str(u.department),
          bio: str(u.bio),
        }));

        setDisplay({
          district: str(u.district_name),
          taluka: str(u.taluka_name),
          gramPanchayat: str(u.gram_panchayat_name),
          gatGramPanchayat: str(u.gat_gram_panchayat_name),
          designation: str(u.designation_name),
          dateOfJoining: formatDate(u.date_of_joning),
        });

        const img = str(u.profile_image);
        if (img) setProfileImage(`${backendBase}/${img}`);
      } catch {
        if (active) toast.error('प्रोफाइल माहिती मिळवण्यात अयशस्वी / Failed to load profile');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials =
    `${profileData.firstName?.[0] ?? ''}${profileData.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  const hasImage = !!profileImage && profileImage !== '/default-avatar.png';

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
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('कृपया वैध इमेज फाइल निवडा / Please select a valid image file');
      return;
    }

    setIsUploadingImage(true);

    // Instant local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImgError(false);
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Upload to backend — saves file + updates users.profile_image in DB
      const res = await commonDdlService.uploadMyProfileImage(file);
      const savedPath = res?.data?.profile_image;
      if (res?.success && savedPath) {
        // Use the persisted path so it survives a refresh
        setImgError(false);
        setProfileImage(`${backendBase}/${savedPath}?t=${Date.now()}`);
        toast.success('प्रोफाइल फोटो यशस्वीरित्या अपडेट केला! / Profile picture updated successfully!');
      } else {
        throw new Error(res?.message || 'upload failed');
      }
    } catch {
      toast.error('प्रोफाइल फोटो अपलोड करण्यात अयशस्वी! / Failed to upload profile picture!');
    } finally {
      setIsUploadingImage(false);
      // allow re-selecting the same file again
      e.target.value = '';
    }
  };

  // Get display names for location fields (resolved by backend join)
  const getDistrictName = () => display.district || DISTRICTS.find(d => d.id === profileData.district)?.name || '';
  const getTalukaName = () => display.taluka || TALUKAS.find(t => t.id === profileData.taluka)?.name || '';
  const getGramPanchayatName = () => display.gramPanchayat || GRAM_PANCHAYATS.find(gp => gp.id === profileData.gramPanchayat)?.name || '';
  const getGatGramPanchayatName = () => display.gatGramPanchayat || GAT_GRAM_PANCHAYATS.find(ggp => ggp.id === profileData.gatGramPanchayat)?.name || '';

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

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Profile Card */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${isLoading ? 'hidden' : ''}`}>
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700"></div>

          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Profile Image */}
            <div className="relative -mt-16 mb-4">
              <div className="relative inline-block">
                {hasImage && !imgError ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover bg-gray-200 dark:bg-gray-700"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-4xl font-bold select-none">
                    {initials}
                  </div>
                )}
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

            <div className="mb-6" />

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
                    Designation / पद
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {display.designation || '-'}
                  </p>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date of Joining / रुजू दिनांक
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {display.dateOfJoining || '-'}
                  </p>
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

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Home, Building2, Factory, Briefcase, Award, TrendingUp, MapPin } from 'lucide-react';
import { useLoading } from '../../contexts/LoadingContext';
import type { CategoryCard } from '../../interfaces/dashboard/Dashboard.types';

const Dashboard = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();

  // Location information
  const locationInfo = {
    district: 'गोंदिया',
    districtEn: 'Gondia',
    taluka: 'तिरोरा',
    talukaEn: 'Tirora',
    gramPanchayat: 'मुंडीकोटा',
    gramPanchayatEn: 'Mundikota',
  };

  // Page load effect with loader
  useEffect(() => {
    document.title = 'Dashboard - डॅशबोर्ड';
    const loadPage = async () => {
      showLoader('डॅशबोर्ड लोड होत आहे... (Loading dashboard...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
    };
    loadPage();
  }, []);

  const categories: CategoryCard[] = [
    {
      id: 'chalu-khatedar',
      title: 'Chalu Khatedar',
      titleMr: 'चालू खातेदार',
      count: 1247,
      icon: <Users className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'bg-blue-400/20',
      textColor: 'text-white',
    },
    {
      id: 'adhikrut',
      title: 'Adhikrut',
      titleMr: 'अधिकृत',
      count: 856,
      icon: <Award className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconColor: 'bg-purple-400/20',
      textColor: 'text-white',
    },
    {
      id: 'indira-awas',
      title: 'Indira Awas',
      titleMr: 'इंदिरा आवास',
      count: 432,
      icon: <Home className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
      iconColor: 'bg-green-400/20',
      textColor: 'text-white',
    },
    {
      id: 'imlakar',
      title: 'Imlakar',
      titleMr: 'इमळाकार',
      count: 324,
      icon: <Building2 className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconColor: 'bg-orange-400/20',
      textColor: 'text-white',
    },
    {
      id: 'ghar-kar',
      title: 'Ghar Kar',
      titleMr: 'घर कर',
      count: 678,
      icon: <Home className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
      iconColor: 'bg-red-400/20',
      textColor: 'text-white',
    },
    {
      id: 'audogyik',
      title: 'Audogyik',
      titleMr: 'औद्योगिक',
      count: 189,
      icon: <Factory className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      iconColor: 'bg-indigo-400/20',
      textColor: 'text-white',
    },
    {
      id: 'manora',
      title: 'Manora',
      titleMr: 'मनोरा',
      count: 542,
      icon: <TrendingUp className="w-8 h-8" />,
      bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
      iconColor: 'bg-teal-400/20',
      textColor: 'text-white',
    },
  ];

  const handleCardClick = async (categoryId: string) => {
    navigate(`/dashboard/category/${categoryId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of all categories / सर्व श्रेणींचे विहंगावलोकन
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCardClick(category.id)}
            className={`${category.bgColor} rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${category.iconColor} p-3 rounded-lg`}>
                  <div className={category.textColor}>
                    {category.icon}
                  </div>
                </div>
                <div className={`text-right ${category.textColor}`}>
                  <div className="text-3xl font-bold">{category.count}</div>
                  <div className="text-sm opacity-90">Records</div>
                </div>
              </div>
              <div className={category.textColor}>
                <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
                <p className="text-sm opacity-90">{category.titleMr}</p>
              </div>
            </div>
            <div className={`${category.bgColor} opacity-90 px-6 py-3 border-t border-white/20`}>
              <p className={`text-sm ${category.textColor} flex items-center justify-between`}>
                <span>View Details</span>
                <span>→</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Location Information and Map */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary-600" />
          Location Information / स्थान माहिती
        </h2>

        {/* Location Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              District / जिल्हा
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {locationInfo.district}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {locationInfo.districtEn}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
              Taluka / तालुका
            </div>
            <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
              {locationInfo.taluka}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              {locationInfo.talukaEn}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
              Gram Panchayat / ग्रामपंचायत
            </div>
            <div className="text-xl font-bold text-green-900 dark:text-green-100">
              {locationInfo.gramPanchayat}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              {locationInfo.gramPanchayatEn}
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
              `${locationInfo.gramPanchayatEn}, ${locationInfo.talukaEn}, ${locationInfo.districtEn}, Maharashtra, India`
            )}&zoom=14&maptype=roadmap`}
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${locationInfo.gramPanchayatEn}`}
            className="w-full"
          ></iframe>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          Map showing {locationInfo.gramPanchayat} ({locationInfo.gramPanchayatEn}), {locationInfo.taluka} ({locationInfo.talukaEn}), {locationInfo.district} ({locationInfo.districtEn})
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { useLoading } from '../../../contexts/LoadingContext';
import { useToast } from '../../../hooks/useToast';
import type { WardData } from '../../../interfaces/dashboard/ahval';

const ShouchalayList = () => {
  const { showLoader, hideLoader } = useLoading();
  const { toast, ToastContainer } = useToast();

  // Sample ward data - replace with actual data from backend
  const [wardsData] = useState<WardData[]>([
    { wardNo: 1, wardName: 'प्रभाग १', totalProperties: 150, totalPopulation: 780, toiletsBuilt: 140 },
    { wardNo: 2, wardName: 'प्रभाग २', totalProperties: 200, totalPopulation: 1050, toiletsBuilt: 190 },
    { wardNo: 3, wardName: 'प्रभाग ३', totalProperties: 180, totalPopulation: 920, toiletsBuilt: 170 },
    { wardNo: 4, wardName: 'प्रभाग ४', totalProperties: 165, totalPopulation: 850, toiletsBuilt: 155 },
    { wardNo: 5, wardName: 'प्रभाग ५', totalProperties: 190, totalPopulation: 980, toiletsBuilt: 180 },
    { wardNo: 6, wardName: 'प्रभाग ६', totalProperties: 175, totalPopulation: 890, toiletsBuilt: 165 },
    { wardNo: 7, wardName: 'प्रभाग ७', totalProperties: 195, totalPopulation: 1020, toiletsBuilt: 185 },
    { wardNo: 8, wardName: 'प्रभाग ८', totalProperties: 185, totalPopulation: 950, toiletsBuilt: 175 },
  ]);

  // Auto-load page with loader
  useEffect(() => {
    document.title = 'Toilet List - शौचालय यादी';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
    };
    loadPage();
  }, []);

  const handleViewReport = async (ward: WardData) => {
    showLoader(`प्रभाग ${ward.wardNo} चा अहवाल उघडत आहे... (Opening Ward ${ward.wardNo} Report...)`);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Store ward data in sessionStorage for the new window to access
    sessionStorage.setItem('shouchalayReportWard', JSON.stringify(ward));

    // Open report in new tab
    const url = `/view-shouchalay-report`;
    const newWindow = window.open(url, '_blank');

    if (newWindow) {
      toast.success(`प्रभाग ${ward.wardNo} चा अहवाल नवीन टॅबमध्ये उघडला (Ward ${ward.wardNo} report opened in new tab)`);
    }

    hideLoader();
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            शौचालय यादी (Toilet List)
          </h1>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              प्रभाग क्रमांकावर क्लिक करा अहवाल पाहण्यासाठी (Click on Ward Number to view report)
            </p>
          </div>

          {/* Ward Numbers Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {wardsData.map((ward) => (
              <button
                key={ward.wardNo}
                onClick={() => handleViewReport(ward)}
                className="aspect-square flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <span className="text-2xl font-bold">{ward.wardNo}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShouchalayList;

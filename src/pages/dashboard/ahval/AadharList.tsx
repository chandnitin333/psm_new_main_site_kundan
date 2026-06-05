import { useState, useEffect } from 'react';
import { useLoading } from '../../../contexts/LoadingContext';
import { useToast } from '../../../hooks/useToast';
import { commonDdlService } from '../../../services';

const AadharList = () => {
  const { showLoader, hideLoader } = useLoading();
  const { toast, ToastContainer } = useToast();

  const [wards, setWards] = useState<(string | number)[]>([]);

  // Load wards dynamically (scoped to the logged-in user's gram panchayat)
  useEffect(() => {
    document.title = 'Aadhar List - आधार यादी';
    (async () => {
      showLoader('वार्ड लोड होत आहेत... (Loading wards...)');
      try {
        const res = await commonDdlService.getWards();
        if (res.success) {
          const list = ((res.data as { ward_number: string | number }[]) || [])
            .map((w) => w.ward_number)
            .filter((w) => w !== null && w !== undefined && w !== '');
          setWards(list);
        }
      } catch (e) {
        console.error('Failed to load wards', e);
        toast.error('वार्ड यादी मिळवण्यात त्रुटी (Error loading wards)');
      } finally {
        hideLoader();
      }
    })();
  }, []);

  const handleViewReport = (ward: string | number) => {
    sessionStorage.setItem('aadharReportWard', String(ward));
    const newWindow = window.open('/view-aadhar-report', '_blank');
    if (newWindow) {
      toast.success(`वार्ड ${ward} चा अहवाल नवीन टॅबमध्ये उघडला (Ward ${ward} report opened)`);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            आधार यादी (Aadhar List)
          </h1>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              वार्ड क्रमांकावर क्लिक करा अहवाल पाहण्यासाठी (Click on Ward Number to view report)
            </p>
          </div>

          {wards.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
              कोणतेही वार्ड उपलब्ध नाहीत (No wards available)
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {wards.map((ward) => (
                <button
                  key={String(ward)}
                  onClick={() => handleViewReport(ward)}
                  className="aspect-square flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <span className="text-2xl font-bold">{ward}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AadharList;

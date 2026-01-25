import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import YearPicker from '../../../components/common/YearPicker';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { DeleteConfirmationModal, useDeleteConfirmation } from '../../../utils/deleteConfirmation';
import type { VasuliFormData, VasuliRecord } from '../../../interfaces/dashboard/vasuli/Vasuli.types';

const Vasuli = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const { deleteConfirmation, handleDeleteClick, cancelDelete, resetDeleteConfirmation } = useDeleteConfirmation();

  const [formData, setFormData] = useState<VasuliFormData>({
    year: new Date().getFullYear().toString(),
    toYear: (new Date().getFullYear() + 1).toString(),
    anuKramank: '',
    malmattaKramank: '',
    wardKramank: '',
    plotKramank: '',
    khasaraKramank: '',
    surveyKramank: '',
    khatedaracheNav: '',
    bhogwatdaracheNav: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // Initialize records from localStorage or use sample data
  const [records, setRecords] = useState<VasuliRecord[]>(() => {
    const savedRecords = localStorage.getItem('vasuliRecords');
    if (savedRecords) {
      try {
        return JSON.parse(savedRecords);
      } catch (e) {
        console.error('Error parsing saved records:', e);
      }
    }
    // Default sample data
    return [
      {
        anuKramank: '001',
        milkatKramank: 'MK-001',
        wardNo: 'W-01',
        khasaraKramank: 'KK-001',
        khatedharkacheNav: 'राम शर्मा',
        bhogwatdaracheNav: 'श्याम पाटील',
        year: '2024-2025'
      },
      {
        anuKramank: '002',
        milkatKramank: 'MK-002',
        wardNo: 'W-02',
        khasaraKramank: 'KK-002',
        khatedharkacheNav: 'सीता देवी',
        bhogwatdaracheNav: 'गीता कुमार',
        year: '2024-2025'
      }
    ];
  });

  // Persist records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vasuliRecords', JSON.stringify(records));
  }, [records]);

  // Handle new record from form submission
  useEffect(() => {
    if (location.state?.newRecord) {
      console.log('📝 Adding new record:', location.state.newRecord);
      setRecords(prev => {
        // Check if record already exists to avoid duplicates (match by multiple fields)
        const newRec = location.state.newRecord;
        const exists = prev.some(r =>
          r.anuKramank === newRec.anuKramank &&
          r.milkatKramank === newRec.milkatKramank &&
          r.wardNo === newRec.wardNo
        );
        if (exists) {
          console.log('⚠️ Record already exists, skipping add');
          return prev;
        }
        console.log('✅ New record added successfully');
        return [location.state.newRecord, ...prev];
      });
      // Clear the location state after a brief delay
      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 100);
    } else if (location.state?.updatedRecord && location.state?.isEdit) {
      // Update existing record
      const updatedRecord = location.state.updatedRecord;
      const originalRecord = location.state.originalRecord;

      console.log('🔄 Update request received');
      console.log('Updated record:', updatedRecord);
      console.log('Original record:', originalRecord);

      setRecords(prev => {
        console.log('Current records in state:', prev);

        // Try to find the record by multiple criteria
        const recordIndex = prev.findIndex((record, index) => {
          console.log(`Checking record ${index}:`, record);

          // First try matching by anuKramank if both exist
          if (record.anuKramank && updatedRecord.anuKramank && record.anuKramank === updatedRecord.anuKramank) {
            console.log(`✅ Match found by anuKramank at index ${index}`);
            return true;
          }

          // If anuKramank doesn't match or is empty, try matching by original record data
          if (originalRecord) {
            const match = record.milkatKramank === originalRecord.milkatKramank &&
                   record.wardNo === originalRecord.wardNo &&
                   record.khasaraKramank === originalRecord.khasaraKramank;
            if (match) {
              console.log(`✅ Match found by original record fields at index ${index}`);
            }
            return match;
          }
          return false;
        });

        console.log('Record index found:', recordIndex);

        if (recordIndex !== -1) {
          const newRecords = [...prev];
          newRecords[recordIndex] = updatedRecord;
          console.log('✅ Record updated successfully at index', recordIndex);
          return newRecords;
        }
        console.log('❌ No matching record found, update failed');
        return prev;
      });

      // Clear the location state after a brief delay
      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 100);
    }
  }, [location.state]);

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(records.length / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Auto-focus on first input (year) when component loads with loader
  useEffect(() => {
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    };
    loadPage();
  }, []);

  // Auto-fill "To Year" when "Year" changes
  useEffect(() => {
    if (formData.year) {
      const yearNum = parseInt(formData.year);
      if (!isNaN(yearNum)) {
        setFormData(prev => ({
          ...prev,
          toYear: (yearNum + 1).toString()
        }));
      }
    }
  }, [formData.year]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (year: string) => {
    setFormData(prev => ({ ...prev, year }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoader('शोधत आहे... (Searching...)');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Search Data:', formData);
    // TODO: Implement search logic
    hideLoader();
  };

  const handleReset = () => {
    setFormData({
      year: new Date().getFullYear().toString(),
      toYear: (new Date().getFullYear() + 1).toString(),
      anuKramank: '',
      malmattaKramank: '',
      wardKramank: '',
      plotKramank: '',
      khasaraKramank: '',
      surveyKramank: '',
      khatedaracheNav: '',
      bhogwatdaracheNav: '',
    });
  };

  const handleAddVasuli = () => {
    navigate('/vasuli/vasuli-form');
  };

  const handleEdit = async (record: VasuliRecord) => {
    showLoader('संपादित करत आहे... (Editing...)');
    await new Promise(resolve => setTimeout(resolve, 500));
    hideLoader();
    // Navigate to form with record data for editing
    navigate('/vasuli/vasuli-form', { state: { record, isEdit: true } });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.index !== null) {
      showLoader('हटवत आहे... (Deleting...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      const updatedRecords = records.filter((_, i) => i !== deleteConfirmation.index);
      setRecords(updatedRecords);
      resetDeleteConfirmation();
      hideLoader();
      toast.success('रेकॉर्ड यशस्वीरित्या हटविला (Record deleted successfully)');
    }
  };

  const handleView = async (record: VasuliRecord) => {
    showLoader('पहात आहे... (Opening view...)');
    await new Promise(resolve => setTimeout(resolve, 500));
    // Open view page in new tab with record data
    const url = `/view-vasuli?id=${record.anuKramank}`;
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      // Store record data in sessionStorage for the new window to access
      sessionStorage.setItem('vasuliViewRecord', JSON.stringify(record));
    }
    hideLoader();
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            वसुली (Vasuli)
          </h1>
          <button
            type="button"
            onClick={handleAddVasuli}
            className="flex items-center gap-2 px-4 py-2 bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-lg hover:bg-green-300 dark:hover:bg-green-800 transition-colors font-medium border border-green-400 dark:border-green-700"
          >
            <Plus className="w-5 h-5" />
            वसुली जोडा (Add Vasuli)
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          {/* First Row - 6 Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                वर्ष (Year)
              </label>
              <YearPicker
                ref={firstInputRef}
                name="year"
                value={formData.year}
                onChange={handleYearChange}
                placeholder="वर्ष निवडा"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ते वर्ष (To Year)
              </label>
              <input
                type="text"
                name="toYear"
                value={formData.toYear}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                placeholder="ते वर्ष"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                अनु क्रमांक
              </label>
              <input
                type="text"
                name="anuKramank"
                value={formData.anuKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="अनु क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                मालमत्ता क्रमांक
              </label>
              <input
                type="text"
                name="malmattaKramank"
                value={formData.malmattaKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="मालमत्ता क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                प्रभाग क्रमांक
              </label>
              <input
                type="text"
                name="wardKramank"
                value={formData.wardKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="प्रभाग क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                प्लॉट क्रमांक
              </label>
              <input
                type="text"
                name="plotKramank"
                value={formData.plotKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="प्लॉट क्रमांक"
              />
            </div>
          </div>

          {/* Second Row - 4 Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                खसरा क्रमांक
              </label>
              <input
                type="text"
                name="khasaraKramank"
                value={formData.khasaraKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="खसरा क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                सर्वे क्रमांक
              </label>
              <input
                type="text"
                name="surveyKramank"
                value={formData.surveyKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="सर्वे क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                खातेदाराचे नाव
              </label>
              <input
                type="text"
                name="khatedaracheNav"
                value={formData.khatedaracheNav}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="खातेदाराचे नाव"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                भोगवटदाराचे नाव
              </label>
              <input
                type="text"
                name="bhogwatdaracheNav"
                value={formData.bhogwatdaracheNav}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="भोगवटदाराचे नाव"
              />
            </div>
          </div>

          {/* Buttons Row - Centered */}
          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
            >
              शोधा (Search)
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
            >
              रीसेट (Reset)
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Sr.No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Anu Kramank
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Milkat Kramank
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Ward No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Khasara Kramank
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Khatedharkache Nav
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Bhogwatdarache Nav
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Kriya
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentRecords.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {indexOfFirstRecord + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.anuKramank}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.milkatKramank}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.wardNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.khasaraKramank}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.khatedharkacheNav}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.bhogwatdaracheNav}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.year}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="संपादित करा (Edit)"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(indexOfFirstRecord + index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="हटवा (Delete)"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleView(record)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="पहा (View)"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {records.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, records.length)} of {records.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                    currentPage === number
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmation.show}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
    </>
  );
};

export default Vasuli;

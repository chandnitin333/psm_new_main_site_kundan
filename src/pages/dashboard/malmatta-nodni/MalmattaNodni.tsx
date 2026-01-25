import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Printer, Image, FileText } from 'lucide-react';
import MagilKarJodaModal from './MagilKarJodaModal';
import PrintModal from './PrintModal';
import ImageUploadModal from './ImageUploadModal';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import type { MalmattaRecord } from '../../../interfaces/dashboard/malmatta-nodni/MalmattaNodni.types';

const MalmattaNodni = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [isMagilKarModalOpen, setIsMagilKarModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MalmattaRecord | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; index: number | null }>({ show: false, index: null });

  // Sample data - replace with actual data
  const [records, setRecords] = useState<MalmattaRecord[]>([
    {
      anuKramank: '001',
      milkatNo: 'M-001',
      wardNo: 'W-01',
      khasaraNo: 'K-001',
      khatedaracheNav: 'राम शर्मा',
      bhogvatdaracheNav: 'श्याम पाटील',
      patta: 'पुणे, महाराष्ट्र'
    },
    // Add more sample records as needed
  ]);

  // Auto-focus and page load with loader
  useEffect(() => {
    document.title = 'Malmatta Nodni - मालमत्ता नोंदणी';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
    };
    loadPage();
  }, []);

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(records.length / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle Edit - Redirect to Nodni Form
  const handleEdit = async (record: MalmattaRecord) => {
    showLoader('संपादित करत आहे... (Editing...)');
    await new Promise(resolve => setTimeout(resolve, 500));
    hideLoader();
    navigate('/nodni-form', { state: { record } });
  };

  // Handle Delete - Show confirmation
  const handleDeleteClick = (index: number) => {
    setDeleteConfirmation({ show: true, index });
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (deleteConfirmation.index !== null) {
      showLoader('हटवत आहे... (Deleting...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      const updatedRecords = records.filter((_, i) => i !== deleteConfirmation.index);
      setRecords(updatedRecords);
      setDeleteConfirmation({ show: false, index: null });
      hideLoader();
      toast.success('रेकॉर्ड यशस्वीरित्या हटविला (Record deleted successfully)');
    }
  };

  // Cancel Delete
  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, index: null });
  };

  // Handle Print - Open print modal
  const handlePrint = async (record: MalmattaRecord) => {
    showLoader('प्रिंट करत आहे... (Printing...)');
    await new Promise(resolve => setTimeout(resolve, 500));
    hideLoader();
    setSelectedRecord(record);
    setIsPrintModalOpen(true);
  };

  // Handle Magil Kar Joda - Open modal
  const handleMagilKarJoda = async (record: MalmattaRecord) => {
    showLoader('मागील कर जोडत आहे... (Adding previous tax...)');
    await new Promise(resolve => setTimeout(resolve, 500));
    hideLoader();
    setSelectedRecord(record);
    setIsMagilKarModalOpen(true);
  };

  // Handle Save from Magil Kar modal
  const handleMagilKarSave = (data: any) => {
    console.log('Magil Kar data saved:', data);
    // TODO: Save the data to backend or state
    toast.success('मागील कर यशस्वीरित्या जतन केले (Previous tax saved successfully)');
  };

  // Handle Image Upload - Open modal
  const handleImageUpload = async (record: MalmattaRecord) => {
    showLoader('इमेज अपलोड करत आहे... (Uploading image...)');
    await new Promise(resolve => setTimeout(resolve, 500));
    hideLoader();
    setSelectedRecord(record);
    setIsImageUploadModalOpen(true);
  };

  // Handle Save from Image Upload modal
  const handleImageUploadSave = (data: any) => {
    console.log('Image upload data saved:', data);
    // TODO: Save the data to backend or state
    toast.success('इमेज यशस्वीरित्या अपलोड केली (Image uploaded successfully)');
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            मालमत्ता नोंदणी (Malmatta Nodni)
          </h1>

        <form className="space-y-6">
          {/* First Row - 6 Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                अनु क्रमांक
              </label>
              <input
                type="text"
                name="anuKramank"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="अनु क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                मालमत्ता नं
              </label>
              <input
                type="text"
                name="malmattaNo"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="मालमत्ता नं"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                प्रभाग क्र.
              </label>
              <input
                type="text"
                name="wardNo"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="प्रभाग क्र."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                प्लॉट नं
              </label>
              <input
                type="text"
                name="plotNo"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="प्लॉट नं"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                खसरा नं
              </label>
              <input
                type="text"
                name="khasaraNo"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="खसरा नं"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                सर्वे नं
              </label>
              <input
                type="text"
                name="surveyNo"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="सर्वे नं"
              />
            </div>
          </div>

          {/* Third Row - 3 Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                खातेदाराचे नाव
              </label>
              <input
                type="text"
                name="khatedaracheNav"
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
                name="bhogvatdaracheNav"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="भोगवटदाराचे नाव"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                पत्ता
              </label>
              <input
                type="text"
                name="patta"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="पत्ता"
              />
            </div>
          </div>

          {/* Buttons Row - Centered */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
            >
              शोधा (Search)
            </button>
            <button
              type="reset"
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
                  Milkat No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Ward No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Khasara No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Khatedharkache Nav
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Bhogwatdharche Nav
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Patta
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Kruti
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
                    {record.milkatNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.wardNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.khasaraNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.khatedaracheNav}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.bhogvatdaracheNav}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {record.patta}
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
                        onClick={() => handlePrint(record)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="प्रिंट करा (Print)"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImageUpload(record)}
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                        title="इमेज (Image)"
                      >
                        <Image className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMagilKarJoda(record)}
                        className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                        title="मागील कर जोडा (Add Previous Tax)"
                      >
                        <FileText className="w-5 h-5" />
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

      {/* Delete Confirmation Popup */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              हटवण्याची पुष्टी (Confirm Delete)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              तुम्हाला खात्री आहे की तुम्हाला हा रेकॉर्ड हटवायचा आहे का?
              <br />
              Are you sure you want to delete this record?
            </p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                हटवा (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
      />

      {/* Magil Kar Joda Modal */}
      <MagilKarJodaModal
        isOpen={isMagilKarModalOpen}
        onClose={() => {
          setIsMagilKarModalOpen(false);
          setSelectedRecord(null);
        }}
        onSave={handleMagilKarSave}
        khatedharkacheNav={selectedRecord?.khatedaracheNav || ''}
        bhogwatdaracheNav={selectedRecord?.bhogvatdaracheNav || ''}
      />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => {
          setIsImageUploadModalOpen(false);
          setSelectedRecord(null);
        }}
        onSave={handleImageUploadSave}
        khatedharkacheNav={selectedRecord?.khatedaracheNav || ''}
      />
      </div>
    </>
  );
};

export default MalmattaNodni;

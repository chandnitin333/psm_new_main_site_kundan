import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Printer, Image, FileText } from 'lucide-react';
import MagilKarJodaModal from './MagilKarJodaModal';
import PrintModal from './PrintModal';
import ImageUploadModal from './ImageUploadModal';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { can } from '../../../utils/permissions';
import { nodniService } from '../../../services';
import { config } from '../../../config';
import type { MalmattaRecord } from '../../../interfaces/dashboard/malmatta-nodni/MalmattaNodni.types';

const MalmattaNodni = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isMagilKarModalOpen, setIsMagilKarModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MalmattaRecord | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });
  const [records, setRecords] = useState<MalmattaRecord[]>([]);

  // Filter form state
  const initialFilters = {
    anu_kramank: '',
    malmatta_number: '',
    ward_kramnak: '',
    plot_number: '',
    khasara_number: '',
    survey_number: '',
    ghar_malkache_nav: '',
    bhogavat_darache_nav: '',
    patta_nagar_layout_society: '',
  };
  const [filters, setFilters] = useState(initialFilters);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // API response type
  type ListResponse = {
    success: boolean;
    data?: {
      records: MalmattaRecord[];
      pagination: {
        current_page: number;
        total_records: number;
        total_pages: number;
      };
    };
  };

  // Handle API response
  const handleApiResponse = (res: ListResponse) => {
    if (res.success && res.data) {
      setRecords(res.data.records || []);
      setTotalRecords(res.data.pagination.total_records);
      setTotalPages(res.data.pagination.total_pages);
      setCurrentPage(res.data.pagination.current_page);
    } else {
      setRecords([]);
      setTotalRecords(0);
      setTotalPages(0);
    }
  };

  // Fetch all records (no filter)
  const fetchRecords = async (page: number) => {
    try {
      showLoader('रेकॉर्ड लोड होत आहे... (Loading records...)');
      const res = await nodniService.search({
        page,
        per_page: recordsPerPage,
        search: '',
      }) as ListResponse;
      handleApiResponse(res);
    } catch {
      setRecords([]);
      toast.error('रेकॉर्ड लोड करताना त्रुटी (Error loading records)');
    } finally {
      hideLoader();
    }
  };

  // Fetch filtered records
  const fetchFilteredRecords = async (page: number) => {
    try {
      showLoader('रेकॉर्ड शोधत आहे... (Searching records...)');
      // Build payload with only non-empty filter values
      const payload: Record<string, unknown> = {
        page,
        per_page: recordsPerPage,
      };
      for (const [key, value] of Object.entries(filters)) {
        if (value.trim()) {
          payload[key] = value.trim();
        }
      }
      const res = await nodniService.filter(payload) as ListResponse;
      handleApiResponse(res);
    } catch {
      setRecords([]);
      toast.error('रेकॉर्ड शोधताना त्रुटी (Error searching records)');
    } finally {
      hideLoader();
    }
  };

  // Track whether filter is active
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Load on mount
  useEffect(() => {
    document.title = 'Malmatta Nodni - मालमत्ता नोंदणी';
    fetchRecords(1);
  }, []);

  const paginate = (pageNumber: number) => {
    if (isFilterActive) {
      fetchFilteredRecords(pageNumber);
    } else {
      fetchRecords(pageNumber);
    }
  };

  // Handle Search - use filter API
  const handleSearch = () => {
    setCurrentPage(1);
    setIsFilterActive(true);
    fetchFilteredRecords(1);
  };

  // Handle Reset - clear filters and load all
  const handleReset = () => {
    setFilters(initialFilters);
    setIsFilterActive(false);
    setCurrentPage(1);
    fetchRecords(1);
  };

  // Handle Edit - Fetch full details and redirect to Nodni Form
  const handleEdit = async (record: MalmattaRecord) => {
    showLoader('संपादित करत आहे... (Editing...)');
    try {
      const res = await nodniService.getById(record.id) as { success: boolean; data?: Record<string, unknown> };
      hideLoader();
      if (res.success && res.data) {
        navigate('/nodni-form', { state: { editData: res.data } });
      } else {
        navigate('/nodni-form', { state: { editData: record } });
      }
    } catch {
      hideLoader();
      navigate('/nodni-form', { state: { editData: record } });
    }
  };

  // Handle Delete - Show confirmation
  const handleDeleteClick = (id: number) => {
    setDeleteConfirmation({ show: true, id });
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (deleteConfirmation.id === null) return;
    try {
      showLoader('हटवत आहे... (Deleting...)');
      await nodniService.delete(deleteConfirmation.id);
      hideLoader();
      setDeleteConfirmation({ show: false, id: null });
      toast.success('रेकॉर्ड यशस्वीरित्या हटविला (Record deleted successfully)');
      fetchRecords(currentPage);
    } catch (error: any) {
      hideLoader();
      setDeleteConfirmation({ show: false, id: null });
      toast.error(error?.message || 'रेकॉर्ड हटवणे अयशस्वी (Delete failed)');
    }
  };

  // Cancel Delete
  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, id: null });
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
    toast.success('मागील कर यशस्वीरित्या जतन केले (Previous tax saved successfully)');
  };

  // Handle Image Upload - Open modal
  const handleImageUpload = async (record: MalmattaRecord) => {
    setSelectedRecord(record);
    setExistingImageUrl(null);
    try {
      showLoader('माहिती लोड करत आहे... (Loading...)');
      const response = await nodniService.getImagesByNodni(record.id);
      hideLoader();
      const images = (response.data as any[]) || [];
      if (images.length > 0) {
        const backendBase = config.api.baseUrl.replace(/\/api$/, '');
        setExistingImageUrl(`${backendBase}/${images[0].image_path}`);
      }
    } catch {
      hideLoader();
    }
    setIsImageUploadModalOpen(true);
  };

  // Handle Save from Image Upload modal
  const handleImageUploadSave = async (data: { khatedharkacheNav: string; imageFile: File | null; imagePreview: string | null }) => {
    if (!data.imageFile) {
      toast.error('कृपया इमेज निवडा (Please select an image)');
      return;
    }
    if (!selectedRecord) return;

    try {
      showLoader('इमेज अपलोड करत आहे... (Uploading image...)');
      await nodniService.uploadImage(selectedRecord.id, data.imageFile);
      hideLoader();
      setIsImageUploadModalOpen(false);
      setSelectedRecord(null);
      toast.success('इमेज यशस्वीरित्या अपलोड केली (Image uploaded successfully)');
    } catch (error: any) {
      hideLoader();
      toast.error(error?.message || 'इमेज अपलोड अयशस्वी (Image upload failed)');
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            मालमत्ता नोंदणी (Malmatta Nodni)
          </h1>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            {/* First Row - 6 Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  अनु क्रमांक
                </label>
                <input
                  type="text"
                  name="anu_kramank"
                  value={filters.anu_kramank}
                  onChange={handleFilterChange}
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
                  name="malmatta_number"
                  value={filters.malmatta_number}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="मालमत्ता नं"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  वॉर्ड क्र.
                </label>
                <input
                  type="text"
                  name="ward_kramnak"
                  value={filters.ward_kramnak}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="वॉर्ड क्र."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  प्लॉट नं
                </label>
                <input
                  type="text"
                  name="plot_number"
                  value={filters.plot_number}
                  onChange={handleFilterChange}
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
                  name="khasara_number"
                  value={filters.khasara_number}
                  onChange={handleFilterChange}
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
                  name="survey_number"
                  value={filters.survey_number}
                  onChange={handleFilterChange}
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
                  name="ghar_malkache_nav"
                  value={filters.ghar_malkache_nav}
                  onChange={handleFilterChange}
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
                  name="bhogavat_darache_nav"
                  value={filters.bhogavat_darache_nav}
                  onChange={handleFilterChange}
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
                  name="patta_nagar_layout_society"
                  value={filters.patta_nagar_layout_society}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="पत्ता"
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
                    अ.क्र.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    अनु क्रमांक
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    मिळकत क्र.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    वॉर्ड क्र.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    खसरा क्र.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    खातेदाराचे नाव
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    भोगवटदाराचे नाव
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    पत्ता
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    कृती
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      कोणतेही रेकॉर्ड सापडले नाहीत (No records found)
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {(currentPage - 1) * recordsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {record.anu_kramank}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {record.malmatta_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {record.ward_kramnak}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {record.khasara_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {record.ghar_malkache_nav}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {record.bhogavat_darache_nav}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {record.patta_nagar_layout_society}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {can('malmatta_nodni', 'edit') && (
                          <button
                            type="button"
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="संपादित करा (Edit)"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          )}
                          {can('malmatta_nodni', 'delete') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(record.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="हटवा (Delete)"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          )}
                          {can('malmatta_nodni', 'print') && (
                          <button
                            type="button"
                            onClick={() => handlePrint(record)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                            title="प्रिंट करा (Print)"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                          )}
                          {can('malmatta_nodni', 'image_upload') && (
                          <button
                            type="button"
                            onClick={() => handleImageUpload(record)}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                            title="इमेज (Image)"
                          >
                            <Image className="w-5 h-5" />
                          </button>
                          )}
                          {can('malmatta_nodni', 'magil_kar') && (
                          <button
                            type="button"
                            onClick={() => handleMagilKarJoda(record)}
                            className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                            title="मागील कर जोडा (Add Previous Tax)"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalRecords > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} entries
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
                    className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${currentPage === number
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
          nodniId={selectedRecord?.id || null}
          khatedharkacheNav={selectedRecord?.ghar_malkache_nav || ''}
          bhogwatdaracheNav={selectedRecord?.bhogavat_darache_nav || ''}
        />

        {/* Image Upload Modal */}
        <ImageUploadModal
          isOpen={isImageUploadModalOpen}
          onClose={() => {
            setIsImageUploadModalOpen(false);
            setSelectedRecord(null);
            setExistingImageUrl(null);
          }}
          onSave={handleImageUploadSave}
          khatedharkacheNav={selectedRecord?.ghar_malkache_nav || ''}
          existingImageUrl={existingImageUrl}
        />
      </div>
    </>
  );
};

export default MalmattaNodni;

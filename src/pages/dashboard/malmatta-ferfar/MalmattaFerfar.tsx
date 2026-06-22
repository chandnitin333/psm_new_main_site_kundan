import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, File } from 'lucide-react';
import YearPicker from '../../../components/common/YearPicker';
import { MarathiInput } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { DeleteConfirmationModal, useDeleteConfirmation } from '../../../utils/deleteConfirmation';
import { ferfarService } from '../../../services';
import { can } from '../../../utils/permissions';
import { trackAction } from '../../../utils/tracker';
import type { MalmattaFerfarFormData, MalmattaFerfarRecord } from '../../../interfaces/dashboard/malmatta-ferfar/MalmattaFerfar.types';

const MalmattaFerfar = () => {
  const navigate = useNavigate();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { toast, ToastContainer } = useToast();
  const { deleteConfirmation, handleDeleteClick, cancelDelete, resetDeleteConfirmation } = useDeleteConfirmation();
  const { showLoader, hideLoader } = useLoading();

  const [formData, setFormData] = useState<MalmattaFerfarFormData>({
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

  const [records, setRecords] = useState<MalmattaFerfarRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [recordsPerPage] = useState(10);


  const fetchRecords = async (page: number, filters?: MalmattaFerfarFormData) => {
    const f = filters || formData;
    showLoader('लोड होत आहे...');
    try {
      const payload: Record<string, unknown> = { page, per_page: recordsPerPage };
      if (f.year) payload.year = f.year;
      if (f.anuKramank) payload.anu_kramank = f.anuKramank;
      if (f.malmattaKramank) payload.malmatta_number = f.malmattaKramank;
      if (f.wardKramank) payload.ward_kramnak = f.wardKramank;
      if (f.plotKramank) payload.plot_number = f.plotKramank;
      if (f.khasaraKramank) payload.khasara_number = f.khasaraKramank;
      if (f.surveyKramank) payload.survey_number = f.surveyKramank;
      if (f.khatedaracheNav) payload.ghar_malkache_nav_lihun_denar = f.khatedaracheNav;
      if (f.bhogwatdaracheNav) payload.nav_lihun_ghenara = f.bhogwatdaracheNav;

      const response = await ferfarService.list(payload);
      if (response.success && response.data) {
        const data = response.data as any;
        setRecords(data.records || []);
        setTotalRecords(data.total || 0);
        setTotalPages(data.pages || 1);
        setCurrentPage(data.page || page);
      } else {
        setRecords([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch {
      toast.error('डेटा लोड करताना त्रुटी आली');
    } finally {
      hideLoader();
    }
  };

  // On mount: load records and focus first input
  useEffect(() => {
    document.title = 'Malmatta Ferfar - मालमत्ता फेरफार';
    fetchRecords(1);
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  // Auto-fill "To Year" when "Year" changes
  useEffect(() => {
    if (formData.year) {
      const yearNum = parseInt(formData.year);
      if (!isNaN(yearNum)) {
        setFormData(prev => ({ ...prev, toYear: (yearNum + 1).toString() }));
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
    await fetchRecords(1);
  };

  const handleReset = () => {
    const resetData: MalmattaFerfarFormData = {
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
    };
    setFormData(resetData);
    fetchRecords(1, resetData);
  };

  const paginate = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchRecords(page);
    }
  };

  const handleAddFerfar = () => {
    navigate('/malmatta-ferfar/ferfar-form');
  };

  const handleEdit = async (record: MalmattaFerfarRecord) => {
    showLoader('लोड होत आहे... (Loading...)');
    try {
      const response = await ferfarService.getById(record.id);
      hideLoader();
      if (response.success && response.data) {
        navigate('/malmatta-ferfar/ferfar-form', { state: { record: response.data, isEdit: true } });
      } else {
        toast.error('रेकॉर्ड लोड अयशस्वी (Failed to load record)');
      }
    } catch {
      hideLoader();
      toast.error('रेकॉर्ड लोड अयशस्वी (Failed to load record)');
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.index !== null) {
      showLoader('हटवत आहे... (Deleting...)');
      try {
        const response = await ferfarService.delete(deleteConfirmation.index);
        if (response.success) {
          trackAction(
            `मालमत्ता फेरफार रेकॉर्ड हटवला (Delete) — id: ${deleteConfirmation.index}`,
            { mode: 'delete', ferfar_id: deleteConfirmation.index, page: '/malmatta-ferfar' }
          );
          await fetchRecords(currentPage);
          toast.success('रेकॉर्ड यशस्वीरित्या हटविला (Record deleted successfully)');
        } else {
          toast.error((response as any).message || 'हटवताना त्रुटी आली');
        }
      } catch {
        toast.error('हटवताना त्रुटी आली');
      } finally {
        resetDeleteConfirmation();
        hideLoader();
      }
    }
  };

  const handlePDF = (record: MalmattaFerfarRecord) => {
    navigate('/malmatta-ferfar/pdf-management', { state: { ferfarId: record.id } });
  };

  const indexOfFirstRecord = (currentPage - 1) * recordsPerPage;

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            मालमत्ता फेरफार (Malmatta Ferfar)
          </h1>
          {can('malmatta_ferfar', 'add') && (
          <button
            type="button"
            onClick={handleAddFerfar}
            className="flex items-center gap-2 px-4 py-2 bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-lg hover:bg-green-300 dark:hover:bg-green-800 transition-colors font-medium border border-green-400 dark:border-green-700"
          >
            <Plus className="w-5 h-5" />
            फेरफार जोडा (Add Ferfar)
          </button>
          )}
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
                वॉर्ड क्र.
              </label>
              <input
                type="text"
                name="wardKramank"
                value={formData.wardKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="वॉर्ड क्र."
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
              <MarathiInput
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
              <MarathiInput
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
                  अ. क्र.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  अनु क्रमांक
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  मिळकत क्रमांक
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  वॉर्ड क्र.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  खसरा क्रमांक
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  खातेदाराचे नाव
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  भोगवटदाराचे नाव
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  वर्ष
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  क्रिया
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    कोणतेही रेकॉर्ड सापडले नाहीत (No records found)
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {indexOfFirstRecord + index + 1}
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
                      {record.ghar_malkache_nav_lihun_denar}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {record.nav_lihun_ghenara}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {record.year}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {can('malmatta_ferfar', 'edit') && (
                        <button
                          type="button"
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="संपादित करा (Edit)"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        )}
                        {can('malmatta_ferfar', 'delete') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(record.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="हटवा (Delete)"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        )}
                        {can('malmatta_ferfar', 'pdf') && (
                        <button
                          type="button"
                          onClick={() => handlePDF(record)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          title="PDF जोडा/डाउनलोड करा (Add PDF/Download PDF)"
                        >
                          <File className="w-5 h-5" />
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
              Showing {indexOfFirstRecord + 1} to {indexOfFirstRecord + records.length} of {totalRecords} entries
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

export default MalmattaFerfar;

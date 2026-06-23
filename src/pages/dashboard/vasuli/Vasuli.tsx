import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, BookOpen, Smartphone } from 'lucide-react';
import YearPicker from '../../../components/common/YearPicker';
import { MarathiInput } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { DeleteConfirmationModal, useDeleteConfirmation } from '../../../utils/deleteConfirmation';
import { vasuliService, type VasuliListPayload } from '../../../services/vasuliService';
import { can, canModule } from '../../../utils/permissions';
import { trackAction } from '../../../utils/tracker';
import type { VasuliFormData, VasuliRecord } from '../../../interfaces/dashboard/vasuli/Vasuli.types';

interface VasuliApiRecord {
  id: number;
  anu_kramank: string;
  malmatta_number: string;
  ward_number: string;
  khasara_kramank: string;
  khatedharkache_nav: string;
  bhogwatdarache_nav: string;
  year: string;
  to_year: string;
}

const mapApiRecord = (r: VasuliApiRecord): VasuliRecord => ({
  id: r.id,
  anuKramank: r.anu_kramank ?? '',
  milkatKramank: r.malmatta_number ?? '',
  wardNo: r.ward_number ?? '',
  khasaraKramank: r.khasara_kramank ?? '',
  khatedharkacheNav: r.khatedharkache_nav ?? '',
  bhogwatdaracheNav: r.bhogwatdarache_nav ?? '',
  year: r.to_year ? `${r.year}-${r.to_year}` : (r.year ?? ''),
});

const Vasuli = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const recordsPerPage = 10;
  const [records, setRecords] = useState<VasuliRecord[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: recordsPerPage,
    total_records: 0,
    total_pages: 0,
  });
  // Filters applied to the current listing (preserved across pagination)
  const filtersRef = useRef<VasuliListPayload>({});

  const fetchRecords = async (page: number, filters: VasuliListPayload) => {
    filtersRef.current = filters;
    showLoader('लोड होत आहे... (Loading...)');
    try {
      const res = await vasuliService.list({ ...filters, page, per_page: recordsPerPage });
      if (res.success && res.data) {
        const d = res.data as { records?: VasuliApiRecord[]; pagination?: typeof pagination };
        setRecords((d.records ?? []).map(mapApiRecord));
        if (d.pagination) setPagination(d.pagination);
      } else {
        toast.error(res.message || 'डेटा लोड करण्यात अयशस्वी (Failed to load data)');
      }
    } catch (err) {
      const message = (err as { message?: string })?.message || 'काहीतरी चूक झाली (Something went wrong)';
      toast.error(message);
    } finally {
      hideLoader();
    }
  };

  // Build filter payload from the search form (only non-empty fields)
  const buildFilters = (): VasuliListPayload => {
    const f: VasuliListPayload = {};
    if (formData.year) f.year = formData.year;
    if (formData.anuKramank) f.anu_kramank = formData.anuKramank;
    if (formData.malmattaKramank) f.malmatta_number = formData.malmattaKramank;
    if (formData.wardKramank) f.ward_number = formData.wardKramank;
    if (formData.plotKramank) f.plot_number = formData.plotKramank;
    if (formData.khasaraKramank) f.khasara_kramank = formData.khasaraKramank;
    if (formData.surveyKramank) f.survey_number = formData.surveyKramank;
    if (formData.khatedaracheNav) f.khatedharkache_nav = formData.khatedaracheNav;
    if (formData.bhogwatdaracheNav) f.bhogwatdarache_nav = formData.bhogwatdaracheNav;
    return f;
  };

  const indexOfFirstRecord = (pagination.current_page - 1) * pagination.per_page;
  const totalPages = pagination.total_pages;

  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > pagination.total_pages) return;
    fetchRecords(pageNumber, filtersRef.current);
  };

  // Initial load: fetch all records (gram-panchayat scoped) and focus first input.
  // If a global-search deep link passed anu_kramank / ward_number, prefill + search.
  useEffect(() => {
    const anu = searchParams.get('anu_kramank') || '';
    const ward = searchParams.get('ward_number') || '';
    if (anu || ward) {
      setFormData((prev) => ({ ...prev, anuKramank: anu, wardKramank: ward }));
      const f: VasuliListPayload = {};
      if (anu) f.anu_kramank = anu;
      if (ward) f.ward_number = ward;
      fetchRecords(1, f);
    } else {
      fetchRecords(1, {});
    }
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords(1, buildFilters());
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
    // Clear filters and reload full (gram-panchayat scoped) list
    fetchRecords(1, {});
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
    if (deleteConfirmation.index === null) return;
    const record = records[deleteConfirmation.index];
    if (!record?.id) {
      resetDeleteConfirmation();
      toast.error('रेकॉर्ड आयडी सापडला नाही (Record id not found)');
      return;
    }
    showLoader('हटवत आहे... (Deleting...)');
    try {
      const res = await vasuliService.delete(record.id);
      if (res.success) {
        trackAction(
          `वसुली रेकॉर्ड हटवला (Delete) — खातेदार: ${(record as any).khatedarkacheNav || (record as any).ghar_malkache_nav || '-'}, id: ${record.id}`,
          { mode: 'delete', vasuli_id: record.id, page: '/vasuli' }
        );
        toast.success('रेकॉर्ड यशस्वीरित्या हटविला (Record deleted successfully)');
        // Reload current page with active filters
        await fetchRecords(pagination.current_page, filtersRef.current);
      } else {
        toast.error(res.message || 'हटवण्यात अयशस्वी (Failed to delete)');
      }
    } catch (err) {
      const message = (err as { message?: string })?.message || 'काहीतरी चूक झाली (Something went wrong)';
      toast.error(message);
    } finally {
      resetDeleteConfirmation();
      hideLoader();
    }
  };

  const handleView = async (record: VasuliRecord) => {
    showLoader('पहात आहे... (Opening view...)');
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!record.id) {
      hideLoader();
      toast.error('रेकॉर्ड आयडी सापडला नाही (Record id not found)');
      return;
    }
    // Open view page in new tab; ViewVasuli fetches full record by id
    window.open(`/view-vasuli?id=${record.id}`, '_blank');
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
          <div className="flex items-center gap-2">
          {canModule('vasuli_field') && (
          <button
            type="button"
            onClick={() => navigate('/collection-mode')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <Smartphone className="w-5 h-5" />
            फिरती वसुली
          </button>
          )}
          {canModule('vasuli_daybook') && (
          <button
            type="button"
            onClick={() => navigate('/collection-daybook')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <BookOpen className="w-5 h-5" />
            दैनिक रजिस्टर
          </button>
          )}
          {can('vasuli', 'add') && (
          <button
            type="button"
            onClick={handleAddVasuli}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            वसुली जोडा (Add Vasuli)
          </button>
          )}
          </div>
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
              {records.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    कोणतीही नोंद आढळली नाही (No records found)
                  </td>
                </tr>
              )}
              {records.map((record, index) => (
                <tr key={record.id ?? index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                      {can('vasuli', 'edit') && (
                      <button
                        type="button"
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="संपादित करा (Edit)"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      )}
                      {can('vasuli', 'delete') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="हटवा (Delete)"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      )}
                      {can('vasuli', 'view') && (
                      <button
                        type="button"
                        onClick={() => handleView(record)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="पहा (View)"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination (server-driven) */}
        {pagination.total_records > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {indexOfFirstRecord + 1} to {indexOfFirstRecord + records.length} of {pagination.total_records} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => paginate(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                    pagination.current_page === number
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={() => paginate(pagination.current_page + 1)}
                disabled={pagination.current_page >= totalPages}
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

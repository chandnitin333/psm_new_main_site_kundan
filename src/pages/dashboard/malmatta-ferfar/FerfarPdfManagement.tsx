import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, Download } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { ferfarService } from '../../../services';
import { config } from '../../../config';

interface PdfRecord {
  id: number;
  customer_ferfar_yadi_id: number;
  file_path: string;
  file_name: string;
  user_id: number;
  created_at: string;
}

const FerfarPdfManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();

  const ferfarId: number | null = location.state?.ferfarId || null;

  const [formData, setFormData] = useState({ fileName: '', pdfFile: null as File | null });
  const [records, setRecords] = useState<PdfRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [recordsPerPage] = useState(10);

  const fetchRecords = async (page: number) => {
    if (!ferfarId) return;
    showLoader('लोड होत आहे...');
    try {
      const response = await ferfarService.listPdfs({ ferfar_id: ferfarId, page, per_page: recordsPerPage });
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

  useEffect(() => {
    document.title = 'PDF Management - PDF व्यवस्थापन';
    fetchRecords(1);
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('कृपया फक्त PDF फाइल निवडा (Please select only PDF files)');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFormData(prev => ({
        ...prev,
        pdfFile: file,
        fileName: prev.fileName || file.name.replace('.pdf', ''),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ferfarId) {
      toast.error('Ferfar ID सापडला नाही (Ferfar ID not found)');
      return;
    }
    if (!formData.fileName.trim()) {
      toast.error('कृपया फाइल नाव भरा (Please enter file name)');
      return;
    }
    if (!formData.pdfFile) {
      toast.error('कृपया PDF फाइल निवडा (Please select a PDF file)');
      return;
    }

    showLoader('PDF अपलोड होत आहे...');
    try {
      const response = await ferfarService.uploadPdf(ferfarId, formData.pdfFile, formData.fileName.trim());
      hideLoader();
      if (response.success) {
        toast.success('PDF यशस्वीरित्या अपलोड केले (PDF uploaded successfully)');
        setFormData({ fileName: '', pdfFile: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchRecords(1);
      } else {
        toast.error((response as any).message || 'PDF अपलोड अयशस्वी');
      }
    } catch {
      hideLoader();
      toast.error('PDF अपलोड अयशस्वी (Upload failed)');
    }
  };

  const handleDownload = (record: PdfRecord) => {
    const backendBase = config.api.baseUrl.replace(/\/api$/, '');
    const url = `${backendBase}/${record.file_path}`;
    window.open(url, '_blank');
  };

  const paginate = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchRecords(page);
    }
  };

  const handleBack = () => {
    navigate('/malmatta-ferfar');
  };

  const indexOfFirstRecord = (currentPage - 1) * recordsPerPage;

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        {/* Upload Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            फेरफार PDF व्यवस्थापन (Ferfar PDF Management)
          </h1>
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            मागे (Back)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                फाइल नाव (File Name) *
              </label>
              <input
                type="text"
                name="fileName"
                ref={firstInputRef}
                value={formData.fileName}
                onChange={handleInputChange}
                required
                className="w-full h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="फाइल नाव"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                PDF अपलोड (Upload PDF) *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  onChange={handlePdfSelect}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="flex items-center gap-2 px-4 h-[42px] bg-[rgb(106,115,55)] text-white rounded-lg hover:bg-[rgb(86,95,35)] transition-colors cursor-pointer font-medium"
                >
                  <Upload className="w-5 h-5" />
                  PDF निवडा (Choose PDF)
                </label>
                {formData.pdfFile && (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formData.pdfFile.name}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                &nbsp;
              </label>
              <button
                type="submit"
                className="w-full h-[42px] px-6 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
              >
                सबमिट (Submit)
              </button>
            </div>
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
                  File Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Uploaded At
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  Kriya
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    कोणतेही PDF सापडले नाहीत (No PDFs found)
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {indexOfFirstRecord + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {record.file_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {record.created_at
                        ? new Date(record.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleDownload(record)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="PDF डाउनलोड करा (Download PDF)"
                      >
                        <Download className="w-5 h-5" />
                        डाउनलोड (Download)
                      </button>
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
    </div>
    </>
  );
};

export default FerfarPdfManagement;

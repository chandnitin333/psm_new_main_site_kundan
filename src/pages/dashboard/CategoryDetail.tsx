import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { CategoryRecord, CategoryInfo } from '../../interfaces/dashboard/CategoryDetail.types';

const categoryInfoMap: Record<string, CategoryInfo> = {
  'chalu-khatedar': {
    title: 'Chalu Khatedar',
    titleMr: 'चालू खातेदार',
    description: 'List of all active account holders',
  },
  'adhikrut': {
    title: 'Adhikrut',
    titleMr: 'अधिकृत',
    description: 'List of all authorized persons',
  },
  'indira-awas': {
    title: 'Indira Awas',
    titleMr: 'इंदिरा आवास',
    description: 'List of Indira Awas beneficiaries',
  },
  'imlakar': {
    title: 'Imlakar',
    titleMr: 'इमळाकार',
    description: 'List of all Imlakar records',
  },
  'ghar-kar': {
    title: 'Ghar Kar',
    titleMr: 'घर कर',
    description: 'List of house tax records',
  },
  'audogyik': {
    title: 'Audogyik',
    titleMr: 'औद्योगिक',
    description: 'List of industrial properties',
  },
  'manora': {
    title: 'Manora',
    titleMr: 'मनोरा',
    description: 'List of Manora records',
  },
};

const CategoryDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  const categoryInfo = categoryId ? categoryInfoMap[categoryId] : null;

  // Set page title
  useEffect(() => {
    if (categoryInfo) {
      document.title = `${categoryInfo.title} - ${categoryInfo.titleMr}`;
    }
  }, [categoryInfo]);

  // Generate sample data based on category
  const generateRecords = (count: number): CategoryRecord[] => {
    const records: CategoryRecord[] = [];
    for (let i = 1; i <= count; i++) {
      records.push({
        id: i,
        anuKramank: `${i}`,
        milkatKramank: `${String(i).padStart(4, '0')}`,
        wardKramank: `${(i % 10) + 1}`,
        khasaraKramank: `${String(100 + i).padStart(4, '0')}`,
        khatedarName: `खातेदार नाव ${i}`,
        bhogwatdarName: `भोगवटदार नाव ${i}`,
      });
    }
    return records;
  };

  const getCategoryCount = (): number => {
    const counts: Record<string, number> = {
      'chalu-khatedar': 1247,
      'adhikrut': 856,
      'indira-awas': 432,
      'imlakar': 324,
      'ghar-kar': 678,
      'audogyik': 189,
      'manora': 542,
    };
    return categoryId ? counts[categoryId] || 0 : 0;
  };

  const records = generateRecords(getCategoryCount());

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(records.length / recordsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (!categoryInfo) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Category not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {categoryInfo.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
              {categoryInfo.titleMr}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {categoryInfo.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {records.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sr. No. / अ.क्र.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Anu Kramank / अनु क्रमांक
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Milkat Kramank / मिळकत क्रमांक
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  वॉर्ड क्र.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Khasara Kramank / खसरा क्रमांक
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Khatedharkache Nav / खातेदाराचे नाव
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Bhogawatdarache Nav / भोगवटदाराचे नाव
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentRecords.map((record, index) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {indexOfFirstRecord + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {record.anuKramank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {record.milkatKramank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {record.wardKramank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {record.khasaraKramank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {record.khatedarName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {record.bhogwatdarName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastRecord, records.length)}
                </span>{' '}
                of <span className="font-medium">{records.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return (
                        <span
                          key={`ellipsis-${page}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-primary-600 border-primary-600 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;

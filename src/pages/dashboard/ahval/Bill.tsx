import { useState, useEffect } from 'react';
import Select2 from '../../../components/common/Select2';
import type { Select2Option } from '../../../components/common/Select2';
import YearPicker from '../../../components/common/YearPicker';
import DatePicker from '../../../components/common/DatePicker';
import Table from '../../../components/common/Table';
import type { Column } from '../../../components/common/Table';
import type { BillRecord } from '../../../interfaces/dashboard/ahval';
import { useLoading } from '../../../contexts/LoadingContext';

const Bill = () => {
  const { showLoader, hideLoader } = useLoading();

  const [formData, setFormData] = useState({
    year: '',
    toYear: '',
    fromAnukramank: '',
    toAnukramank: '',
    wardKramank: '',
    deyakDinank: '',
    antimTarik: '',
    bharna: '',
  });

  // Auto-calculate toYear when year changes (year + 1)
  useEffect(() => {
    if (formData.year) {
      const yearValue = parseInt(formData.year);
      setFormData(prev => ({
        ...prev,
        toYear: (yearValue + 1).toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        toYear: ''
      }));
    }
  }, [formData.year]);

  // Auto-calculate antimTarik (deyakDinank + 30 days)
  useEffect(() => {
    if (formData.deyakDinank) {
      const deyakDate = new Date(formData.deyakDinank);
      const antimDate = new Date(deyakDate);
      antimDate.setDate(antimDate.getDate() + 30);

      const year = antimDate.getFullYear();
      const month = String(antimDate.getMonth() + 1).padStart(2, '0');
      const day = String(antimDate.getDate()).padStart(2, '0');

      setFormData(prev => ({
        ...prev,
        antimTarik: `${year}-${month}-${day}`
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        antimTarik: ''
      }));
    }
  }, [formData.deyakDinank]);

  // Auto-load page with loader
  useEffect(() => {
    document.title = 'Bill - बिल';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
    };
    loadPage();
  }, []);

  // Ward options (1-8)
  const wardOptions: Select2Option[] = [
    { value: '1', label: 'प्रभाग 1' },
    { value: '2', label: 'प्रभाग 2' },
    { value: '3', label: 'प्रभाग 3' },
    { value: '4', label: 'प्रभाग 4' },
    { value: '5', label: 'प्रभाग 5' },
    { value: '6', label: 'प्रभाग 6' },
    { value: '7', label: 'प्रभाग 7' },
    { value: '8', label: 'प्रभाग 8' },
  ];

  // Sample data for the table
  const tableData: BillRecord[] = Array.from({ length: 50 }, (_, i) => ({
    anukramank: i + 1,
    wardKramank: `प्रभाग ${Math.floor(Math.random() * 8) + 1}`,
    khatedharkacheNav: `खातेधारक ${i + 1}`,
    column129_1: `${Math.floor(Math.random() * 10000)}`,
    column129_2: `${Math.floor(Math.random() * 10000)}`,
  }));

  // Handle view report for 129(1)
  const handleViewReport129_1 = (row: BillRecord) => {
    console.log('View Report 129(1) for:', row);
    // Add your navigation or modal logic here
    alert(`View Report 129(1) for ${row.khatedharkacheNav}`);
  };

  // Handle view report for 129(2)
  const handleViewReport129_2 = (row: BillRecord) => {
    console.log('View Report 129(2) for:', row);
    // Add your navigation or modal logic here
    alert(`View Report 129(2) for ${row.khatedharkacheNav}`);
  };

  // Table columns configuration
  const columns: Column<BillRecord>[] = [
    {
      key: 'anukramank',
      label: 'अनुक्रमांक',
      sortable: true,
      width: '100px',
    },
    {
      key: 'wardKramank',
      label: 'प्रभाग क्रमांक',
      sortable: true,
      width: '150px',
    },
    {
      key: 'khatedharkacheNav',
      label: 'खातेधारकाचे नाव',
      sortable: true,
    },
    {
      key: 'column129_1',
      label: '129(1)',
      sortable: true,
      width: '180px',
      render: (row) => (
        <button
          onClick={() => handleViewReport129_1(row)}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          अहवाल पहा
        </button>
      ),
    },
    {
      key: 'column129_2',
      label: '129(2)',
      sortable: true,
      width: '180px',
      render: (row) => (
        <button
          onClick={() => handleViewReport129_2(row)}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          अहवाल पहा
        </button>
      ),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your submit logic here
  };

  const handleReset = () => {
    setFormData({
      year: '',
      toYear: '',
      fromAnukramank: '',
      toAnukramank: '',
      wardKramank: '',
      deyakDinank: '',
      antimTarik: '',
      bharna: '',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          बिल
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSubmit}>
          {/* First Row - Year, To Year, From Anukramank, To Anukramank */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                वर्ष
              </label>
              <YearPicker
                value={formData.year}
                onChange={(value) => setFormData({ ...formData, year: value })}
                placeholder="वर्ष निवडा"
              />
            </div>

            {/* To Year - readonly, auto-calculated (year + 1) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ते वर्ष
              </label>
              <input
                type="text"
                value={formData.toYear}
                readOnly
                placeholder="ते वर्ष"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            {/* From Anukramank - Integer only */}
            <div>
              <label
                htmlFor="fromAnukramank"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                पासून अनुक्रमांक
              </label>
              <input
                type="number"
                id="fromAnukramank"
                name="fromAnukramank"
                value={formData.fromAnukramank}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, fromAnukramank: value });
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                placeholder="पासून अनुक्रमांक"
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* To Anukramank - Integer only */}
            <div>
              <label
                htmlFor="toAnukramank"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                पर्यंत अनुक्रमांक
              </label>
              <input
                type="number"
                id="toAnukramank"
                name="toAnukramank"
                value={formData.toAnukramank}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, toAnukramank: value });
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                placeholder="पर्यंत अनुक्रमांक"
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Second Row - Ward Kramank, Deyak Dinank, Antim Tarik, Bharna */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Ward Kramank Dropdown */}
            <div>
              <Select2
                label="प्रभाग क्रमांक"
                options={wardOptions}
                value={formData.wardKramank}
                onChange={(value) =>
                  setFormData({ ...formData, wardKramank: value as string })
                }
                placeholder="प्रभाग निवडा"
                searchable={true}
                clearable={true}
              />
            </div>

            {/* Deyak Dinank - DatePicker */}
            <div>
              <DatePicker
                label="देयक दिनांक"
                value={formData.deyakDinank}
                onChange={(value) => setFormData({ ...formData, deyakDinank: value })}
                placeholder="दिनांक निवडा"
                format="DD/MM/YYYY"
              />
            </div>

            {/* Antim Tarik - readonly, auto-calculated (deyakDinank + 30 days) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                अंतिम तारीख
              </label>
              <input
                type="text"
                value={formData.antimTarik ? new Date(formData.antimTarik).toLocaleDateString('en-GB') : ''}
                readOnly
                placeholder="अंतिम तारीख"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            {/* Bharna - Integer only */}
            <div>
              <label
                htmlFor="bharna"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                भरणा
              </label>
              <input
                type="number"
                id="bharna"
                name="bharna"
                value={formData.bharna}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, bharna: value });
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                placeholder="भरणा"
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Table Section with Search and Pagination */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          बिल यादी
        </h2>
        <Table
          data={tableData}
          columns={columns}
          searchable={true}
          searchPlaceholder="शोधा..."
          showPagination={true}
          pageSize={10}
          striped={true}
          hoverable={true}
          emptyMessage="कोणताही डेटा उपलब्ध नाही"
        />
      </div>
    </div>
  );
};

export default Bill;

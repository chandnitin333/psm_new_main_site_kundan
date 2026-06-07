import { useState, useEffect } from 'react';
import YearPicker from '../../../components/common/YearPicker';
import DatePicker from '../../../components/common/DatePicker';
import Table from '../../../components/common/Table';
import type { Column } from '../../../components/common/Table';
import type { BillWardRecord } from '../../../interfaces/dashboard/ahval';
import { useLoading } from '../../../contexts/LoadingContext';
import { useToast } from '../../../hooks/useToast';
import { commonDdlService, nodniService } from '../../../services';
import { openReportIfData } from '../../../utils/openReport';

const BillWard = () => {
  const { showLoader, hideLoader } = useLoading();
  const { toast, ToastContainer } = useToast();

  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const [wards, setWards] = useState<(string | number)[]>([]);
  const [formData, setFormData] = useState({
    year: String(currentYear),       // default to current year
    toYear: String(currentYear + 1),
    deyakDinank: todayStr,           // default to today
    antimTarik: todayStr,            // default to today (editable)
    start: '',
    end: '',
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

  // Auto-load page + fetch dynamic wards
  useEffect(() => {
    document.title = 'Bill Ward - बिल प्रभाग';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
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
      } finally {
        hideLoader();
      }
    };
    loadPage();
  }, []);

  // Dynamic ward rows (one per ward, with 129(1) / 129(2) report buttons)
  const tableData: BillWardRecord[] = wards.map((w) => ({
    wardKramank: `प्रभाग ${w}`,
    column129_1: String(w),
    column129_2: String(w),
  }));

  // All fields are required before generating a report
  const validateRequired = (): boolean => {
    const missing: string[] = [];
    if (!formData.year) missing.push('वर्ष');
    if (!formData.toYear) missing.push('ते वर्ष');
    if (!formData.deyakDinank) missing.push('देयक दिनांक');
    if (!formData.antimTarik) missing.push('अंतिम तारीख');
    if (!formData.start) missing.push('सुरुवात क्रमांक');
    if (!formData.end) missing.push('शेवट क्रमांक');
    if (!formData.bharna) missing.push('भरणा');
    if (missing.length > 0) {
      toast.error(`कृपया सर्व आवश्यक माहिती भरा (Required): ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  // dd/mm/yyyy from a YYYY-MM-DD value
  const fmtDate = (v: string) => {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return d && m && y ? `${d}/${m}/${y}` : v;
  };

  const billParams = (ward: string) => ({
    ward,
    start: formData.start,
    end: formData.end,
    year: formData.year,
    toYear: formData.toYear,
    startDate: fmtDate(formData.deyakDinank),
    endDate: fmtDate(formData.antimTarik),
    bharna: formData.bharna,
  });
  const fetchWardData = async (ward: string) => {
    const res = await nodniService.getDharkachiYadi(ward, formData.start, formData.end, '', formData.year);
    return (res.success ? (res.data as Record<string, unknown>[]) : []) || [];
  };

  // Handle view report for 129(1)
  const handleViewReport129_1 = (row: BillWardRecord) => {
    if (!validateRequired()) return;
    openReportIfData({
      fetcher: () => fetchWardData(row.column129_1),
      url: '/view-bill-129-1',
      sessionKey: 'bill129_1Params',
      sessionValue: billParams(row.column129_1),
      onEmpty: () => toast.error('या वार्डसाठी माहिती उपलब्ध नाही (No data found)'),
    });
  };

  // Handle view report for 129(2)
  const handleViewReport129_2 = (row: BillWardRecord) => {
    if (!validateRequired()) return;
    openReportIfData({
      fetcher: () => fetchWardData(row.column129_2),
      url: '/view-bill-129-2',
      sessionKey: 'bill129_2Params',
      sessionValue: billParams(row.column129_2),
      onEmpty: () => toast.error('या वार्डसाठी माहिती उपलब्ध नाही (No data found)'),
    });
  };

  // Table columns configuration
  const columns: Column<BillWardRecord>[] = [
    {
      key: 'wardKramank',
      label: 'प्रभाग क्रमांक',
      sortable: true,
      width: '200px',
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
  };


  return (
    <div className="p-6">
      <ToastContainer />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          बिल - प्रभाग
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSubmit}>
          {/* Single Row - All Fields */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
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

            {/* Deyak Dinank - DatePicker */}
            <div>
              <DatePicker
                label="देयक दिनांक"
                value={formData.deyakDinank}
                onChange={(value) => setFormData({ ...formData, deyakDinank: value })}
                placeholder="दिनांक निवडा"
                format="DD/MM/YYYY"
                max={todayStr}
              />
            </div>

            {/* Antim Tarik - auto-filled (deyakDinank + 30 days) but editable */}
            <div>
              <DatePicker
                label="अंतिम तारीख"
                value={formData.antimTarik}
                onChange={(value) => setFormData({ ...formData, antimTarik: value })}
                placeholder="अंतिम तारीख निवडा"
                format="DD/MM/YYYY"
                max={todayStr}
              />
            </div>

            {/* Start Number - Integer only */}
            <div>
              <label
                htmlFor="start"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                सुरुवात क्रमांक
              </label>
              <input
                type="number"
                id="start"
                name="start"
                value={formData.start}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, start: value });
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                placeholder="सुरुवात"
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* End Number - Integer only */}
            <div>
              <label
                htmlFor="end"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                शेवट क्रमांक
              </label>
              <input
                type="number"
                id="end"
                name="end"
                value={formData.end}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, end: value });
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                placeholder="शेवट"
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

export default BillWard;

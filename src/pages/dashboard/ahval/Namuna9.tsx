import { useState, useEffect } from 'react';
import Select2 from '../../../components/common/Select2';
import type { Select2Option } from '../../../components/common/Select2';
import YearPicker from '../../../components/common/YearPicker';
import { useLoading } from '../../../contexts/LoadingContext';
import { useToast } from '../../../hooks/useToast';
import { commonDdlService, nodniService } from '../../../services';
import { openReportIfData } from '../../../utils/openReport';

type AnyRow = Record<string, unknown>;

const Namuna9 = () => {
  const { showLoader, hideLoader } = useLoading();
  const { toast, ToastContainer } = useToast();

  const currentYear = new Date().getFullYear();
  const [wardOptions, setWardOptions] = useState<Select2Option[]>([]);
  const [formData, setFormData] = useState({
    namuna: '',
    wardNo: '',
    year: String(currentYear),       // default to current year on load
    year_1: String(currentYear + 1),
    start: '',
    end: '',
  });

  // Update year_1 when year changes
  useEffect(() => {
    if (formData.year) {
      const yearValue = parseInt(formData.year);
      setFormData(prev => ({
        ...prev,
        year_1: (yearValue + 1).toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        year_1: ''
      }));
    }
  }, [formData.year]);

  // Auto-load page + fetch dynamic wards
  useEffect(() => {
    document.title = 'Namuna 9 - नमुना ९';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      try {
        const res = await commonDdlService.getWards();
        if (res.success) {
          const opts = ((res.data as { ward_number: string | number }[]) || [])
            .filter((w) => w.ward_number !== null && w.ward_number !== undefined && w.ward_number !== '')
            .map((w) => ({ value: String(w.ward_number), label: `प्रभाग ${w.ward_number}` }));
          setWardOptions(opts);
        }
      } catch (e) {
        console.error('Failed to load wards', e);
      } finally {
        hideLoader();
      }
    };
    loadPage();
  }, []);

  // Sample options for dropdowns
  const namunaOptions: Select2Option[] = [
    { value: 'namuna9_anukramnika', label: 'नमुना 9 अनुक्रमणिका' },
    { value: 'namuna9', label: 'नमुना 9' },
    { value: 'namuna9_new', label: 'नमुना 9 न्यू' },
    { value: 'namuna9_ghoshwara_new', label: 'नमुना 9 घोषवारा न्यू' },
  ];

  // namuna -> { report url, sessionStorage key }
  const reportMap: Record<string, { url: string; key: string }> = {
    namuna9: { url: '/view-namuna9-multi', key: 'namuna9Params' },
    namuna9_ghoshwara_new: { url: '/view-namuna9-ghosvara', key: 'namuna9GhosvaraParams' },
    namuna9_new: { url: '/view-namuna9-new-multi', key: 'namuna9NewParams' },
    namuna9_anukramnika: { url: '/view-namuna9-anukramika', key: 'namuna9AnukramikaParams' },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namuna) {
      toast.error('कृपया नमुना निवडा (Please select a namuna)');
      return;
    }
    // घोषवारा -> ward is compulsory
    if (formData.namuna === 'namuna9_ghoshwara_new' && !formData.wardNo) {
      toast.error('कृपया वॉर्ड क्र. निवडा (Ward is required for घोषवारा)');
      return;
    }
    const target = reportMap[formData.namuna];
    if (!target) {
      console.log('Form submitted:', formData);
      return;
    }
    openReportIfData({
      fetcher: async () => {
        const res = await nodniService.getDharkachiYadi(formData.wardNo, formData.start, formData.end, '', formData.year);
        return (res.success ? (res.data as AnyRow[]) : []) || [];
      },
      url: target.url,
      sessionKey: target.key,
      sessionValue: { ward: formData.wardNo, start: formData.start, end: formData.end, year: formData.year },
      onEmpty: () => toast.error('या निवडीसाठी माहिती उपलब्ध नाही (No data found)'),
    });
  };

  const handleReset = () => {
    setFormData({
      namuna: '',
      wardNo: '',
      year: String(currentYear),
      year_1: String(currentYear + 1),
      start: '',
      end: '',
    });
  };

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          नमुना 9 (Namuna 9)
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* First Row - All input fields */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
            {/* Namuna Dropdown (wider so long options don't wrap) */}
            <div className="md:col-span-2">
              <Select2
                label="नमुना"
                options={namunaOptions}
                value={formData.namuna}
                onChange={(value) =>
                  setFormData({ ...formData, namuna: value as string })
                }
                placeholder="नमुना निवडा"
                searchable={true}
                clearable={true}
              />
            </div>

            {/* Ward Number Dropdown */}
            <div>
              <Select2
                label="वॉर्ड क्र."
                options={wardOptions}
                value={formData.wardNo}
                onChange={(value) =>
                  setFormData({ ...formData, wardNo: value as string })
                }
                placeholder="प्रभाग निवडा"
                searchable={true}
                clearable={true}
              />
            </div>

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

            {/* Year_1 (To Year) - readonly, auto-calculated */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ते वर्ष
              </label>
              <input
                type="text"
                value={formData.year_1}
                readOnly
                placeholder="ते वर्ष"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            {/* Start */}
            <div>
              <label
                htmlFor="start"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                सुरुवात
              </label>
              <input
                type="number"
                id="start"
                name="start"
                value={formData.start}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow integers (no decimal points)
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, start: value });
                  }
                }}
                onKeyPress={(e) => {
                  // Prevent decimal point and negative sign
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

            {/* End */}
            <div>
              <label
                htmlFor="end"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                शेवट
              </label>
              <input
                type="number"
                id="end"
                name="end"
                value={formData.end}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow integers (no decimal points)
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, end: value });
                  }
                }}
                onKeyPress={(e) => {
                  // Prevent decimal point and negative sign
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
          </div>

          {/* Second Row - Buttons */}
          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              सबमिट (Submit)
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              रीसेट (Reset)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Namuna9;

import { useState, useEffect } from 'react';
import Select2 from '../../../components/common/Select2';
import type { Select2Option } from '../../../components/common/Select2';
import YearPicker from '../../../components/common/YearPicker';
import { useLoading } from '../../../contexts/LoadingContext';

const Namuna9 = () => {
  const { showLoader, hideLoader } = useLoading();

  const [formData, setFormData] = useState({
    namuna: '',
    wardNo: '',
    year: '',
    year_1: '',
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

  // Auto-load page with loader
  useEffect(() => {
    document.title = 'Namuna 9 - नमुना ९';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your submit logic here
  };

  const handleReset = () => {
    setFormData({
      namuna: '',
      wardNo: '',
      year: '',
      year_1: '',
      start: '',
      end: '',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          नमुना 9 (Namuna 9)
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* First Row - All input fields */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            {/* Namuna Dropdown */}
            <div>
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
                label="प्रभाग क्रमांक"
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

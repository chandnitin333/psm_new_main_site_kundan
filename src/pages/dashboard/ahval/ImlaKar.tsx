import { useState, useEffect } from 'react';
import Select2 from '../../../components/common/Select2';
import type { Select2Option } from '../../../components/common/Select2';
import YearPicker from '../../../components/common/YearPicker';
import { useLoading } from '../../../contexts/LoadingContext';

const ImlaKar = () => {
  const { showLoader, hideLoader } = useLoading();

  const [formData, setFormData] = useState({
    imlakar: '',
    wardNo: '',
    year: '',
    toYear: '',
    year_1: '',
    toYear_1: '',
    start: '',
    end: '',
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

  // Auto-populate year_1 when year changes (year + 3)
  useEffect(() => {
    if (formData.year) {
      const yearValue = parseInt(formData.year);
      setFormData(prev => ({
        ...prev,
        year_1: (yearValue + 3).toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        year_1: '',
        toYear_1: ''
      }));
    }
  }, [formData.year]);

  // Auto-calculate toYear_1 when year_1 changes (year_1 + 1)
  useEffect(() => {
    if (formData.year_1) {
      const yearValue = parseInt(formData.year_1);
      setFormData(prev => ({
        ...prev,
        toYear_1: (yearValue + 1).toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        toYear_1: ''
      }));
    }
  }, [formData.year_1]);

  // Auto-load page with loader
  useEffect(() => {
    document.title = 'Imla Kar - इमला कर';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
    };
    loadPage();
  }, []);

  // Imlakar dropdown options
  const imlakarOptions: Select2Option[] = [
    { value: 'imlakar_1', label: 'इमलाकर 1' },
    { value: 'imlakar_2', label: 'इमलाकर 2' },
    { value: 'imlakar_3', label: 'इमलाकर 3' },
    { value: 'imlakar_4', label: 'इमलाकर 4' },
  ];

  // Ward dropdown options (1-8)
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
  };

  const handleReset = () => {
    setFormData({
      imlakar: '',
      wardNo: '',
      year: '',
      toYear: '',
      year_1: '',
      toYear_1: '',
      start: '',
      end: '',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          इमला कर (Imla Kar)
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* First Row - Imlakar, Ward, Year, To Year */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Imlakar Dropdown */}
            <div>
              <Select2
                label="इमलाकर"
                options={imlakarOptions}
                value={formData.imlakar}
                onChange={(value) =>
                  setFormData({ ...formData, imlakar: value as string })
                }
                placeholder="इमलाकर निवडा"
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
          </div>

          {/* Second Row - Year_1, To Year_1, Start, End */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Year_1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                वर्ष 1
              </label>
              <YearPicker
                value={formData.year_1}
                onChange={(value) => setFormData({ ...formData, year_1: value })}
                placeholder="वर्ष 1 निवडा"
              />
            </div>

            {/* To Year_1 - readonly, auto-calculated (year_1 + 1) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ते वर्ष 1
              </label>
              <input
                type="text"
                value={formData.toYear_1}
                readOnly
                placeholder="ते वर्ष 1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            {/* Start - Integer only */}
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

            {/* End - Integer only */}
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
          </div>

          {/* Buttons Row - Centered */}
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

export default ImlaKar;

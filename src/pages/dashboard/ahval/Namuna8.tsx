import { useState, useEffect } from 'react';
import Select2 from '../../../components/common/Select2';
import type { Select2Option } from '../../../components/common/Select2';
import YearPicker from '../../../components/common/YearPicker';
import { useLoading } from '../../../contexts/LoadingContext';
import { commonDdlService } from '../../../services';

const Namuna8 = () => {
  const { showLoader, hideLoader } = useLoading();

  const currentYear = new Date().getFullYear();
  const [wardOptions, setWardOptions] = useState<Select2Option[]>([]);
  const [formData, setFormData] = useState({
    namuna: '',
    wardNo: '',
    year: String(currentYear),       // default to current year on load
    toYear: String(currentYear + 1),
    year_1: '',
    toYear_1: '',
    start: '',
    end: '',
  });

  // Check if year_1 and toYear_1 should be visible
  const showYear1Fields = formData.namuna === 'namuna8' || formData.namuna === 'namuna8_images';

  // Auto-calculate toYear when year changes
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

  // Auto-populate year_1 when year changes (for namuna8 and namuna8_images)
  useEffect(() => {
    if (formData.year && showYear1Fields && !formData.year_1) {
      const yearValue = parseInt(formData.year);
      setFormData(prev => ({
        ...prev,
        year_1: (yearValue + 3).toString()
      }));
    } else if (!showYear1Fields) {
      setFormData(prev => ({
        ...prev,
        year_1: '',
        toYear_1: ''
      }));
    }
  }, [formData.year, showYear1Fields]);

  // Auto-calculate toYear_1 when year_1 changes
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

  // Auto-load page + fetch dynamic wards
  useEffect(() => {
    document.title = 'Namuna 8 - नमुना ८';
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

  // Namuna dropdown options
  const namunaOptions: Select2Option[] = [
    { value: 'namuna8_anukramnika', label: 'नमुना 8 अनुक्रमणिका' },
    { value: 'namuna8', label: 'नमुना 8' },
    { value: 'namuna8_new', label: 'नमुना 8 न्यू' },
    { value: 'namuna8_images', label: 'नमुना 8 इमेजेस' },
    { value: 'namuna8_ghoshwara', label: 'नमुना 8 घोषवारा' },
    { value: 'sarkari_namuna8', label: 'सरकारी नमुना 8' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namuna) {
      alert('कृपया नमुना निवडा (Please select a namuna)');
      return;
    }
    // नमुना ८ (multiple) -> same 3-table layout as /namuna-8-1, one block per property
    if (formData.namuna === 'namuna8') {
      sessionStorage.setItem(
        'namuna8Params',
        JSON.stringify({
          ward: formData.wardNo,
          start: formData.start,
          end: formData.end,
          year: formData.year,
        }),
      );
      window.open('/view-namuna8-multi', '_blank');
      return;
    }
    // सरकारी नमुना ८ (multiple) -> sarkari layout, one block per property
    if (formData.namuna === 'sarkari_namuna8') {
      sessionStorage.setItem(
        'sarkari8Params',
        JSON.stringify({
          ward: formData.wardNo,
          start: formData.start,
          end: formData.end,
          year: formData.year,
        }),
      );
      window.open('/view-namuna8-sarkari-multi', '_blank');
      return;
    }
    // नमुना ८ घोषवारा -> aggregate summary report
    if (formData.namuna === 'namuna8_ghoshwara') {
      sessionStorage.setItem(
        'ghosvaraParams',
        JSON.stringify({
          ward: formData.wardNo,
          start: formData.start,
          end: formData.end,
          year: formData.year,
        }),
      );
      window.open('/view-namuna8-ghosvara', '_blank');
      return;
    }
    // नमुना ८ अनुक्रमणिका -> open the anukramika index report
    if (formData.namuna === 'namuna8_anukramnika') {
      sessionStorage.setItem(
        'anukramikaParams',
        JSON.stringify({
          ward: formData.wardNo,
          start: formData.start,
          end: formData.end,
          year: formData.year,
        }),
      );
      window.open('/view-namuna8-anukramika', '_blank');
      return;
    }
    // नमुना 8 न्यू (multiple) -> नमुना ८ नियम ३२(१), one block per property
    if (formData.namuna === 'namuna8_new') {
      sessionStorage.setItem(
        'namuna8NewParams',
        JSON.stringify({
          ward: formData.wardNo,
          start: formData.start,
          end: formData.end,
          year: formData.year,
        }),
      );
      window.open('/view-namuna8-new-multi', '_blank');
      return;
    }
    // नमुना 8 इमेजेस (multiple) -> नमुना ८ + property image, one block per property
    if (formData.namuna === 'namuna8_images') {
      sessionStorage.setItem(
        'namuna8ImagesParams',
        JSON.stringify({
          ward: formData.wardNo,
          start: formData.start,
          end: formData.end,
          year: formData.year,
        }),
      );
      window.open('/view-namuna8-images-multi', '_blank');
      return;
    }
    // Other namuna types to be wired later
    console.log('Form submitted:', formData);
  };

  const handleReset = () => {
    setFormData({
      namuna: '',
      wardNo: '',
      year: String(currentYear),
      toYear: String(currentYear + 1),
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
          नमुना 8 (Namuna 8)
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* First Row - First 4 fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

            {/* To Year - readonly, auto-calculated */}
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

          {/* Second Row - Next 4 fields (conditional year_1 fields + start + end) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Year_1 - Visible only for namuna8 and namuna8_images */}
            {showYear1Fields && (
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
            )}

            {/* To Year_1 - Visible only for namuna8 and namuna8_images, readonly, auto-calculated */}
            {showYear1Fields && (
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
            )}

            {/* Start - Integer only */}
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
                शेवट
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

          {/* Third Row - Buttons - Centered */}
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

export default Namuna8;

import { useState, useEffect } from 'react';
import Select2 from '../../../components/common/Select2';
import type { Select2Option } from '../../../components/common/Select2';
import YearPicker from '../../../components/common/YearPicker';
import { useLoading } from '../../../contexts/LoadingContext';
import { commonDdlService } from '../../../services';

const MalmattaDurusti = () => {
  const { showLoader, hideLoader } = useLoading();

  const [formData, setFormData] = useState({
    yad: '',
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

  // Dynamic ward options (scoped to the logged-in user's gram panchayat)
  const [wardOptions, setWardOptions] = useState<Select2Option[]>([]);

  // Auto-load page + fetch wards
  useEffect(() => {
    document.title = 'Malmatta Durusti - मालमत्ता दुरुस्ती';
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
  const yadOptions: Select2Option[] = [
    { value: 'malmatta_dharkachi', label: 'मालमत्ता धारकाची यादी' },
    { value: 'khula_bhukhand', label: 'खुला भूखंड' },
    { value: 'ghar_kar_lavaycha', label: 'घर कर लावायचा आहे' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only the यादी type is mandatory. ward/start/end are optional
    // (no ward -> all wards fetched).
    if (!formData.yad) {
      alert('कृपया यादी निवडा (Please select a list type)');
      return;
    }
    // All three यादी types open the same report; type filters the properties:
    //  malmatta_dharkachi -> all | khula_bhukhand -> 'khula' | ghar_kar_lavaycha -> 'ghar'
    if (
      formData.yad === 'malmatta_dharkachi' ||
      formData.yad === 'khula_bhukhand' ||
      formData.yad === 'ghar_kar_lavaycha'
    ) {
      const typeMap: Record<string, string> = {
        khula_bhukhand: 'khula',
        ghar_kar_lavaycha: 'ghar',
      };
      sessionStorage.setItem(
        'dharkachiYadiParams',
        JSON.stringify({
          ward: formData.wardNo,
          start: formData.start,
          end: formData.end,
          year: formData.year,
          type: typeMap[formData.yad] || '',
        }),
      );
      window.open('/view-dharkachi-yadi', '_blank');
      return;
    }
    console.log('Form submitted:', formData);
  };

  const handleReset = () => {
    setFormData({
      yad: '',
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
          मालमत्ता दुरुस्ती (Malmatta Durusti)
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* First Row - All input fields */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
            {/* Yad Dropdown (wider so long options don't wrap) */}
            <div className="md:col-span-2">
              <Select2
                label="यादी"
                options={yadOptions}
                value={formData.yad}
                onChange={(value) =>
                  setFormData({ ...formData, yad: value as string })
                }
                placeholder="यादी निवडा"
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

export default MalmattaDurusti;

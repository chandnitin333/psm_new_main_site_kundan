import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import YearPicker from '../../../components/common/YearPicker';
import KarAakaraniTable from './KarAakaraniTable';
import { Select2, type Select2Option } from '../../../components/common';
import type { KarAakaraniRecord } from '../../../interfaces/dashboard/kar-aakarani/KarAakarani.types';

const KarAakarani = () => {
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [formData, setFormData] = useState({
    wardNo: '',
    year: new Date().getFullYear().toString(),
    toYear: (new Date().getFullYear() + 1).toString(),
  });

  // Sample data - replace with actual API data
  const [allRecords] = useState<KarAakaraniRecord[]>([
    {
      drNo: '001',
      year: '2024',
      toYear: '2025',
      wardNo: '1',
      khatedarkacheNav: 'राम शर्मा',
      gruhkarVBhumikar: '5000',
      vizDivabattikar: '500',
      aarogyaRakshanKar: '300',
      safaeKar: '200',
      samanyaPaniKar: '400',
      visheshPaniKar: '600',
      ekunMagilBaki: '1500',
      ekunImaratKar: '8500',
      ekun: '10000'
    },
    {
      drNo: '002',
      year: '2024',
      toYear: '2025',
      wardNo: '2',
      khatedarkacheNav: 'श्याम पाटील',
      gruhkarVBhumikar: '4500',
      vizDivabattikar: '450',
      aarogyaRakshanKar: '280',
      safaeKar: '180',
      samanyaPaniKar: '380',
      visheshPaniKar: '580',
      ekunMagilBaki: '1200',
      ekunImaratKar: '8050',
      ekun: '9250'
    },
    {
      drNo: '003',
      year: '2024',
      toYear: '2025',
      wardNo: '3',
      khatedarkacheNav: 'सीता देवी',
      gruhkarVBhumikar: '6000',
      vizDivabattikar: '600',
      aarogyaRakshanKar: '350',
      safaeKar: '250',
      samanyaPaniKar: '450',
      visheshPaniKar: '650',
      ekunMagilBaki: '2000',
      ekunImaratKar: '10250',
      ekun: '12250'
    },
    {
      drNo: '004',
      year: '2023',
      toYear: '2024',
      wardNo: '1',
      khatedarkacheNav: 'गीता कुमार',
      gruhkarVBhumikar: '5500',
      vizDivabattikar: '550',
      aarogyaRakshanKar: '320',
      safaeKar: '220',
      samanyaPaniKar: '420',
      visheshPaniKar: '620',
      ekunMagilBaki: '1800',
      ekunImaratKar: '9430',
      ekun: '11230'
    },
    {
      drNo: '005',
      year: '2023',
      toYear: '2024',
      wardNo: '4',
      khatedarkacheNav: 'राजेश वर्मा',
      gruhkarVBhumikar: '4800',
      vizDivabattikar: '480',
      aarogyaRakshanKar: '290',
      safaeKar: '190',
      samanyaPaniKar: '390',
      visheshPaniKar: '590',
      ekunMagilBaki: '1400',
      ekunImaratKar: '8530',
      ekun: '9930'
    },
  ]);

  // Page load effect with loader
  useEffect(() => {
    document.title = 'Kar Aakarani - कर आकारणी';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
    };
    loadPage();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (year: string) => {
    setFormData(prev => ({ ...prev, year }));
  };

  // Select2 options
  const wardNoOptions: Select2Option[] = useMemo(() => [
    { value: '1', label: 'प्रभाग 1 (Ward 1)' },
    { value: '2', label: 'प्रभाग 2 (Ward 2)' },
    { value: '3', label: 'प्रभाग 3 (Ward 3)' },
    { value: '4', label: 'प्रभाग 4 (Ward 4)' },
    { value: '5', label: 'प्रभाग 5 (Ward 5)' },
    { value: '6', label: 'प्रभाग 6 (Ward 6)' },
    { value: '7', label: 'प्रभाग 7 (Ward 7)' },
    { value: '8', label: 'प्रभाग 8 (Ward 8)' },
    { value: '9', label: 'प्रभाग 9 (Ward 9)' },
    { value: '10', label: 'प्रभाग 10 (Ward 10)' },
  ], []);

  const handleWardNoChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, wardNo: value as string }));
  };

  const handleKarAakarani = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoader('कर आकारणी करत आहे... (Processing Kar Aakarani...)');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Kar Aakarani Data:', formData);
    hideLoader();
    toast.success('कर आकारणी प्रक्रिया यशस्वीरित्या पूर्ण झाली (Kar Aakarani process completed successfully)');
  };

  const handleReset = async () => {
    showLoader('रीसेट करत आहे... (Resetting...)');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFormData({
      wardNo: '',
      year: new Date().getFullYear().toString(),
      toYear: (new Date().getFullYear() + 1).toString(),
    });
    hideLoader();
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            कर आकारणी (Kar Aakarani)
          </h1>

          <form onSubmit={handleKarAakarani} className="space-y-6">
            {/* Single Row with all fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {/* Ward No Dropdown */}
              <div>
                <Select2
                  options={wardNoOptions}
                  value={formData.wardNo}
                  onChange={handleWardNoChange}
                  placeholder="निवडा (Select)"
                  label="प्रभाग क्र. (Ward No) *"
                  searchable={true}
                  clearable={false}
                  required
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  वर्ष (Year) *
                </label>
                <YearPicker
                  name="year"
                  value={formData.year}
                  onChange={handleYearChange}
                  placeholder="वर्ष निवडा"
                />
              </div>

              {/* To Year (Auto-calculated) */}
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

              {/* Kar Aakarani Button */}
              <div>
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  कर आकारणी (Kar Aakarani)
                </button>
              </div>

              {/* Reset Button */}
              <div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  रीसेट (Reset)
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Table Component */}
        <KarAakaraniTable records={allRecords} />
      </div>
    </>
  );
};

export default KarAakarani;

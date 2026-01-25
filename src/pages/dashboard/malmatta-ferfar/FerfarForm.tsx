import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import YearPicker from '../../../components/common/YearPicker';
import DatePicker from '../../../components/common/DatePicker';
import { Select2, type Select2Option } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import type { FerfarFormData } from '../../../interfaces/dashboard/malmatta-ferfar/FerfarForm.types';

const FerfarForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const firstInputRef = useRef<HTMLSelectElement>(null);
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();

  const isEdit = location.state?.isEdit || false;
  const editRecord = location.state?.record;

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<FerfarFormData>({
    ferfarNaumaYad: '',
    gramPanchayat: '',
    year: new Date().getFullYear().toString(),
    toYear: (new Date().getFullYear() + 1).toString(),
    anuKramank: '',
    malmattaKramank: '',
    wardNo: '',
    plotNo: '',
    khasaraKramank: '',
    surveyKramank: '',
    masikSabhaKramank: '',
    tharavKramank: '',
    dinak: getTodayDate(),
    gharmalkachiNavLihunDenar: '',
    navLihunGhenara: '',
    sachiv: '',
    sarpanch: '',
    upsarpanch: '',
    sheraTip: '',
  });

  // Pre-populate form if editing
  useEffect(() => {
    if (isEdit && editRecord) {
      const yearMatch = editRecord.year.match(/(\d{4})-(\d{4})/);
      const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
      const toYear = yearMatch ? yearMatch[2] : (new Date().getFullYear() + 1).toString();

      setFormData({
        ferfarNaumaYad: editRecord.ferfarNaumaYad || '',
        gramPanchayat: editRecord.gramPanchayat || '',
        year: year,
        toYear: toYear,
        anuKramank: editRecord.anuKramank || '',
        malmattaKramank: editRecord.milkatKramank || '',
        wardNo: editRecord.wardNo || '',
        plotNo: editRecord.plotNo || '',
        khasaraKramank: editRecord.khasaraKramank || '',
        surveyKramank: editRecord.surveyKramank || '',
        masikSabhaKramank: editRecord.masikSabhaKramank || '',
        tharavKramank: editRecord.tharavKramank || '',
        dinak: editRecord.dinak || '',
        gharmalkachiNavLihunDenar: editRecord.khatedharkacheNav || '',
        navLihunGhenara: editRecord.bhogwatdaracheNav || '',
        sachiv: editRecord.sachiv || '',
        sarpanch: editRecord.sarpanch || '',
        upsarpanch: editRecord.upsarpanch || '',
        sheraTip: editRecord.sheraTip || '',
      });
    }
  }, [isEdit, editRecord]);

  // Auto-focus on first input when component loads
  useEffect(() => {
    document.title = 'Ferfar Form - फेरफार फॉर्म';
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (year: string) => {
    setFormData(prev => ({ ...prev, year }));
  };

  // Select2 options
  const ferfarNaumaYadOptions: Select2Option[] = useMemo(() => [
    { value: 'type1', label: 'प्रकार 1' },
    { value: 'type2', label: 'प्रकार 2' },
    { value: 'type3', label: 'प्रकार 3' },
  ], []);

  const gramPanchayatOptions: Select2Option[] = useMemo(() => [
    { value: 'gp1', label: 'ग्रामपंचायत 1' },
    { value: 'gp2', label: 'ग्रामपंचायत 2' },
    { value: 'gp3', label: 'ग्रामपंचायत 3' },
  ], []);

  const handleFerfarNaumaYadChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, ferfarNaumaYad: value as string }));
  };

  const handleGramPanchayatChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, gramPanchayat: value as string }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    showLoader('फेरफार जतन करत आहे...');

    // Simulate async operation (API call)
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (isEdit) {
      console.log('Update Ferfar Data:', formData);
      // TODO: Implement update logic (e.g., API call)
      // Navigate back with updated record - keep original anuKramank for matching
      const updatedRecord = {
        anuKramank: editRecord?.anuKramank || formData.anuKramank,
        milkatKramank: formData.malmattaKramank,
        wardNo: formData.wardNo,
        khasaraKramank: formData.khasaraKramank,
        khatedharkacheNav: formData.gharmalkachiNavLihunDenar,
        bhogwatdaracheNav: formData.navLihunGhenara,
        year: `${formData.year}-${formData.toYear}`,
        // Include all form fields
        ferfarNaumaYad: formData.ferfarNaumaYad,
        gramPanchayat: formData.gramPanchayat,
        plotNo: formData.plotNo,
        surveyKramank: formData.surveyKramank,
        masikSabhaKramank: formData.masikSabhaKramank,
        tharavKramank: formData.tharavKramank,
        dinak: formData.dinak,
        sachiv: formData.sachiv,
        sarpanch: formData.sarpanch,
        upsarpanch: formData.upsarpanch,
        sheraTip: formData.sheraTip,
      };

      hideLoader();

      toast.success('फेरफार यशस्वीरित्या अद्यतनित केले (Ferfar updated successfully)');
      // Delay navigation to allow toast to be visible
      setTimeout(() => {
        navigate('/malmatta-ferfar', { state: { updatedRecord, isEdit: true, originalRecord: editRecord } });
      }, 1500);
    } else {
      console.log('Save Ferfar Data:', formData);
      // TODO: Implement save logic (e.g., API call)
      // Create new record from form data with ALL fields
      const newRecord = {
        anuKramank: formData.anuKramank,
        milkatKramank: formData.malmattaKramank,
        wardNo: formData.wardNo,
        khasaraKramank: formData.khasaraKramank,
        khatedharkacheNav: formData.gharmalkachiNavLihunDenar,
        bhogwatdaracheNav: formData.navLihunGhenara,
        year: `${formData.year}-${formData.toYear}`,
        // Include all form fields
        ferfarNaumaYad: formData.ferfarNaumaYad,
        gramPanchayat: formData.gramPanchayat,
        plotNo: formData.plotNo,
        surveyKramank: formData.surveyKramank,
        masikSabhaKramank: formData.masikSabhaKramank,
        tharavKramank: formData.tharavKramank,
        dinak: formData.dinak,
        sachiv: formData.sachiv,
        sarpanch: formData.sarpanch,
        upsarpanch: formData.upsarpanch,
        sheraTip: formData.sheraTip,
      };

      hideLoader();

      toast.success('फेरफार यशस्वीरित्या जतन केले (Ferfar saved successfully)');
      // Delay navigation to allow toast to be visible
      setTimeout(() => {
        navigate('/malmatta-ferfar', { state: { newRecord } });
      }, 1500);
    }
  };

  const handleReset = () => {
    setFormData({
      ferfarNaumaYad: '',
      gramPanchayat: '',
      year: new Date().getFullYear().toString(),
      toYear: (new Date().getFullYear() + 1).toString(),
      anuKramank: '',
      malmattaKramank: '',
      wardNo: '',
      plotNo: '',
      khasaraKramank: '',
      surveyKramank: '',
      masikSabhaKramank: '',
      tharavKramank: '',
      dinak: getTodayDate(),
      gharmalkachiNavLihunDenar: '',
      navLihunGhenara: '',
      sachiv: '',
      sarpanch: '',
      upsarpanch: '',
      sheraTip: '',
    });
  };

  const handleBack = () => {
    navigate('/malmatta-ferfar');
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'फेरफार संपादित करा (Edit Ferfar)' : 'फेरफार जोडा (Add Ferfar)'}
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* First Row - 6 Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Select2
                options={ferfarNaumaYadOptions}
                value={formData.ferfarNaumaYad}
                onChange={handleFerfarNaumaYadChange}
                placeholder="निवडा"
                label="फेरफार नुमायाड *"
                searchable={true}
                clearable={false}
                required
              />
            </div>

            <div>
              <Select2
                options={gramPanchayatOptions}
                value={formData.gramPanchayat}
                onChange={handleGramPanchayatChange}
                placeholder="निवडा"
                label="ग्रामपंचायत *"
                searchable={true}
                clearable={false}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                वर्ष *
              </label>
              <YearPicker
                name="year"
                value={formData.year}
                onChange={handleYearChange}
                placeholder="वर्ष निवडा"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ते वर्ष
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                अनु क्रमांक
              </label>
              <input
                type="text"
                name="anuKramank"
                value={formData.anuKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="अनु क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                मालमत्ता क्रमांक
              </label>
              <input
                type="text"
                name="malmattaKramank"
                value={formData.malmattaKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="मालमत्ता क्रमांक"
              />
            </div>
          </div>

          {/* Second Row - 6 Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                प्रभाग क्र.
              </label>
              <input
                type="text"
                name="wardNo"
                value={formData.wardNo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="प्रभाग क्र."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                प्लॉट नं
              </label>
              <input
                type="text"
                name="plotNo"
                value={formData.plotNo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="प्लॉट नं"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                खसरा क्रमांक
              </label>
              <input
                type="text"
                name="khasaraKramank"
                value={formData.khasaraKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="खसरा क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                सर्वे क्रमांक
              </label>
              <input
                type="text"
                name="surveyKramank"
                value={formData.surveyKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="सर्वे क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                मासिक सभा क्रमांक
              </label>
              <input
                type="text"
                name="masikSabhaKramank"
                value={formData.masikSabhaKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="मासिक सभा क्रमांक"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ठराव क्रमांक
              </label>
              <input
                type="text"
                name="tharavKramank"
                value={formData.tharavKramank}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="ठराव क्रमांक"
              />
            </div>
          </div>

          {/* Third Row - 6 Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                दिनांक
              </label>
              <DatePicker
                name="dinak"
                value={formData.dinak}
                onChange={(value) => setFormData(prev => ({ ...prev, dinak: value }))}
                format="DD/MM/YYYY"
                max={new Date().toISOString().split('T')[0]}
                placeholder="दिनांक निवडा"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                घरमालकाचे नाव लिहून देणार
              </label>
              <input
                type="text"
                name="gharmalkachiNavLihunDenar"
                value={formData.gharmalkachiNavLihunDenar}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="घरमालकाचे नाव"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                नाव लिहून घेणारा
              </label>
              <input
                type="text"
                name="navLihunGhenara"
                value={formData.navLihunGhenara}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="नाव लिहून घेणारा"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                सचिव
              </label>
              <input
                type="text"
                name="sachiv"
                value={formData.sachiv}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="सचिव"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                सरपंच
              </label>
              <input
                type="text"
                name="sarpanch"
                value={formData.sarpanch}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="सरपंच"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                उपसरपंच
              </label>
              <input
                type="text"
                name="upsarpanch"
                value={formData.upsarpanch}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="उपसरपंच"
              />
            </div>
          </div>

          {/* Fourth Row - Shera/Tip (Full Width) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              शेरा/टिप
            </label>
            <textarea
              name="sheraTip"
              value={formData.sheraTip}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="शेरा/टिप"
            />
          </div>

          {/* Fifth Row - Buttons (Centered) */}
          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
            >
              {isEdit ? 'अद्यतन करा (Update)' : 'जतन करा (Save)'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
            >
              रीसेट (Reset)
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default FerfarForm;

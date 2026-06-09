import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import YearPicker from '../../../components/common/YearPicker';
import DatePicker from '../../../components/common/DatePicker';
import { Select2, type Select2Option } from '../../../components/common';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { commonDdlService } from '../../../services/commonDdlService';
import { authService } from '../../../services/authService';
import { nodniService } from '../../../services/nodniService';
import { ferfarService } from '../../../services/ferfarService';
import { trackAction } from '../../../utils/tracker';
import type { FerfarFormData } from '../../../interfaces/dashboard/malmatta-ferfar/FerfarForm.types';

const FerfarForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const firstInputRef = useRef<HTMLSelectElement>(null);
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();

  const isEdit = location.state?.isEdit || false;
  const editRecord = location.state?.record;

  const [ferfarYadiOptions, setFerfarYadiOptions] = useState<Select2Option[]>([]);
  const [nodniId, setNodniId] = useState<number | null>(editRecord?.nodni_id || null);
  const currentUser = authService.getCurrentUser();
  const gramPanchayatOptions: Select2Option[] = currentUser?.gram_panchayat_id
    ? [{ value: String(currentUser.gram_panchayat_id), label: currentUser.gram_panchayat || '' }]
    : [];

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
    gramPanchayat: currentUser?.gram_panchayat_id ? String(currentUser.gram_panchayat_id) : '',
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
      setNodniId(editRecord.nodni_id || null);
      setFormData({
        ferfarNaumaYad: editRecord.ferfar_namuna_yadi_id ? String(editRecord.ferfar_namuna_yadi_id) : '',
        gramPanchayat: editRecord.gram_panchayat_id ? String(editRecord.gram_panchayat_id) : (currentUser?.gram_panchayat_id ? String(currentUser.gram_panchayat_id) : ''),
        year: editRecord.year || new Date().getFullYear().toString(),
        toYear: editRecord.to_year || (new Date().getFullYear() + 1).toString(),
        anuKramank: editRecord.anu_kramank ? String(editRecord.anu_kramank) : '',
        malmattaKramank: editRecord.malmatta_number ? String(editRecord.malmatta_number) : '',
        wardNo: editRecord.ward_kramnak ? String(editRecord.ward_kramnak) : '',
        plotNo: editRecord.plot_number ? String(editRecord.plot_number) : '',
        khasaraKramank: editRecord.khasara_number ? String(editRecord.khasara_number) : '',
        surveyKramank: editRecord.survey_number ? String(editRecord.survey_number) : '',
        masikSabhaKramank: editRecord.masik_sabha_kramank || '',
        tharavKramank: editRecord.tharav_kramnak || '',
        dinak: editRecord.dinank_date || getTodayDate(),
        gharmalkachiNavLihunDenar: editRecord.ghar_malkache_nav_lihun_denar || '',
        navLihunGhenara: editRecord.nav_lihun_ghenara || '',
        sachiv: editRecord.sachive || '',
        sarpanch: editRecord.sarpanch || '',
        upsarpanch: editRecord.upsarpanch || '',
        sheraTip: editRecord.shera_tip || '',
      });
    }
  }, [isEdit, editRecord]);

  // Fetch ferfar yadi dropdown options
  useEffect(() => {
    commonDdlService.getFerfarYadi().then(res => {
      const data = (res.data as any[]) || [];
      setFerfarYadiOptions(data.map(item => ({ value: String(item.id), label: item.name })));
    }).catch(() => {});
  }, []);

  // Auto-focus on first input when component loads
  useEffect(() => {
    document.title = 'Ferfar Form - फेरफार फॉर्म';
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  // Auto-fill nodni fields when anuKramank and wardNo are both entered
  useEffect(() => {
    const anu = (formData.anuKramank || '').trim();
    const ward = (formData.wardNo || '').trim();

    // Always create the timer so cleanup always cancels the previous one
    const timer = setTimeout(async () => {
      if (!anu || !ward) {
        setNodniId(null);
        setFormData(prev => ({
          ...prev,
          malmattaKramank: '',
          plotNo: '',
          khasaraKramank: '',
          surveyKramank: '',
        }));
        return;
      }

      try {
        const response = await nodniService.searchNodniForFerfar(anu, ward);
        if (response.success && response.data) {
          const r = response.data as any;
          setNodniId(r.id || null);
          setFormData(prev => ({
            ...prev,
            malmattaKramank: r.malmatta_number || '',
            plotNo: r.plot_number || '',
            khasaraKramank: r.khasara_number || '',
            surveyKramank: r.survey_number || '',
          }));
        }
      } catch {
        setNodniId(null);
        setFormData(prev => ({
          ...prev,
          malmattaKramank: '',
          plotNo: '',
          khasaraKramank: '',
          surveyKramank: '',
        }));
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.anuKramank, formData.wardNo]);

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

  const handleFerfarNaumaYadChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, ferfarNaumaYad: value as string }));
  };

  const handleGramPanchayatChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, gramPanchayat: value as string }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nodniId) {
      toast.error('कृपया अनु क्रमांक आणि वॉर्ड क्र. भरा जेणेकरून मालमत्ता रेकॉर्ड मिळेल (Please enter Anu Kramank and Ward No to find the property record)');
      return;
    }

    const payload: Record<string, unknown> = {
      nodni_id: nodniId,
      ferfar_namuna_yadi_id: Number(formData.ferfarNaumaYad) || null,
      gram_panchayat_id: Number(formData.gramPanchayat) || null,
      year: formData.year,
      to_year: formData.toYear,
      masik_sabha_kramank: formData.masikSabhaKramank,
      tharav_kramnak: formData.tharavKramank,
      dinank_date: formData.dinak,
      ghar_malkache_nav_lihun_denar: formData.gharmalkachiNavLihunDenar,
      nav_lihun_ghenara: formData.navLihunGhenara,
      sachive: formData.sachiv,
      sarpanch: formData.sarpanch,
      upsarpanch: formData.upsarpanch,
      shera_tip: formData.sheraTip,
    };

    try {
      showLoader('फेरफार जतन करत आहे...');

      if (isEdit && editRecord?.id) {
        await ferfarService.update(editRecord.id, payload);
        trackAction(
          `मालमत्ता फेरफार रेकॉर्ड मध्ये डेटा बदलून अद्यतनित (Update) केला — अनु क्रमांक: ${formData.anuKramank || '-'}, वॉर्ड क्र.: ${formData.wardNo || '-'}, नाव लिहून घेणारा: ${formData.navLihunGhenara || '-'}`,
          { page: '/malmatta-ferfar/ferfar-form', mode: 'update', anu_kramank: formData.anuKramank, ward: formData.wardNo }
        );
        hideLoader();
        toast.success('फेरफार यशस्वीरित्या अद्यतनित केले (Ferfar updated successfully)');
      } else {
        await ferfarService.create(payload);
        trackAction(
          `मालमत्ता फेरफार मध्ये नवीन रेकॉर्ड तयार (Create) केला — अनु क्रमांक: ${formData.anuKramank || '-'}, वॉर्ड क्र.: ${formData.wardNo || '-'}, नाव लिहून घेणारा: ${formData.navLihunGhenara || '-'}`,
          { page: '/malmatta-ferfar/ferfar-form', mode: 'create', anu_kramank: formData.anuKramank, ward: formData.wardNo }
        );
        hideLoader();
        toast.success('फेरफार यशस्वीरित्या जतन केले (Ferfar saved successfully)');
      }

      setTimeout(() => {
        navigate('/malmatta-ferfar');
      }, 1500);
    } catch (error: any) {
      hideLoader();
      toast.error(error?.message || 'फेरफार जतन अयशस्वी (Save failed)');
    }
  };

  const handleReset = () => {
    setNodniId(null);
    setFormData({
      ferfarNaumaYad: '',
      gramPanchayat: currentUser?.gram_panchayat_id ? String(currentUser.gram_panchayat_id) : '',
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
            {isEdit ? 'फेरफार बदल करा (Update Ferfar)' : 'फेरफार जोडा (Add Ferfar)'}
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
                options={ferfarYadiOptions}
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
                searchable={false}
                clearable={false}
                disabled={true}
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
              वॉर्ड क्र.
              </label>
              <input
                type="text"
                name="wardNo"
                value={formData.wardNo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="वॉर्ड क्र."
              />
            </div>
          </div>

          {/* Second Row - 6 Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                मालमत्ता क्रमांक
              </label>
              <input
                type="text"
                name="malmattaKramank"
                value={formData.malmattaKramank}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                placeholder="मालमत्ता क्रमांक"
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
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
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
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
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
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
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
              {isEdit ? 'बदल करा (Update)' : 'जतन करा (Save)'}
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

import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/common/Modal';
import { Select2, MarathiInput, type Select2Option } from '../../../components/common';
import type { BandkamData, BandkamModalProps } from '../../../interfaces/dashboard/nodni-form/BandkamModal.types';
import { authService, commonDdlService } from '../../../services';

const BandkamModal = ({ isOpen, onClose, onSave, initialData }: BandkamModalProps) => {
  const [formData, setFormData] = useState<BandkamData>({
    malmattechePrakar: '',
    malmattecheVarnan: '',
    vaparPrakar: '',
    bandkamMajla: '',
    shetrafalPurvPachimFoot: '',
    shetrafalUttarDakshinFoot: '',
    ekunShetrafalChorasFoot: '',
    shetrafalPurvPachimMeter: '',
    shetrafalUttarDakshinMeter: '',
    vayoman: '',
    imaraticheBandkamVarsh: '',
    ghasaraDar: '',
    bharank: '',
    imaraticheVarshikMulya: '',
    aakraniDar: '',
  });

  // Dynamic dropdown options from API
  const [malmattechePrakarOptions, setMalmattechePrakarOptions] = useState<Select2Option[]>([]);
  const [malmattecheVarnanOptions, setMalmattecheVarnanOptions] = useState<Select2Option[]>([]);
  const [bandkamMajlaOptions, setBandkamMajlaOptions] = useState<Select2Option[]>([]);
  const ddlFetchedRef = useRef(false);

  // Fetch malmatteche prakar from API - filter for निवासी, अनिवासी, औधोगिक
  useEffect(() => {
    if (ddlFetchedRef.current) return;
    ddlFetchedRef.current = true;

    const fetchDropdowns = async () => {
      try {
        // Fetch malmatteche prakar - filter for निवासी, अनिवासी, औधोगिक
        const prakarRes = await commonDdlService.getMalmattechePrakar() as {
          success: boolean;
          data?: Array<{ id: number; malmatta_prakar_name: string }>;
        };

        if (prakarRes.success && prakarRes.data) {
          const filtered = prakarRes.data.filter(
            item => item.malmatta_prakar_name?.includes('निवासी') ||
                    item.malmatta_prakar_name?.includes('अनिवासी') ||
                    item.malmatta_prakar_name?.includes('औधोगिक')
          );

          setMalmattechePrakarOptions(
            filtered.map(item => ({
              value: String(item.id),
              label: item.malmatta_prakar_name,
            }))
          );
        }

        // Fetch malmatta - exclude खुला भूखंड
        const malmattaRes = await commonDdlService.getMalmatta() as {
          success: boolean;
          data?: Array<{ id: number; malmatta_name: string; milkat_varnan: string }>;
        };

        if (malmattaRes.success && malmattaRes.data) {
          const filtered = malmattaRes.data.filter(
            item => !item.malmatta_name?.includes('खुला भूखंड')
          );

          setMalmattecheVarnanOptions(
            filtered.map(item => ({
              value: String(item.id),
              label: item.malmatta_name,
            }))
          );
        }

        // Fetch floors
        const floorRes = await commonDdlService.getFloors() as {
          success: boolean;
          data?: Array<{ id: number; floor_name: string }>;
        };

        if (floorRes.success && floorRes.data) {
          setBandkamMajlaOptions(
            floorRes.data.map(item => ({
              value: String(item.id),
              label: item.floor_name,
            }))
          );
        }
      } catch {
        // keep defaults empty on error
      }
    };

    fetchDropdowns();
  }, []);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    // Auto-calculate when EW/NS feet change
    if (name === 'shetrafalPurvPachimFoot' || name === 'shetrafalUttarDakshinFoot') {
      const ewFoot = parseFloat(name === 'shetrafalPurvPachimFoot' ? value : formData.shetrafalPurvPachimFoot) || 0;
      const nsFoot = parseFloat(name === 'shetrafalUttarDakshinFoot' ? value : formData.shetrafalUttarDakshinFoot) || 0;

      // Convert feet to meter (1 sq ft = 0.092903 sq meter)
      updated.shetrafalPurvPachimMeter = ewFoot ? (ewFoot * 0.092903).toFixed(2) : '';
      updated.shetrafalUttarDakshinMeter = nsFoot ? (nsFoot * 0.092903).toFixed(2) : '';

      // Auto-calculate Total Sq Feet
      const totalSqFt = ewFoot * nsFoot;
      updated.ekunShetrafalChorasFoot = totalSqFt ? totalSqFt.toFixed(2) : '';
    }

    // Auto-calculate Building Construction Year = Current Year - Age
    if (name === 'vayoman') {
      const age = parseFloat(value) || 0;
      updated.imaraticheBandkamVarsh = age ? String(new Date().getFullYear() - age) : '';
    }

    setFormData(updated);

    // Fetch ghasara dar when Age changes
    if (name === 'vayoman' && value && formData.malmattecheVarnan) {
      try {
        const res = await commonDdlService.getGhasaraDar(Number(value), Number(formData.malmattecheVarnan)) as {
          success: boolean;
          data?: { percentage: number | null };
        };
        if (res.success && res.data) {
          setFormData(prev => ({
            ...prev,
            ghasaraDar: res.data!.percentage ? String(res.data!.percentage) : '',
          }));
        }
      } catch {
        // keep field as-is on error
      }
    }
  };

  const handleMalmattechePrakarChange = async (value: string | number | (string | number)[]) => {
    const selectedId = value as string;
    setFormData(prev => ({ ...prev, malmattechePrakar: selectedId, bharank: '' }));

    if (!selectedId) return;

    try {
      const res = await commonDdlService.getBandkamRates(Number(selectedId)) as {
        success: boolean;
        data?: { bharank: number | null };
      };

      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          bharank: res.data!.bharank ? String(res.data!.bharank) : '',
        }));
      }
    } catch {
      // keep field empty on error
    }
  };

  const handleMalmattecheVarnanChange = async (value: string | number | (string | number)[]) => {
    const selectedId = value as string;
    setFormData(prev => ({ ...prev, malmattecheVarnan: selectedId, imaraticheVarshikMulya: '', aakraniDar: '' }));

    if (!selectedId || !formData.malmattechePrakar) return;

    try {
      const currentUser = authService.getCurrentUser();
      if (
        !currentUser?.district_id ||
        !currentUser?.taluka_id ||
        !currentUser?.gram_panchayat_id ||
        !currentUser?.gat_gram_panchayat_id
      ) {
        return;
      }

      const res = await commonDdlService.getAnnualTaxRates({
        district_id: currentUser.district_id,
        taluka_id: currentUser.taluka_id,
        gram_panchayat_id: currentUser.gram_panchayat_id,
        gat_gram_panchayat_id: currentUser.gat_gram_panchayat_id,
        malmatteche_prakar_id: Number(formData.malmattechePrakar),
        malmatta_id: Number(selectedId),
      }) as {
        success: boolean;
        data?: { varshik_mulya_dar: number | null; aakarani_dar: number | null };
      };

      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          imaraticheVarshikMulya: res.data!.varshik_mulya_dar ? String(res.data!.varshik_mulya_dar) : '',
          aakraniDar: res.data!.aakarani_dar ? String(res.data!.aakarani_dar) : '',
        }));
      }
    } catch {
      // keep fields empty on error
    }
  };

  const handleBandkamMajlaChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, bandkamMajla: value as string }));
  };

  const handleSave = () => {
    const dataWithNames = {
      ...formData,
      malmattechePrakarName: malmattechePrakarOptions.find(o => o.value === formData.malmattechePrakar)?.label || '',
      malmattecheVarnanName: malmattecheVarnanOptions.find(o => o.value === formData.malmattecheVarnan)?.label || '',
      bandkamMajlaName: bandkamMajlaOptions.find(o => o.value === formData.bandkamMajla)?.label || '',
    };
    onSave(dataWithNames);
    setFormData({
      malmattechePrakar: '',
      malmattecheVarnan: '',
      vaparPrakar: '',
      bandkamMajla: '',
      shetrafalPurvPachimFoot: '',
      shetrafalUttarDakshinFoot: '',
      ekunShetrafalChorasFoot: '',
      shetrafalPurvPachimMeter: '',
      shetrafalUttarDakshinMeter: '',
      vayoman: '',
      imaraticheBandkamVarsh: '',
      ghasaraDar: '',
      bharank: '',
      imaraticheVarshikMulya: '',
      aakraniDar: '',
    });
    // Don't close modal - keep it open for continuous entry
  };

  const handleCancel = () => {
    setFormData({
      malmattechePrakar: '',
      malmattecheVarnan: '',
      vaparPrakar: '',
      bandkamMajla: '',
      shetrafalPurvPachimFoot: '',
      shetrafalUttarDakshinFoot: '',
      ekunShetrafalChorasFoot: '',
      shetrafalPurvPachimMeter: '',
      shetrafalUttarDakshinMeter: '',
      vayoman: '',
      imaraticheBandkamVarsh: '',
      ghasaraDar: '',
      bharank: '',
      imaraticheVarshikMulya: '',
      aakraniDar: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="बांदकामाची कर आकारणी"
      size="x-large"
      footer={
        <>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            {initialData ? 'बदल करा' : 'जतन करा'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            रद्द करा
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Row 1 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Select2
              options={malmattechePrakarOptions}
              value={formData.malmattechePrakar}
              onChange={handleMalmattechePrakarChange}
              placeholder="Select Type"
              label="मालमत्तेचे प्रकार"
              searchable={true}
              clearable={false}
            />
          </div>

          <div>
            <Select2
              options={malmattecheVarnanOptions}
              value={formData.malmattecheVarnan}
              onChange={handleMalmattecheVarnanChange}
              placeholder="Select Description"
              label="मालमत्तेचे वर्णन"
              searchable={true}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              वापर प्रकार
            </label>
            <MarathiInput
              name="vaparPrakar"
              value={formData.vaparPrakar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Usage Type"
            />
          </div>

          <div>
            <Select2
              options={bandkamMajlaOptions}
              value={formData.bandkamMajla}
              onChange={handleBandkamMajlaChange}
              placeholder="Select Floor"
              label="बांदकाम मजला"
              searchable={true}
              clearable={false}
            />
          </div>
        </div>

        {/* Row 2 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ पूर्व पश्चिम (चौरस फूट)
            </label>
            <input
              type="number" min="0" step="any"
              name="shetrafalPurvPachimFoot"
              value={formData.shetrafalPurvPachimFoot}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Area"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ उत्तर दक्षिण (चौरस फूट)
            </label>
            <input
              type="number" min="0" step="any"
              name="shetrafalUttarDakshinFoot"
              value={formData.shetrafalUttarDakshinFoot}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Area"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण क्षेत्रफळ (चौरस फूट)
            </label>
            <input
              type="number" min="0" step="any"
              name="ekunShetrafalChorasFoot"
              value={formData.ekunShetrafalChorasFoot}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter or Auto-calculated"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ पूर्व पश्चिम (चौरस मीटर)
            </label>
            <input
              type="text"
              name="shetrafalPurvPachimMeter"
              value={formData.shetrafalPurvPachimMeter}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        {/* Row 3 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ उत्तर दक्षिण (चौरस मीटर)
            </label>
            <input
              type="text"
              name="shetrafalUttarDakshinMeter"
              value={formData.shetrafalUttarDakshinMeter}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="Auto-calculated"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण क्षेत्रफळ (चौरस मीटर)
            </label>
            <input
              type="text"
              value={
                formData.ekunShetrafalChorasFoot
                  ? (Number(formData.ekunShetrafalChorasFoot) * 0.092903).toFixed(2)
                  : ''
              }
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="Auto-calculated"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              वयोमान
            </label>
            <input
              type="number" min="0" step="any"
              name="vayoman"
              value={formData.vayoman}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Age"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              इमारतीचे बांदकाम वर्ष
            </label>
            <input
              type="number" min="0" step="any"
              name="imaraticheBandkamVarsh"
              value={formData.imaraticheBandkamVarsh}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Year"
            />
          </div>
        </div>

        {/* Row 4 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              घसारा दर
            </label>
            <input
              type="number" min="0" step="any"
              name="ghasaraDar"
              value={formData.ghasaraDar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Rate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              भारांक
            </label>
            <input
              type="number" min="0" step="any"
              name="bharank"
              value={formData.bharank}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Weight"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              इमारतीचे वार्षिक मूल्य
            </label>
            <input
              type="number" min="0" step="any"
              name="imaraticheVarshikMulya"
              value={formData.imaraticheVarshikMulya}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Annual Value"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              आकारणी दर
            </label>
            <input
              type="number" min="0" step="any"
              name="aakraniDar"
              value={formData.aakraniDar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Rate"
            />
          </div>
        </div>

        {/* Row 5 - 2 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              इमारतीचे भांडवली मूल्य = क्षेत्रफळ (चौ.मी.) × वार्षिक मूल्य × भारांक
            </label>
            <input
              type="text"
              value={
                formData.ekunShetrafalChorasFoot &&
                formData.imaraticheVarshikMulya &&
                formData.bharank
                  ? (
                      Number(formData.ekunShetrafalChorasFoot) *
                      0.092903 *
                      Number(formData.imaraticheVarshikMulya) *
                      Number(formData.bharank)
                    ).toFixed(2)
                  : ''
              }
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="Auto-calculated"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              कर आकारणी = (भांडवली मूल्य × आकारणी दर) / 1000
            </label>
            <input
              type="text"
              value={
                formData.ekunShetrafalChorasFoot &&
                formData.imaraticheVarshikMulya &&
                formData.bharank &&
                formData.aakraniDar
                  ? (
                      (Number(formData.ekunShetrafalChorasFoot) *
                      0.092903 *
                      Number(formData.imaraticheVarshikMulya) *
                      Number(formData.bharank) *
                      Number(formData.aakraniDar)) / 1000
                    ).toFixed(2)
                  : ''
              }
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="Auto-calculated"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BandkamModal;

import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/common/Modal';
import { Select2, type Select2Option } from '../../../components/common';
import type { KhulaBhukhandData, KhulaBhukhandModalProps } from '../../../interfaces/dashboard/nodni-form/KhulaBhukhandModal.types';
import { authService, commonDdlService } from '../../../services';

const KhulaBhukhandModal = ({ isOpen, onClose, onSave, initialData }: KhulaBhukhandModalProps) => {
  const [formData, setFormData] = useState<KhulaBhukhandData>({
    malmattechePrakar: '',
    malmattecheVarnan: '',
    vaparPrakar: '',
    gavacheNav: '',
    gavthanBaher: '',
    shetrafalPurabPachimMeter: '',
    shetrafalUttarDakshinFoot: '',
    ekunShetrafalChorasFoot: '',
    shetrafalPurabPachimMeter2: '',
    shetrafalUttarDakshinMeter: '',
    jaminicheVarshikMulya: '',
    aakraniDar: '',
  });

  // Dynamic dropdown options from API
  const [malmattechePrakarOptions, setMalmattechePrakarOptions] = useState<Select2Option[]>([]);
  const [malmattecheVarnanOptions, setMalmattecheVarnanOptions] = useState<Select2Option[]>([]);
  const [gavacheNavOptions, setGavacheNavOptions] = useState<Select2Option[]>([]);
  const [gavthanBaherOptions, setGavthanBaherOptions] = useState<Select2Option[]>([]);
  const ddlFetchedRef = useRef(false);

  // Fetch dropdown data from API
  useEffect(() => {
    if (ddlFetchedRef.current) return;
    ddlFetchedRef.current = true;

    const fetchDropdowns = async () => {
      try {
        // Fetch malmatteche prakar - filter for खुला भूखंड → both dropdowns
        const prakarRes = await commonDdlService.getMalmattechePrakar() as {
          success: boolean;
          data?: Array<{ id: number; malmatta_prakar_name: string }>;
        };

        if (prakarRes.success && prakarRes.data) {
          const khulaBhukhandRecords = prakarRes.data.filter(
            item => item.malmatta_prakar_name?.includes('खुला भूखंड')
          );

          setMalmattechePrakarOptions(
            khulaBhukhandRecords.map(item => ({
              value: String(item.id),
              label: item.malmatta_prakar_name,
            }))
          );

          setMalmattecheVarnanOptions(
            khulaBhukhandRecords.map(item => ({
              value: String(item.id),
              label: item.malmatta_prakar_name,
            }))
          );
        }

        // Village Name → gat gram panchayat name from current user
        const currentUser = authService.getCurrentUser();
        if (currentUser?.gat_gram_panchayat_id && currentUser?.gat_gram_panchayat) {
          setGavacheNavOptions([{
            value: String(currentUser.gat_gram_panchayat_id),
            label: currentUser.gat_gram_panchayat,
          }]);
        }
      } catch {
        // keep defaults empty on error
      }
    };

    fetchDropdowns();
  }, []);

  // When village is selected, fetch gavthan/gavthan baherche options
  useEffect(() => {
    if (!formData.gavacheNav) {
      setGavthanBaherOptions([]);
      return;
    }

    const fetchGavthanBaherche = async () => {
      try {
        const res = await commonDdlService.getGavthanBaherche(Number(formData.gavacheNav)) as {
          success: boolean;
          data?: Array<{ id: number; prakar_name: string }>;
        };

        if (res.success && res.data) {
          setGavthanBaherOptions(
            res.data.map(item => ({
              value: String(item.id),
              label: item.prakar_name,
            }))
          );
        }
      } catch {
        setGavthanBaherOptions([]);
      }
    };

    fetchGavthanBaherche();
  }, [formData.gavacheNav]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    // Auto-calculate when EW/NS feet change
    if (name === 'shetrafalPurabPachimMeter' || name === 'shetrafalUttarDakshinFoot') {
      const ewFoot = parseFloat(name === 'shetrafalPurabPachimMeter' ? value : formData.shetrafalPurabPachimMeter) || 0;
      const nsFoot = parseFloat(name === 'shetrafalUttarDakshinFoot' ? value : formData.shetrafalUttarDakshinFoot) || 0;

      // Convert feet to meter (1 sq ft = 0.092903 sq meter)
      updated.shetrafalPurabPachimMeter2 = ewFoot ? (ewFoot * 0.092903).toFixed(2) : '';
      updated.shetrafalUttarDakshinMeter = nsFoot ? (nsFoot * 0.092903).toFixed(2) : '';

      // Auto-calculate Total Sq Feet
      const totalSqFt = ewFoot * nsFoot;
      updated.ekunShetrafalChorasFoot = totalSqFt ? totalSqFt.toFixed(2) : '';
    }

    setFormData(updated);
  };


  const handleMalmattechePrakarChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, malmattechePrakar: value as string }));
  };

  const handleMalmattecheVarnanChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, malmattecheVarnan: value as string }));
  };

  const handleGavacheNavChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, gavacheNav: value as string, gavthanBaher: '' }));
  };

  const handleGavthanBaherChange = async (value: string | number | (string | number)[]) => {
    const selectedId = value as string;
    setFormData(prev => ({ ...prev, gavthanBaher: selectedId, jaminicheVarshikMulya: '', aakraniDar: '' }));

    if (!selectedId) return;

    try {
      const res = await commonDdlService.getOpenPlotRatesById(Number(selectedId)) as {
        success: boolean;
        data?: { id: number; varshik_dar: number; aakarani_dar: number };
      };

      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          jaminicheVarshikMulya: res.data!.varshik_dar ? String(res.data!.varshik_dar) : '',
          aakraniDar: res.data!.aakarani_dar ? String(res.data!.aakarani_dar) : '',
        }));
      }
    } catch {
      // keep fields empty on error
    }
  };

  const handleSave = () => {
    const dataWithNames = {
      ...formData,
      malmattechePrakarName: malmattechePrakarOptions.find(o => o.value === formData.malmattechePrakar)?.label || '',
      malmattecheVarnanName: malmattecheVarnanOptions.find(o => o.value === formData.malmattecheVarnan)?.label || '',
      gavacheNavName: gavacheNavOptions.find(o => o.value === formData.gavacheNav)?.label || '',
      gavthanBaherName: gavthanBaherOptions.find(o => o.value === formData.gavthanBaher)?.label || '',
    };
    onSave(dataWithNames);
    setFormData({
      malmattechePrakar: '',
      malmattecheVarnan: '',
      vaparPrakar: '',
      gavacheNav: '',
      gavthanBaher: '',
      shetrafalPurabPachimMeter: '',
      shetrafalUttarDakshinFoot: '',
      ekunShetrafalChorasFoot: '',
      shetrafalPurabPachimMeter2: '',
      shetrafalUttarDakshinMeter: '',
      jaminicheVarshikMulya: '',
      aakraniDar: '',
    });
    // Don't close modal - keep it open for continuous entry
  };

  const handleCancel = () => {
    setFormData({
      malmattechePrakar: '',
      malmattecheVarnan: '',
      vaparPrakar: '',
      gavacheNav: '',
      gavthanBaher: '',
      shetrafalPurabPachimMeter: '',
      shetrafalUttarDakshinFoot: '',
      ekunShetrafalChorasFoot: '',
      shetrafalPurabPachimMeter2: '',
      shetrafalUttarDakshinMeter: '',
      jaminicheVarshikMulya: '',
      aakraniDar: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="खुला भूखंड कर आकारणी (Open Land Tax Assessment)"
      size="x-large"
      footer={
        <>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            {initialData ? 'बदल करा (Update)' : 'जतन करा (Save)'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            रद्द करा (Cancel)
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
              label="मालमत्तेचे प्रकार (Property Type)"
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
              label="मालमत्तेचे वर्णन (Property Description)"
              searchable={true}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              वापर प्रकार (Usage Type)
            </label>
            <input
              type="text"
              name="vaparPrakar"
              value={formData.vaparPrakar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Usage Type"
            />
          </div>

          <div>
            <Select2
              options={gavacheNavOptions}
              value={formData.gavacheNav}
              onChange={handleGavacheNavChange}
              placeholder="Select Village"
              label="गावाचे नाव (Village Name)"
              searchable={true}
              clearable={false}
            />
          </div>
        </div>

        {/* Row 2 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Select2
              options={gavthanBaherOptions}
              value={formData.gavthanBaher}
              onChange={handleGavthanBaherChange}
              placeholder="Select"
              label="गावठाण/गावठाण बाहेर (Within/Outside Village)"
              searchable={true}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ पूर्व पश्चिम (फूट) (Area East-West in Feet)
            </label>
            <input
              type="number" min="0" step="any"
              name="shetrafalPurabPachimMeter"
              value={formData.shetrafalPurabPachimMeter}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Area"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ उत्तर दक्षिण (फूट) (Area North-South in Feet)
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
              एकूण क्षेत्रफळ (चौरस फूट) (Total Area in Sq. Feet)
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
        </div>

        {/* Row 3 - 5 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ पूर्व पश्चिम (मीटर) (Area East-West in Meter)
            </label>
            <input
              type="text"
              name="shetrafalPurabPachimMeter2"
              value={formData.shetrafalPurabPachimMeter2}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="Auto-calculated"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ उत्तर दक्षिण (मीटर) (Area North-South in Meter)
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
              एकूण क्षेत्रफळ (चौरस मीटर) (Total Area in Sq. Meter)
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
              जमिनीचे वार्षिक मूल्य (Annual Land Value)
            </label>
            <input
              type="number" min="0" step="any"
              name="jaminicheVarshikMulya"
              value={formData.jaminicheVarshikMulya}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter or Auto-filled"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              आकारणी दर (Assessment Rate)
            </label>
            <input
              type="number" min="0" step="any"
              name="aakraniDar"
              value={formData.aakraniDar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter or Auto-filled"
            />
          </div>
        </div>

        {/* Row 4 - 2 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              जमिनीचे भांडवली मूल्य (Land Capital Value) = क्षेत्रफळ × वार्षिक मूल्य
            </label>
            <input
              type="text"
              value={
                formData.ekunShetrafalChorasFoot &&
                formData.jaminicheVarshikMulya
                  ? (
                      Number(formData.ekunShetrafalChorasFoot) *
                      0.092903 *
                      Number(formData.jaminicheVarshikMulya)
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
              कर आकारणी (Tax Assessment) = भांडवली मूल्य × आकारणी दर / 1000
            </label>
            <input
              type="text"
              value={
                formData.ekunShetrafalChorasFoot &&
                formData.jaminicheVarshikMulya &&
                formData.aakraniDar
                  ? (
                      (Number(formData.ekunShetrafalChorasFoot) *
                      0.092903 *
                      Number(formData.jaminicheVarshikMulya) *
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

export default KhulaBhukhandModal;

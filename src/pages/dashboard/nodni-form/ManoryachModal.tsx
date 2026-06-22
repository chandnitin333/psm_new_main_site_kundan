import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/common/Modal';
import { Select2, MarathiInput, type Select2Option } from '../../../components/common';
import type { ManoryachData, ManoryachModalProps } from '../../../interfaces/dashboard/nodni-form/ManoryachModal.types';
import { commonDdlService } from '../../../services';

const ManoryachModal = ({ isOpen, onClose, onSave, initialData }: ManoryachModalProps) => {
  const [formData, setFormData] = useState<ManoryachData>({
    malmattechePrakar: '',
    malmattecheVarnan: '',
    vaparPrakar: '',
    manorycheBhag: '',
    shetrafalPurvPachimFoot: '',
    shetrafalUttarDakshinFoot: '',
    ekunShetrafalChorasFoot: '',
    shetrafalPurvPachimMeter: '',
    shetrafalUttarDakshinMeter: '',
    aakraniDar: '',
    majla: '',
  });

  // Dynamic dropdown options from API
  const [malmattechePrakarOptions, setMalmattechePrakarOptions] = useState<Select2Option[]>([]);
  const [malmattecheVarnanOptions, setMalmattecheVarnanOptions] = useState<Select2Option[]>([]);
  const [manorycheBhagOptions, setManorycheBhagOptions] = useState<Select2Option[]>([]);
  const ddlFetchedRef = useRef(false);

  // Fetch dropdown data from API
  useEffect(() => {
    if (ddlFetchedRef.current) return;
    ddlFetchedRef.current = true;

    const fetchDropdowns = async () => {
      try {
        // Fetch malmatteche prakar - filter for मनोरा only
        const prakarRes = await commonDdlService.getMalmattechePrakar() as {
          success: boolean;
          data?: Array<{ id: number; malmatta_prakar_name: string }>;
        };
        if (prakarRes.success && prakarRes.data) {
          const filtered = prakarRes.data.filter(
            item => item.malmatta_prakar_name?.includes('मनोरा')
          );
          setMalmattechePrakarOptions(
            filtered.map(item => ({
              value: String(item.id),
              label: item.malmatta_prakar_name,
            }))
          );
        }

        // Fetch malmatta - filter for आर सी सी, खुला भूखंड, माती
        const malmattaRes = await commonDdlService.getMalmatta() as {
          success: boolean;
          data?: Array<{ id: number; malmatta_name: string }>;
        };
        if (malmattaRes.success && malmattaRes.data) {
          const filtered = malmattaRes.data.filter(
            item => item.malmatta_name?.includes('आर सी सी') ||
                    item.malmatta_name?.includes('खुला भूखंड') ||
                    item.malmatta_name?.includes('माती')
          );
          setMalmattecheVarnanOptions(
            filtered.map(item => ({
              value: String(item.id),
              label: item.malmatta_name,
            }))
          );
        }

        // Fetch towers for Entertainment Section dropdown
        const towerRes = await commonDdlService.getTowers() as {
          success: boolean;
          data?: Array<{ id: number; tower_name: string }>;
        };
        if (towerRes.success && towerRes.data) {
          setManorycheBhagOptions(
            towerRes.data.map(item => ({
              value: String(item.id),
              label: item.tower_name,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    setFormData(updated);
  };

  const handleMalmattechePrakarChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, malmattechePrakar: value as string }));
  };

  const handleMalmattecheVarnanChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, malmattecheVarnan: value as string }));
  };

  const handleManorycheBhagChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, manorycheBhag: value as string }));
  };

  const handleSave = () => {
    const dataWithNames = {
      ...formData,
      malmattechePrakarName: malmattechePrakarOptions.find(o => o.value === formData.malmattechePrakar)?.label || '',
      malmattecheVarnanName: malmattecheVarnanOptions.find(o => o.value === formData.malmattecheVarnan)?.label || '',
      manorycheBhagName: manorycheBhagOptions.find(o => o.value === formData.manorycheBhag)?.label || '',
    };
    onSave(dataWithNames);
    setFormData({
      malmattechePrakar: '',
      malmattecheVarnan: '',
      vaparPrakar: '',
      manorycheBhag: '',
      shetrafalPurvPachimFoot: '',
      shetrafalUttarDakshinFoot: '',
      ekunShetrafalChorasFoot: '',
      shetrafalPurvPachimMeter: '',
      shetrafalUttarDakshinMeter: '',
      aakraniDar: '',
      majla: '',
    });
    // Don't close modal - keep it open for continuous entry
  };

  const handleCancel = () => {
    setFormData({
      malmattechePrakar: '',
      malmattecheVarnan: '',
      vaparPrakar: '',
      manorycheBhag: '',
      shetrafalPurvPachimFoot: '',
      shetrafalUttarDakshinFoot: '',
      ekunShetrafalChorasFoot: '',
      shetrafalPurvPachimMeter: '',
      shetrafalUttarDakshinMeter: '',
      aakraniDar: '',
      majla: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="मनोऱ्याचे कर आकारणी (Entertainment Tax Assessment)"
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
              options={manorycheBhagOptions}
              value={formData.manorycheBhag}
              onChange={handleManorycheBhagChange}
              placeholder="Select Section"
              label="मनोऱ्याचे भाग (Entertainment Section)"
              searchable={true}
              clearable={false}
            />
          </div>
        </div>

        {/* Row 2 - 3 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ पूर्व पश्चिम (चौरस फूट) (Area East-West in Sq. Feet)
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
              क्षेत्रफळ उत्तर दक्षिण (चौरस फूट) (Area North-South in Sq. Feet)
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

        {/* Row 3 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ पूर्व पश्चिम (चौरस मीटर) (Area East-West in Sq. Meter)
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ उत्तर दक्षिण (चौरस मीटर) (Area North-South in Sq. Meter)
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

        </div>

        {/* Row 4 - 3 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              placeholder="Enter Rate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              मजला (Floor)
            </label>
            <input
              type="number" min="0" step="any"
              name="majla"
              value={formData.majla}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Floor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              कर आकारणी (Tax Assessment) = एकूण क्षेत्रफळ (चौ.फू.) × आकारणी दर × मजला
            </label>
            <input
              type="text"
              value={
                formData.ekunShetrafalChorasFoot &&
                formData.aakraniDar
                  ? (
                      Number(formData.ekunShetrafalChorasFoot) *
                      Number(formData.aakraniDar) *
                      (Number(formData.majla) || 1)
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

export default ManoryachModal;

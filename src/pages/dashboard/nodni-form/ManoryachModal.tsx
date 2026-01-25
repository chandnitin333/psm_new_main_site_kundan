import { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/common/Modal';
import { Select2, type Select2Option } from '../../../components/common';
import type { ManoryachData, ManoryachModalProps } from '../../../interfaces/dashboard/nodni-form/ManoryachModal.types';

const ManoryachModal = ({ isOpen, onClose, onSave, initialData }: ManoryachModalProps) => {
  const [formData, setFormData] = useState<ManoryachData>({
    malmattechePrakar: '',
    malmattecheVarnan: '',
    vaparPrakar: '',
    manorycheBhag: '',
    shetrafalPurvPachimFoot: '',
    shetrafalUttarDakshinFoot: '',
    shetrafalPurvPachimMeter: '',
    shetrafalUttarDakshinMeter: '',
    aakraniDar: '',
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Select2 options
  const malmattechePrakarOptions: Select2Option[] = useMemo(() => [
    { value: 'commercial', label: 'व्यावसायिक (Commercial)' },
    { value: 'entertainment', label: 'मनोरंजन (Entertainment)' },
    { value: 'multiplex', label: 'मल्टिप्लेक्स (Multiplex)' },
  ], []);

  const malmattecheVarnanOptions: Select2Option[] = useMemo(() => [
    { value: 'theater', label: 'थिएटर (Theater)' },
    { value: 'cinema', label: 'सिनेमा (Cinema)' },
    { value: 'hall', label: 'हॉल (Hall)' },
  ], []);

  const manorycheBhagOptions: Select2Option[] = useMemo(() => [
    { value: 'screen1', label: 'स्क्रीन १ (Screen 1)' },
    { value: 'screen2', label: 'स्क्रीन २ (Screen 2)' },
    { value: 'main_hall', label: 'मुख्य हॉल (Main Hall)' },
  ], []);

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
    onSave(formData);
    setFormData({
      malmattechePrakar: '',
      malmattecheVarnan: '',
      vaparPrakar: '',
      manorycheBhag: '',
      shetrafalPurvPachimFoot: '',
      shetrafalUttarDakshinFoot: '',
      shetrafalPurvPachimMeter: '',
      shetrafalUttarDakshinMeter: '',
      aakraniDar: '',
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
      shetrafalPurvPachimMeter: '',
      shetrafalUttarDakshinMeter: '',
      aakraniDar: '',
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
              type="text"
              value={
                formData.shetrafalPurvPachimFoot && formData.shetrafalUttarDakshinFoot
                  ? (Number(formData.shetrafalPurvPachimFoot) * Number(formData.shetrafalUttarDakshinFoot)).toFixed(2)
                  : ''
              }
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
              क्षेत्रफळ पूर्व पश्चिम (चौरस मीटर) (Area East-West in Sq. Meter)
            </label>
            <input
              type="number" min="0" step="any"
              name="shetrafalPurvPachimMeter"
              value={formData.shetrafalPurvPachimMeter}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Area"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ उत्तर दक्षिण (चौरस मीटर) (Area North-South in Sq. Meter)
            </label>
            <input
              type="number" min="0" step="any"
              name="shetrafalUttarDakshinMeter"
              value={formData.shetrafalUttarDakshinMeter}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Area"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण क्षेत्रफळ (चौरस मीटर) (Total Area in Sq. Meter)
            </label>
            <input
              type="text"
              value={
                formData.shetrafalPurvPachimMeter && formData.shetrafalUttarDakshinMeter
                  ? (Number(formData.shetrafalPurvPachimMeter) * Number(formData.shetrafalUttarDakshinMeter)).toFixed(2)
                  : ''
              }
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="Auto-calculated"
            />
          </div>

        </div>

        {/* Row 4 - 2 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              कर आकारणी (Tax Assessment) = क्षेत्रफळ × आकारणी दर / 1000
            </label>
            <input
              type="text"
              value={
                formData.shetrafalPurvPachimMeter &&
                formData.shetrafalUttarDakshinMeter &&
                formData.aakraniDar
                  ? (
                      (Number(formData.shetrafalPurvPachimMeter) *
                      Number(formData.shetrafalUttarDakshinMeter) *
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

export default ManoryachModal;

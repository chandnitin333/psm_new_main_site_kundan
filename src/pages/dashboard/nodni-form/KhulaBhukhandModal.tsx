import { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/common/Modal';
import { Select2, type Select2Option } from '../../../components/common';
import type { KhulaBhukhandData, KhulaBhukhandModalProps } from '../../../interfaces/dashboard/nodni-form/KhulaBhukhandModal.types';

const KhulaBhukhandModal = ({ isOpen, onClose, onSave, initialData }: KhulaBhukhandModalProps) => {
  const [formData, setFormData] = useState<KhulaBhukhandData>({
    malmattechePrakar: '',
    malmattecheVarnan: '',
    vaparPrakar: '',
    gavacheNav: '',
    gavthanBaher: '',
    shetrafalPurabPachimMeter: '',
    shetrafalUttarDakshinFoot: '',
    shetrafalPurabPachimMeter2: '',
    shetrafalUttarDakshinMeter: '',
    jaminicheVarshikMulya: '',
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
    { value: 'residential', label: 'निवासी (Residential)' },
    { value: 'commercial', label: 'व्यावसायिक (Commercial)' },
    { value: 'agricultural', label: 'शेती (Agricultural)' },
  ], []);

  const malmattecheVarnanOptions: Select2Option[] = useMemo(() => [
    { value: 'plot', label: 'प्लॉट (Plot)' },
    { value: 'land', label: 'जमीन (Land)' },
  ], []);

  const gavacheNavOptions: Select2Option[] = useMemo(() => [
    { value: 'village1', label: 'गाव १ (Village 1)' },
    { value: 'village2', label: 'गाव २ (Village 2)' },
  ], []);

  const gavthanBaherOptions: Select2Option[] = useMemo(() => [
    { value: 'gavthan', label: 'गावठाण (Within Village)' },
    { value: 'baher', label: 'गावठाण बाहेर (Outside Village)' },
  ], []);

  const handleMalmattechePrakarChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, malmattechePrakar: value as string }));
  };

  const handleMalmattecheVarnanChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, malmattecheVarnan: value as string }));
  };

  const handleGavacheNavChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, gavacheNav: value as string }));
  };

  const handleGavthanBaherChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, gavthanBaher: value as string }));
  };

  const handleSave = () => {
    onSave(formData);
    setFormData({
      malmattechePrakar: '',
      malmattecheVarnan: '',
      vaparPrakar: '',
      gavacheNav: '',
      gavthanBaher: '',
      shetrafalPurabPachimMeter: '',
      shetrafalUttarDakshinFoot: '',
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
              type="text"
              value={
                formData.shetrafalPurabPachimMeter && formData.shetrafalUttarDakshinFoot
                  ? (Number(formData.shetrafalPurabPachimMeter) * Number(formData.shetrafalUttarDakshinFoot)).toFixed(2)
                  : ''
              }
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="Auto-calculated"
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
              type="number" min="0" step="any"
              name="shetrafalPurabPachimMeter2"
              value={formData.shetrafalPurabPachimMeter2}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter Area"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              क्षेत्रफळ उत्तर दक्षिण (मीटर) (Area North-South in Meter)
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
                formData.shetrafalPurabPachimMeter2 && formData.shetrafalUttarDakshinMeter
                  ? (Number(formData.shetrafalPurabPachimMeter2) * Number(formData.shetrafalUttarDakshinMeter)).toFixed(2)
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
              placeholder="Enter Annual Value"
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
              placeholder="Enter Rate"
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
                formData.shetrafalPurabPachimMeter2 &&
                formData.shetrafalUttarDakshinMeter &&
                formData.jaminicheVarshikMulya
                  ? (
                      Number(formData.shetrafalPurabPachimMeter2) *
                      Number(formData.shetrafalUttarDakshinMeter) *
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
                formData.shetrafalPurabPachimMeter2 &&
                formData.shetrafalUttarDakshinMeter &&
                formData.jaminicheVarshikMulya &&
                formData.aakraniDar
                  ? (
                      (Number(formData.shetrafalPurabPachimMeter2) *
                      Number(formData.shetrafalUttarDakshinMeter) *
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

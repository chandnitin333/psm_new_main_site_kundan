import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/common/Modal';
import YearPicker from '../../../components/common/YearPicker';
import type { MagilKarJodaData, MagilKarJodaModalProps } from '../../../interfaces/dashboard/malmatta-nodni/MagilKarJodaModal.types';

const MagilKarJodaModal = ({ isOpen, onClose, onSave, khatedharkacheNav, bhogwatdaracheNav }: MagilKarJodaModalProps) => {
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<MagilKarJodaData>({
    year: '',
    toYear: '',
    khatedharkacheNav: khatedharkacheNav,
    bhogwatdaracheNav: bhogwatdaracheNav,
    gruhkarVBhumikar: '',
    vijDivabattiKar: '',
    aarogyaRakshanKar: '',
    safaeKar: '',
    samanyaPaniKar: '',
    visheshPaniKar: '',
    iterFees: '',
    noticeFees: '',
    sutPercent: '',
    vadPercent: '',
    ekun: '',
  });

  // Update form data when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      khatedharkacheNav,
      bhogwatdaracheNav,
    }));
  }, [khatedharkacheNav, bhogwatdaracheNav]);

  // Auto-focus on first input (year) when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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

  // Calculate Ekun (total) whenever relevant fields change
  useEffect(() => {
    const gruhkar = parseFloat(formData.gruhkarVBhumikar) || 0;
    const vij = parseFloat(formData.vijDivabattiKar) || 0;
    const aarogya = parseFloat(formData.aarogyaRakshanKar) || 0;
    const safae = parseFloat(formData.safaeKar) || 0;
    const samanyaPani = parseFloat(formData.samanyaPaniKar) || 0;
    const visheshPani = parseFloat(formData.visheshPaniKar) || 0;
    const iter = parseFloat(formData.iterFees) || 0;
    const notice = parseFloat(formData.noticeFees) || 0;
    const sut = parseFloat(formData.sutPercent) || 0;
    const vad = parseFloat(formData.vadPercent) || 0;

    const subtotal = gruhkar + vij + aarogya + safae + samanyaPani + visheshPani + iter + notice;
    const total = subtotal - sut + vad;

    setFormData(prev => ({
      ...prev,
      ekun: total.toFixed(2)
    }));
  }, [
    formData.gruhkarVBhumikar,
    formData.vijDivabattiKar,
    formData.aarogyaRakshanKar,
    formData.safaeKar,
    formData.samanyaPaniKar,
    formData.visheshPaniKar,
    formData.iterFees,
    formData.noticeFees,
    formData.sutPercent,
    formData.vadPercent,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (year: string) => {
    setFormData(prev => ({ ...prev, year }));
  };

  const handleSave = () => {
    onSave(formData);
    handleCancel();
  };

  const handleCancel = () => {
    setFormData({
      year: '',
      toYear: '',
      khatedharkacheNav: '',
      bhogwatdaracheNav: '',
      gruhkarVBhumikar: '',
      vijDivabattiKar: '',
      aarogyaRakshanKar: '',
      safaeKar: '',
      samanyaPaniKar: '',
      visheshPaniKar: '',
      iterFees: '',
      noticeFees: '',
      sutPercent: '',
      vadPercent: '',
      ekun: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="मागील कर जोडा (Add Previous Tax)"
      size="x-large"
      footer={
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            जतन करा (Save)
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            रद्द करा (Cancel)
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Row 1 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              वर्ष (Year)
            </label>
            <YearPicker
              ref={firstInputRef}
              name="year"
              value={formData.year}
              onChange={handleYearChange}
              placeholder="वर्ष निवडा"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              खातेदाराचे नाव (Khedekar Name)
            </label>
            <input
              type="text"
              name="khatedharkacheNav"
              value={formData.khatedharkacheNav}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="खातेदाराचे नाव"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              भोगवटदाराचे नाव (Occupant Name)
            </label>
            <input
              type="text"
              name="bhogwatdaracheNav"
              value={formData.bhogwatdaracheNav}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              placeholder="भोगवटदाराचे नाव"
            />
          </div>
        </div>

        {/* Row 2 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              गृहकर व भूमिकर (House & Land Tax)
            </label>
            <input
              type="number"
              step="0.01"
              name="gruhkarVBhumikar"
              value={formData.gruhkarVBhumikar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="गृहकर व भूमिकर"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              विज/दिवाबत्ती कर (Electricity Tax)
            </label>
            <input
              type="number"
              step="0.01"
              name="vijDivabattiKar"
              value={formData.vijDivabattiKar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="विज/दिवाबत्ती कर"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              आरोग्य रक्षण कर (Health Tax)
            </label>
            <input
              type="number"
              step="0.01"
              name="aarogyaRakshanKar"
              value={formData.aarogyaRakshanKar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="आरोग्य रक्षण कर"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              सफाई कर (Sanitation Tax)
            </label>
            <input
              type="number"
              step="0.01"
              name="safaeKar"
              value={formData.safaeKar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="सफाई कर"
            />
          </div>
        </div>

        {/* Row 3 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              सामान्य पाणी कर (General Water Tax)
            </label>
            <input
              type="number"
              step="0.01"
              name="samanyaPaniKar"
              value={formData.samanyaPaniKar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="सामान्य पाणी कर"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              विशेष पाणी कर (Special Water Tax)
            </label>
            <input
              type="number"
              step="0.01"
              name="visheshPaniKar"
              value={formData.visheshPaniKar}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="विशेष पाणी कर"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              इतर फीस (Other Fees)
            </label>
            <input
              type="number"
              step="0.01"
              name="iterFees"
              value={formData.iterFees}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="इतर फीस"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              नोटीस फीस (Notice Fees)
            </label>
            <input
              type="number"
              step="0.01"
              name="noticeFees"
              value={formData.noticeFees}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="नोटीस फीस"
            />
          </div>
        </div>

        {/* Row 4 - 4 Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              5% सूट (-) (5% Discount)
            </label>
            <input
              type="number"
              step="0.01"
              name="sutPercent"
              value={formData.sutPercent}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="5% सूट"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              5% वाढ (+) (5% Addition)
            </label>
            <input
              type="number"
              step="0.01"
              name="vadPercent"
              value={formData.vadPercent}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="5% वाढ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण (Total)
            </label>
            <input
              type="text"
              name="ekun"
              value={formData.ekun}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed font-semibold"
              placeholder="एकूण"
            />
          </div>

          <div>
            {/* Empty field for 4-column layout */}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MagilKarJodaModal;

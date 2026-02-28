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
    // Row 2: गृहकर व भूमिकर
    gruhkarVBhumikar: '',
    gruhkarSut: '',
    gruhkarVad: '',
    gruhkarEkun: '',
    // Row 3: विज/दिवाबत्ती कर
    vijDivabattiKar: '',
    vijSut: '',
    vijVad: '',
    vijEkun: '',
    // Row 4: आरोग्य रक्षण कर
    aarogyaRakshanKar: '',
    aarogyaSut: '',
    aarogyaVad: '',
    aarogyaEkun: '',
    // Row 5: सफाई कर
    safaeKar: '',
    safaeSut: '',
    safaeVad: '',
    safaeEkun: '',
    // Row 6: सामान्य पाणी कर
    samanyaPaniKar: '',
    samanyaPaniSut: '',
    samanyaPaniVad: '',
    samanyaPaniEkun: '',
    // Row 7: विशेष पाणी कर
    visheshPaniKar: '',
    visheshPaniSut: '',
    visheshPaniVad: '',
    visheshPaniEkun: '',
    // Row 8: इतर फीस, नोटीस फीस, एकूण
    iterFees: '',
    noticeFees: '',
    grandEkun: '',
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

  // Helper function to calculate row total
  const calculateRowTotal = (amount: string, sut: string, vad: string): string => {
    const amountNum = parseFloat(amount) || 0;
    const sutNum = parseFloat(sut) || 0;
    const vadNum = parseFloat(vad) || 0;
    return (amountNum - sutNum + vadNum).toFixed(2);
  };

  // Calculate row totals whenever relevant fields change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      gruhkarEkun: calculateRowTotal(prev.gruhkarVBhumikar, prev.gruhkarSut, prev.gruhkarVad),
    }));
  }, [formData.gruhkarVBhumikar, formData.gruhkarSut, formData.gruhkarVad]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      vijEkun: calculateRowTotal(prev.vijDivabattiKar, prev.vijSut, prev.vijVad),
    }));
  }, [formData.vijDivabattiKar, formData.vijSut, formData.vijVad]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      aarogyaEkun: calculateRowTotal(prev.aarogyaRakshanKar, prev.aarogyaSut, prev.aarogyaVad),
    }));
  }, [formData.aarogyaRakshanKar, formData.aarogyaSut, formData.aarogyaVad]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      safaeEkun: calculateRowTotal(prev.safaeKar, prev.safaeSut, prev.safaeVad),
    }));
  }, [formData.safaeKar, formData.safaeSut, formData.safaeVad]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      samanyaPaniEkun: calculateRowTotal(prev.samanyaPaniKar, prev.samanyaPaniSut, prev.samanyaPaniVad),
    }));
  }, [formData.samanyaPaniKar, formData.samanyaPaniSut, formData.samanyaPaniVad]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      visheshPaniEkun: calculateRowTotal(prev.visheshPaniKar, prev.visheshPaniSut, prev.visheshPaniVad),
    }));
  }, [formData.visheshPaniKar, formData.visheshPaniSut, formData.visheshPaniVad]);

  // Calculate Grand Total
  useEffect(() => {
    const gruhkarTotal = parseFloat(formData.gruhkarEkun) || 0;
    const vijTotal = parseFloat(formData.vijEkun) || 0;
    const aarogyaTotal = parseFloat(formData.aarogyaEkun) || 0;
    const safaeTotal = parseFloat(formData.safaeEkun) || 0;
    const samanyaPaniTotal = parseFloat(formData.samanyaPaniEkun) || 0;
    const visheshPaniTotal = parseFloat(formData.visheshPaniEkun) || 0;
    const iterFeesNum = parseFloat(formData.iterFees) || 0;
    const noticeFeesNum = parseFloat(formData.noticeFees) || 0;

    const grandTotal = gruhkarTotal + vijTotal + aarogyaTotal + safaeTotal + samanyaPaniTotal + visheshPaniTotal + iterFeesNum + noticeFeesNum;

    setFormData(prev => ({
      ...prev,
      grandEkun: grandTotal.toFixed(2),
    }));
  }, [
    formData.gruhkarEkun,
    formData.vijEkun,
    formData.aarogyaEkun,
    formData.safaeEkun,
    formData.samanyaPaniEkun,
    formData.visheshPaniEkun,
    formData.iterFees,
    formData.noticeFees,
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
      gruhkarSut: '',
      gruhkarVad: '',
      gruhkarEkun: '',
      vijDivabattiKar: '',
      vijSut: '',
      vijVad: '',
      vijEkun: '',
      aarogyaRakshanKar: '',
      aarogyaSut: '',
      aarogyaVad: '',
      aarogyaEkun: '',
      safaeKar: '',
      safaeSut: '',
      safaeVad: '',
      safaeEkun: '',
      samanyaPaniKar: '',
      samanyaPaniSut: '',
      samanyaPaniVad: '',
      samanyaPaniEkun: '',
      visheshPaniKar: '',
      visheshPaniSut: '',
      visheshPaniVad: '',
      visheshPaniEkun: '',
      iterFees: '',
      noticeFees: '',
      grandEkun: '',
    });
    onClose();
  };

  // Reusable tax row component
  const TaxRow = ({
    label,
    labelEn,
    amountName,
    amountValue,
    sutName,
    sutValue,
    vadName,
    vadValue,
    ekunValue,
  }: {
    label: string;
    labelEn: string;
    amountName: string;
    amountValue: string;
    sutName: string;
    sutValue: string;
    vadName: string;
    vadValue: string;
    ekunValue: string;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label} ({labelEn})
        </label>
        <input
          type="number"
          step="0.01"
          name={amountName}
          value={amountValue}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder={label}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          5% सूट (-) (Discount)
        </label>
        <input
          type="number"
          step="0.01"
          name={sutName}
          value={sutValue}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="5% सूट"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          5% वाढ (+) (Addition)
        </label>
        <input
          type="number"
          step="0.01"
          name={vadName}
          value={vadValue}
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
          value={ekunValue}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed font-semibold"
          placeholder="एकूण"
        />
      </div>
    </div>
  );

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
        {/* Row 1 - Year & Names (4 Fields) */}
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

        {/* Row 2 - गृहकर व भूमिकर */}
        <TaxRow
          label="गृहकर व भूमिकर"
          labelEn="House & Land Tax"
          amountName="gruhkarVBhumikar"
          amountValue={formData.gruhkarVBhumikar}
          sutName="gruhkarSut"
          sutValue={formData.gruhkarSut}
          vadName="gruhkarVad"
          vadValue={formData.gruhkarVad}
          ekunValue={formData.gruhkarEkun}
        />

        {/* Row 3 - विज/दिवाबत्ती कर */}
        <TaxRow
          label="विज/दिवाबत्ती कर"
          labelEn="Electricity Tax"
          amountName="vijDivabattiKar"
          amountValue={formData.vijDivabattiKar}
          sutName="vijSut"
          sutValue={formData.vijSut}
          vadName="vijVad"
          vadValue={formData.vijVad}
          ekunValue={formData.vijEkun}
        />

        {/* Row 4 - आरोग्य रक्षण कर */}
        <TaxRow
          label="आरोग्य रक्षण कर"
          labelEn="Health Tax"
          amountName="aarogyaRakshanKar"
          amountValue={formData.aarogyaRakshanKar}
          sutName="aarogyaSut"
          sutValue={formData.aarogyaSut}
          vadName="aarogyaVad"
          vadValue={formData.aarogyaVad}
          ekunValue={formData.aarogyaEkun}
        />

        {/* Row 5 - सफाई कर */}
        <TaxRow
          label="सफाई कर"
          labelEn="Sanitation Tax"
          amountName="safaeKar"
          amountValue={formData.safaeKar}
          sutName="safaeSut"
          sutValue={formData.safaeSut}
          vadName="safaeVad"
          vadValue={formData.safaeVad}
          ekunValue={formData.safaeEkun}
        />

        {/* Row 6 - सामान्य पाणी कर */}
        <TaxRow
          label="सामान्य पाणी कर"
          labelEn="General Water Tax"
          amountName="samanyaPaniKar"
          amountValue={formData.samanyaPaniKar}
          sutName="samanyaPaniSut"
          sutValue={formData.samanyaPaniSut}
          vadName="samanyaPaniVad"
          vadValue={formData.samanyaPaniVad}
          ekunValue={formData.samanyaPaniEkun}
        />

        {/* Row 7 - विशेष पाणी कर */}
        <TaxRow
          label="विशेष पाणी कर"
          labelEn="Special Water Tax"
          amountName="visheshPaniKar"
          amountValue={formData.visheshPaniKar}
          sutName="visheshPaniSut"
          sutValue={formData.visheshPaniSut}
          vadName="visheshPaniVad"
          vadValue={formData.visheshPaniVad}
          ekunValue={formData.visheshPaniEkun}
        />

        {/* Row 8 - इतर फीस, नोटीस फीस, एकूण */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण (Grand Total)
            </label>
            <input
              type="text"
              name="grandEkun"
              value={formData.grandEkun}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-primary-100 dark:bg-primary-900 text-gray-900 dark:text-white cursor-not-allowed font-bold text-lg"
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

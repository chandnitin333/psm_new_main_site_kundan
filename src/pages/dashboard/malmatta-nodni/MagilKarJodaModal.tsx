import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/common/Modal';
import YearPicker from '../../../components/common/YearPicker';
import { nodniService } from '../../../services';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import type { MagilKarJodaData, MagilKarJodaModalProps } from '../../../interfaces/dashboard/malmatta-nodni/MagilKarJodaModal.types';

// Allow only numbers, decimal point, backspace, delete, tab, arrows, home, end
const numericOnlyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', '.'];
  if (allowedKeys.includes(e.key)) return;
  if (e.key >= '0' && e.key <= '9') return;
  e.preventDefault();
};

// TaxRow defined OUTSIDE the component to prevent remounting on every render
// sut and vad are mutually exclusive: if one has value, other is disabled
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
  onChange,
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
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const hasSut = sutValue !== '' && sutValue !== '0' && sutValue !== '0.00';
  const hasVad = vadValue !== '' && vadValue !== '0' && vadValue !== '0.00';

  return (
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
          onChange={onChange}
          onKeyDown={numericOnlyKeyDown}
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
          onChange={onChange}
          onKeyDown={numericOnlyKeyDown}
          disabled={hasVad}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white ${
            hasVad
              ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50'
              : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700'
          }`}
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
          onChange={onChange}
          onKeyDown={numericOnlyKeyDown}
          disabled={hasSut}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white ${
            hasSut
              ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50'
              : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700'
          }`}
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
};

// Row groups: [amountField, sutField, vadField, ekunField]
const ROW_GROUPS: [string, string, string, string][] = [
  ['gruhkarVBhumikar', 'gruhkarSut', 'gruhkarVad', 'gruhkarEkun'],
  ['vijDivabattiKar', 'vijSut', 'vijVad', 'vijEkun'],
  ['aarogyaRakshanKar', 'aarogyaSut', 'aarogyaVad', 'aarogyaEkun'],
  ['safaeKar', 'safaeSut', 'safaeVad', 'safaeEkun'],
  ['samanyaPaniKar', 'samanyaPaniSut', 'samanyaPaniVad', 'samanyaPaniEkun'],
  ['visheshPaniKar', 'visheshPaniSut', 'visheshPaniVad', 'visheshPaniEkun'],
];

const EKUN_FIELDS = ROW_GROUPS.map(g => g[3]);

// Recalculate all totals for a given form state
const recalculate = (data: MagilKarJodaData): MagilKarJodaData => {
  const updated: MagilKarJodaData = { ...data };
  const d = updated as unknown as Record<string, string>;

  // Each row: sut/vad = percentage entered by user
  // Discount = (sut / 100) * amount, Addition = (vad / 100) * amount
  // Total = amount - discount + addition
  for (const [amount, sut, vad, ekun] of ROW_GROUPS) {
    const a = parseFloat(d[amount]) || 0;
    const sutPercent = parseFloat(d[sut]) || 0;
    const vadPercent = parseFloat(d[vad]) || 0;
    const discountAmt = (sutPercent / 100) * a;
    const additionAmt = (vadPercent / 100) * a;
    d[ekun] = (a - discountAmt + additionAmt).toFixed(2);
  }

  // Grand total = sum of all row totals + iterFees + noticeFees
  let grand = 0;
  for (const ekunField of EKUN_FIELDS) {
    grand += parseFloat(d[ekunField]) || 0;
  }
  grand += parseFloat(updated.iterFees) || 0;
  grand += parseFloat(updated.noticeFees) || 0;
  updated.grandEkun = grand.toFixed(2);

  return updated;
};

const MagilKarJodaModal = ({ isOpen, onClose, onSave, nodniId, khatedharkacheNav, bhogwatdaracheNav }: MagilKarJodaModalProps) => {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();

  const [existingRecordId, setExistingRecordId] = useState<number | null>(null);

  const getInitialFormData = (): MagilKarJodaData => ({
    year: String(new Date().getFullYear()),
    toYear: String(new Date().getFullYear() + 1),
    khatedharkacheNav,
    bhogwatdaracheNav,
    gruhkarVBhumikar: '', gruhkarSut: '', gruhkarVad: '', gruhkarEkun: '',
    vijDivabattiKar: '', vijSut: '', vijVad: '', vijEkun: '',
    aarogyaRakshanKar: '', aarogyaSut: '', aarogyaVad: '', aarogyaEkun: '',
    safaeKar: '', safaeSut: '', safaeVad: '', safaeEkun: '',
    samanyaPaniKar: '', samanyaPaniSut: '', samanyaPaniVad: '', samanyaPaniEkun: '',
    visheshPaniKar: '', visheshPaniSut: '', visheshPaniVad: '', visheshPaniEkun: '',
    iterFees: '', noticeFees: '', grandEkun: '',
  });

  const [formData, setFormData] = useState<MagilKarJodaData>(getInitialFormData());

  // Check if sillak joda record exists
  const checkExistingRecord = async (year: string) => {
    if (!nodniId || !year) return;
    try {
      showLoader('रेकॉर्ड तपासत आहे... (Checking record...)');
      const res = await nodniService.checkSillakJodaExist({
        nodni_id: nodniId,
        year,
      }) as { success: boolean; data?: Record<string, unknown> | null };

      if (res.success && res.data) {
        const d = res.data;
        setExistingRecordId(d.id as number);
        setFormData(recalculate({
          year: String(d.year || year),
          toYear: String(d.to_year || ''),
          khatedharkacheNav: String(d.khatedarache_nav || khatedharkacheNav),
          bhogwatdaracheNav: String(d.bhogavatdarache_nav || bhogwatdaracheNav),
          gruhkarVBhumikar: String(d.gruhkar_v_bhumikar || ''),
          gruhkarSut: String(d['5_percent_discount_gvb'] || ''),
          gruhkarVad: String(d['5_percent_addition_gvb'] || ''),
          gruhkarEkun: '',
          vijDivabattiKar: String(d.viz_divabatti_kar || ''),
          vijSut: String(d['5_percent_discount_vdk'] || ''),
          vijVad: String(d['5_percent_addition_vdk'] || ''),
          vijEkun: '',
          aarogyaRakshanKar: String(d.aarogya_rakshan_kar || ''),
          aarogyaSut: String(d['5_percent_discount_ark'] || ''),
          aarogyaVad: String(d['5_percent_addition_ark'] || ''),
          aarogyaEkun: '',
          safaeKar: String(d.safae_kar || ''),
          safaeSut: String(d['5_percent_discount_sk'] || ''),
          safaeVad: String(d['5_percent_addition_sk'] || ''),
          safaeEkun: '',
          samanyaPaniKar: String(d.samanya_pani_kar || ''),
          samanyaPaniSut: String(d['5_percent_discount_spk'] || ''),
          samanyaPaniVad: String(d['5_percent_addition_spk'] || ''),
          samanyaPaniEkun: '',
          visheshPaniKar: String(d.vishesh_pani_kar || ''),
          visheshPaniSut: String(d['5_percent_discount_vpk'] || ''),
          visheshPaniVad: String(d['5_percent_addition_vpk'] || ''),
          visheshPaniEkun: '',
          iterFees: String(d.etar_fees || ''),
          noticeFees: String(d.notice_fees || ''),
          grandEkun: '',
        }));
      } else {
        setExistingRecordId(null);
      }
    } catch {
      setExistingRecordId(null);
    } finally {
      hideLoader();
    }
  };

  // When modal opens, set default current year and check existing record
  useEffect(() => {
    if (isOpen && nodniId) {
      const currentYear = String(new Date().getFullYear());
      setFormData({
        ...getInitialFormData(),
        year: currentYear,
        toYear: String(new Date().getFullYear() + 1),
      });
      setExistingRecordId(null);
      checkExistingRecord(currentYear);
    }
  }, [isOpen, nodniId]);

  // Auto-focus on first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Single handleInputChange that recalculates everything in one setFormData call
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => recalculate({ ...prev, [name]: value }));
  };

  const handleYearChange = (year: string) => {
    setExistingRecordId(null);
    setFormData(prev => ({
      ...getInitialFormData(),
      year,
      toYear: String((parseInt(year) || 0) + 1),
      khatedharkacheNav: prev.khatedharkacheNav,
      bhogwatdaracheNav: prev.bhogwatdaracheNav,
    }));
    checkExistingRecord(year);
  };

  const handleSave = async () => {
    if (!nodniId) return;

    const payload: Record<string, unknown> = {
      nodni_id: nodniId,
      year: formData.year,
      to_year: formData.toYear,
      khatedarache_nav: formData.khatedharkacheNav,
      bhogavatdarache_nav: formData.bhogwatdaracheNav,
      gruhkar_v_bhumikar: formData.gruhkarVBhumikar || 0,
      '5_percent_discount_gvb': formData.gruhkarSut || 0,
      '5_percent_addition_gvb': formData.gruhkarVad || 0,
      total_gruhkar_v_bhumikar: formData.gruhkarEkun || 0,
      viz_divabatti_kar: formData.vijDivabattiKar || 0,
      '5_percent_discount_vdk': formData.vijSut || 0,
      '5_percent_addition_vdk': formData.vijVad || 0,
      total_viz_divabatti_kar: formData.vijEkun || 0,
      aarogya_rakshan_kar: formData.aarogyaRakshanKar || 0,
      '5_percent_discount_ark': formData.aarogyaSut || 0,
      '5_percent_addition_ark': formData.aarogyaVad || 0,
      total_aarogya_rakshan_kar: formData.aarogyaEkun || 0,
      safae_kar: formData.safaeKar || 0,
      '5_percent_discount_sk': formData.safaeSut || 0,
      '5_percent_addition_sk': formData.safaeVad || 0,
      total_safae_kar: formData.safaeEkun || 0,
      samanya_pani_kar: formData.samanyaPaniKar || 0,
      '5_percent_discount_spk': formData.samanyaPaniSut || 0,
      '5_percent_addition_spk': formData.samanyaPaniVad || 0,
      total_samanya_pani_kar: formData.samanyaPaniEkun || 0,
      vishesh_pani_kar: formData.visheshPaniKar || 0,
      '5_percent_discount_vpk': formData.visheshPaniSut || 0,
      '5_percent_addition_vpk': formData.visheshPaniVad || 0,
      etar_fees: formData.iterFees || 0,
      notice_fees: formData.noticeFees || 0,
      total: formData.grandEkun || 0,
    };

    try {
      showLoader('जतन करत आहे... (Saving...)');
      let res;

      if (existingRecordId) {
        res = await nodniService.updatePreviousTax(existingRecordId, payload);
      } else {
        res = await nodniService.createPreviousTax(payload);
      }

      if (res.success) {
        toast.success(
          existingRecordId
            ? 'मागील कर यशस्वीरित्या अद्यतनित केले (Previous tax updated successfully)'
            : 'मागील कर यशस्वीरित्या जतन केले (Previous tax saved successfully)'
        );
        onSave(formData);
        handleCancel();
      } else {
        toast.error('जतन करताना त्रुटी (Error saving record)');
      }
    } catch {
      toast.error('जतन करताना त्रुटी (Error saving record)');
    } finally {
      hideLoader();
    }
  };

  const handleCancel = () => {
    setFormData(getInitialFormData());
    setExistingRecordId(null);
    onClose();
  };

  return (
    <>
      <ToastContainer />
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
              {existingRecordId ? 'अद्यतनित करा (Update)' : 'जतन करा (Save)'}
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
          {/* Row 1 - Year & Names */}
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
            label="गृहकर व भूमिकर" labelEn="House & Land Tax"
            amountName="gruhkarVBhumikar" amountValue={formData.gruhkarVBhumikar}
            sutName="gruhkarSut" sutValue={formData.gruhkarSut}
            vadName="gruhkarVad" vadValue={formData.gruhkarVad}
            ekunValue={formData.gruhkarEkun} onChange={handleInputChange}
          />

          {/* Row 3 - विज/दिवाबत्ती कर */}
          <TaxRow
            label="विज/दिवाबत्ती कर" labelEn="Electricity Tax"
            amountName="vijDivabattiKar" amountValue={formData.vijDivabattiKar}
            sutName="vijSut" sutValue={formData.vijSut}
            vadName="vijVad" vadValue={formData.vijVad}
            ekunValue={formData.vijEkun} onChange={handleInputChange}
          />

          {/* Row 4 - आरोग्य रक्षण कर */}
          <TaxRow
            label="आरोग्य रक्षण कर" labelEn="Health Tax"
            amountName="aarogyaRakshanKar" amountValue={formData.aarogyaRakshanKar}
            sutName="aarogyaSut" sutValue={formData.aarogyaSut}
            vadName="aarogyaVad" vadValue={formData.aarogyaVad}
            ekunValue={formData.aarogyaEkun} onChange={handleInputChange}
          />

          {/* Row 5 - सफाई कर */}
          <TaxRow
            label="सफाई कर" labelEn="Sanitation Tax"
            amountName="safaeKar" amountValue={formData.safaeKar}
            sutName="safaeSut" sutValue={formData.safaeSut}
            vadName="safaeVad" vadValue={formData.safaeVad}
            ekunValue={formData.safaeEkun} onChange={handleInputChange}
          />

          {/* Row 6 - सामान्य पाणी कर */}
          <TaxRow
            label="सामान्य पाणी कर" labelEn="General Water Tax"
            amountName="samanyaPaniKar" amountValue={formData.samanyaPaniKar}
            sutName="samanyaPaniSut" sutValue={formData.samanyaPaniSut}
            vadName="samanyaPaniVad" vadValue={formData.samanyaPaniVad}
            ekunValue={formData.samanyaPaniEkun} onChange={handleInputChange}
          />

          {/* Row 7 - विशेष पाणी कर */}
          <TaxRow
            label="विशेष पाणी कर" labelEn="Special Water Tax"
            amountName="visheshPaniKar" amountValue={formData.visheshPaniKar}
            sutName="visheshPaniSut" sutValue={formData.visheshPaniSut}
            vadName="visheshPaniVad" vadValue={formData.visheshPaniVad}
            ekunValue={formData.visheshPaniEkun} onChange={handleInputChange}
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
                onKeyDown={numericOnlyKeyDown}
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
                onKeyDown={numericOnlyKeyDown}
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
    </>
  );
};

export default MagilKarJodaModal;

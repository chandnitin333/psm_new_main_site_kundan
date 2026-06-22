import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/common/Modal';
import YearPicker from '../../../components/common/YearPicker';
import { nodniService, commonDdlService } from '../../../services';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { trackAction } from '../../../utils/tracker';
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
// NOTE: 5% सूट (-) and 5% वाढ (+) inputs are intentionally HIDDEN from the UI.
// Their values are still kept in state, auto-filled from the दंड/सूट master, used in
// the total calculation, and saved — they are simply not shown.
const TaxRow = ({
  label,
  labelEn,
  amountName,
  amountValue,
  sutValue,
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
  // explanation tooltip — how this एकूण was computed (सूट or वाढ applied)
  const amt = parseFloat(amountValue) || 0;
  const sutP = parseFloat(sutValue) || 0;
  const vadP = parseFloat(vadValue) || 0;
  const discAmt = Math.round((sutP / 100) * amt);
  const addAmt = Math.round((vadP / 100) * amt);
  let tip: string;
  if (sutP > 0) {
    tip = `रक्कम ₹${amt} − ${sutP}% सूट (₹${discAmt}) = ₹${ekunValue || '0'}`;
  } else if (vadP > 0) {
    tip = `रक्कम ₹${amt} + ${vadP}% वाढ (₹${addAmt}) = ₹${ekunValue || '0'}`;
  } else {
    tip = `सूट / वाढ लागू नाही — एकूण = रक्कम ₹${amt}`;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          एकूण (Total)
          <span className="group relative inline-flex items-center" title={tip}>
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold leading-none text-white">i</span>
            <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 w-max max-w-[240px] -translate-x-1/2 whitespace-normal rounded-md bg-gray-800 px-2.5 py-1.5 text-[11px] font-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              {tip}
            </span>
          </span>
        </label>
        <input
          type="text"
          value={ekunValue}
          readOnly
          tabIndex={-1}
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
  // Total = amount - discount + addition.  Round every component to integer so the
  // एकूण matches the 129 / Namuna reports exactly (no ±1-2 drift).
  for (const [amount, sut, vad, ekun] of ROW_GROUPS) {
    const a = parseFloat(d[amount]) || 0;
    const sutPercent = parseFloat(d[sut]) || 0;
    const vadPercent = parseFloat(d[vad]) || 0;
    const discountAmt = Math.round((sutPercent / 100) * a);
    const additionAmt = Math.round((vadPercent / 100) * a);
    d[ekun] = String(Math.round(a) - discountAmt + additionAmt);
  }

  // Grand total = sum of all (already-rounded) row totals + iterFees + noticeFees
  let grand = 0;
  for (const ekunField of EKUN_FIELDS) {
    grand += parseFloat(d[ekunField]) || 0;
  }
  grand += Math.round(parseFloat(updated.iterFees) || 0);
  grand += Math.round(parseFloat(updated.noticeFees) || 0);
  updated.grandEkun = String(Math.round(grand));

  return updated;
};

const MagilKarJodaModal = ({ isOpen, onClose, onSave, nodniId, khatedharkacheNav, bhogwatdaracheNav }: MagilKarJodaModalProps) => {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();

  const [existingRecordId, setExistingRecordId] = useState<number | null>(null);

  // GP-wise per-tax-head दंड/सूट master (chalu + magil), fetched when the modal opens.
  type HeadSet = Record<string, number>;
  const dandSutRef = useRef<{ chalu: HeadSet; magil: HeadSet }>({ chalu: {}, magil: {} });

  // Map each form row (ROW_GROUPS, same order) -> its dand_sut per-head DB key.
  const HEAD_KEYS = [
    'gruhkar_v_bhumikar_5', 'viz_v_divabatti_kar_5', 'aarogya_rakshan_kar_5',
    'safae_kar_5', 'samanya_pani_kar_5', 'vishesh_pani_kar_5',
  ];

  // Auto-fill सूट/वाढ from the GP master based on the selected year:
  //   year < current year (मागील) -> वाढ (+) = magil row's per-head %
  //   year >= current year (चालू) -> सूट (-) = chalu row's per-head %
  const applyDandSut = (data: MagilKarJodaData, year: string): MagilKarJodaData => {
    const cur = new Date().getFullYear();
    const y = parseInt(year) || cur;
    const isMagil = y < cur;
    const set = isMagil ? dandSutRef.current.magil : dandSutRef.current.chalu;
    const d = { ...data } as unknown as Record<string, string>;
    ROW_GROUPS.forEach(([, sut, vad], i) => {
      const pct = Number(set[HEAD_KEYS[i]]) || 0;
      const val = pct > 0 ? String(pct) : '';
      if (isMagil) { d[vad] = val; d[sut] = ''; }
      else { d[sut] = val; d[vad] = ''; }
    });
    return recalculate(d as unknown as MagilKarJodaData);
  };

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
        // No saved record for this year — auto-fill सूट/वाढ % from the GP master.
        setExistingRecordId(null);
        setFormData(prev => applyDandSut(prev, year));
      }
    } catch {
      setExistingRecordId(null);
    } finally {
      hideLoader();
    }
  };

  // When modal opens, load the GP दंड/सूट master, set default year, then check existing record
  useEffect(() => {
    if (isOpen && nodniId) {
      const currentYear = String(new Date().getFullYear());
      trackAction(
        `मागील कर जोडा (Add Previous Tax) modal उघडला होता — खातेदार: ${khatedharkacheNav || '-'}`,
        { nodni_id: nodniId, khatedar: khatedharkacheNav, page: '/malmatta-nodni' }
      );
      setFormData({
        ...getInitialFormData(),
        year: currentYear,
        toYear: String(new Date().getFullYear() + 1),
      });
      setExistingRecordId(null);
      (async () => {
        try {
          const [chaluRes, magilRes] = await Promise.all([
            commonDdlService.getDandSut('chalu'),
            commonDdlService.getDandSut('magil'),
          ]);
          dandSutRef.current = {
            chalu: (chaluRes?.success && chaluRes.data ? chaluRes.data : {}) as HeadSet,
            magil: (magilRes?.success && magilRes.data ? magilRes.data : {}) as HeadSet,
          };
        } catch { /* ignore — master optional */ }
        checkExistingRecord(currentYear);
      })();
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
        trackAction(
          existingRecordId
            ? `मागील कर जोडा मध्ये डेटा बदलून "जतन करा" बटणावर click करून अद्यतनित केला — खातेदार: ${formData.khatedharkacheNav || '-'}, वर्ष: ${formData.year}, एकूण: ₹${formData.grandEkun || 0}`
            : `मागील कर जोडा मध्ये नवीन डेटा भरून "जतन करा" बटणावर click करून जतन केला — खातेदार: ${formData.khatedharkacheNav || '-'}, वर्ष: ${formData.year}, एकूण: ₹${formData.grandEkun || 0}`,
          {
            nodni_id: nodniId,
            mode: existingRecordId ? 'update' : 'create',
            year: formData.year,
            khatedar: formData.khatedharkacheNav,
            grand_total: formData.grandEkun,
          }
        );
        toast.success(
          existingRecordId
            ? 'मागील कर यशस्वीरित्या अद्यतनित केले (Previous tax updated successfully)'
            : 'मागील कर यशस्वीरित्या जतन केले (Previous tax saved successfully)'
        );
        onSave(formData);
        // reset + close WITHOUT firing a "modal closed" event (save already tracked)
        setFormData(getInitialFormData());
        setExistingRecordId(null);
        onClose();
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
    trackAction(
      `मागील कर जोडा modal बंद केला होता — खातेदार: ${formData.khatedharkacheNav || '-'}`,
      { nodni_id: nodniId, khatedar: formData.khatedharkacheNav, page: '/malmatta-nodni' }
    );
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
                tabIndex={-1}
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
                tabIndex={-1}
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
                tabIndex={-1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                placeholder="भोगवटदाराचे नाव"
              />
            </div>
          </div>

          {/* Tax heads — two per row (each row shows 4 fields: amount + एकूण × 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
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
          </div>

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
                tabIndex={-1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-primary-100 dark:bg-primary-900 text-gray-900 dark:text-white cursor-not-allowed font-bold text-lg"
                placeholder="एकूण"
              />
            </div>

            <div>
              {/* Empty field for 4-column layout */}
            </div>
          </div>

          {/* Note */}
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold leading-none text-white">i</span>
            <span>टीप : ग्रामपंचायतीचे निश्चित (fixed) वाढ व सूट आपोआप (automatically) लागू होतील.</span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MagilKarJodaModal;

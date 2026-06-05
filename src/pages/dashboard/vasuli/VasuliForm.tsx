import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import YearPicker from '../../../components/common/YearPicker';
import DatePicker from '../../../components/common/DatePicker';
import type { VasuliFormData } from '../../../interfaces/dashboard/vasuli/VasuliForm.types';
import { vasuliService, type VasuliAutofillResponse, type VasuliTaxHeads } from '../../../services/vasuliService';

const VasuliForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const isEdit = location.state?.isEdit || false;
  const existingRecord = location.state?.record;

  const [formData, setFormData] = useState<VasuliFormData>({
    nodniId: '',
    year: new Date().getFullYear().toString(),
    toYear: (new Date().getFullYear() + 1).toString(),
    anuKramank: '',
    malmattaKramank: '',
    wardKramank: '',
    plotKramank: '',
    khasaraKramank: '',
    surveyKramank: '',
    khatedharkacheNav: '',
    bhogwatdaracheNav: '',
    patta: '',
    billBookNumber: '',
    pavtiNumber: '',
    gruhkarMagil: '',
    gruhkarChalu: '',
    gruhkarJama: '',
    gruhkarShillak: '',
    vizMagil: '',
    vizChalu: '',
    vizJama: '',
    vizShillak: '',
    aarogyaMagil: '',
    aarogyaChalu: '',
    aarogyaJama: '',
    aarogyaShillak: '',
    safaeMagil: '',
    safaeChalu: '',
    safaeJama: '',
    safaeShillak: '',
    gruhkarPavtiDate: '',
    samanyaPaniMagil: '',
    samanyaPaniChalu: '',
    samanyaPaniJama: '',
    samanyaPaniShillak: '',
    visheshPaniMagil: '',
    visheshPaniChalu: '',
    visheshPaniJama: '',
    visheshPaniShillak: '',
    paniPavtiDate: '',
    noticeFeeMagil: '',
    noticeFeeChalu: '',
    noticeFeeJama: '',
    noticeFeeShillak: '',
    etarFeeMagil: '',
    etarFeeChalu: '',
    etarFeeJama: '',
    etarFeeShillak: '',
    // Payment method
    paymentType: '',
    cashAmount: '',
    chequeNumber: '',
    chequeAmount: '',
    chequeDate: '',
    chequeBankName: '',
    ddNumber: '',
    ddAmount: '',
    ddDate: '',
    ddBankName: '',
    onlineProvider: '',
    onlineAmount: '',
    onlineTransactionId: '',
    paymentImage: null,
    paymentImagePreview: '',
  });

  // Auto-focus on first input when component loads
  useEffect(() => {
    document.title = 'Vasuli Form - वसुली फॉर्म';
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

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

  // Load existing record data if editing — fetch the FULL record from the API by id
  useEffect(() => {
    if (!isEdit || !existingRecord?.id) return;

    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
    // Return YYYY-MM-DD for the DatePicker (handles RFC "Thu, 04 Jun 2026 ..." and ISO)
    const dateStr = (v: unknown) => {
      if (!v) return '';
      const raw = String(v);
      let d = new Date(raw);
      if (isNaN(d.getTime())) {
        const part = raw.split(/[ T]/)[0];
        d = new Date(part);
        if (isNaN(d.getTime())) return part;
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const loadRecord = async () => {
      showLoader('माहिती लोड करत आहे... (Loading record...)');
      try {
        const res = await vasuliService.getById(Number(existingRecord.id));
        if (res.success && res.data) {
          const r = res.data as Record<string, unknown>;
          setFormData(prev => ({
            ...prev,
            nodniId: str(r.nodni_id),
            year: str(r.year) || prev.year,
            toYear: str(r.to_year) || prev.toYear,
            anuKramank: str(r.anu_kramank),
            malmattaKramank: str(r.malmatta_number),
            wardKramank: str(r.ward_number),
            plotKramank: str(r.plot_number),
            khasaraKramank: str(r.khasara_kramank),
            surveyKramank: str(r.survey_number),
            khatedharkacheNav: str(r.khatedharkache_nav),
            bhogwatdaracheNav: str(r.bhogwatdarache_nav),
            patta: str(r.patta_address),

            gruhkarMagil: str(r.magil_gruhkar_v_bhumikar),
            gruhkarChalu: str(r.chalu_gruhkar_v_bhumikar),
            gruhkarJama: str(r.jama_keleli_rakkam_gruhkar_v_bhumikar),
            gruhkarShillak: str(r.sillak_gruhkar_v_bhumikar),

            vizMagil: str(r.magil_viz_divabatti_kar),
            vizChalu: str(r.chalu_viz_divabatti_kar),
            vizJama: str(r.jama_keleli_rakkam_viz_divabatti_kar),
            vizShillak: str(r.sillak_viz_divabatti_kar),

            aarogyaMagil: str(r.magil_aarogya_rakshan_kar),
            aarogyaChalu: str(r.chalu_aarogya_rakshan_kar),
            aarogyaJama: str(r.jama_kelili_rakkam_aarogya_rakshan_kar),
            aarogyaShillak: str(r.sillak_aarogya_rakshan_kar),

            safaeMagil: str(r.magil_safae_kar),
            safaeChalu: str(r.chalu_safae_kar),
            safaeJama: str(r.jama_keleli_rakkam_safae_kar),
            safaeShillak: str(r.sillak_safae_kar),

            gruhkarPavtiDate: dateStr(r.gruhkar_v_bhumikar_pavti_date),

            samanyaPaniMagil: str(r.magil_samanya_pani_kar),
            samanyaPaniChalu: str(r.chalu_samanya_pani_kar),
            samanyaPaniJama: str(r.jama_keleli_rakkam_samanya_pani_kar),
            samanyaPaniShillak: str(r.sillak_samanya_pani_kar),

            visheshPaniMagil: str(r.magil_vishesh_pani_kar),
            visheshPaniChalu: str(r.chalu_vishesh_pani_kar),
            visheshPaniJama: str(r.jama_keleli_rakkam_vishesh_pani_kar),
            visheshPaniShillak: str(r.sillak_vishesh_pani_kar),

            paniPavtiDate: dateStr(r.pani_kar_pavti_v_date),

            noticeFeeMagil: str(r.magil_notice_fee),
            noticeFeeChalu: str(r.chalu_notice_fee),
            noticeFeeJama: str(r.jama_keleli_rakkam_notice_fee),
            noticeFeeShillak: str(r.sillak_noticie_fee),

            etarFeeMagil: str(r.magil_etar_fee),
            etarFeeChalu: str(r.chalu_etar_fee),
            etarFeeJama: str(r.jama_keleli_rakkam_etar_fee),
            etarFeeShillak: str(r.sillak_etar_fee),
          }));
        } else {
          toast.error(res.message || 'रेकॉर्ड लोड करण्यात अयशस्वी (Failed to load record)');
        }
      } catch (err) {
        const message = (err as { message?: string })?.message || 'काहीतरी चूक झाली (Something went wrong)';
        toast.error(message);
      } finally {
        hideLoader();
      }
    };
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-calculate शिल्लक रक्कम (Balance Amount) for all tax rows
  // Formula: (मागील कर + चालू कर) - जमा केलेली रक्कम = शिल्लक रक्कम
  useEffect(() => {
    const calculateBalance = (magil: string, chalu: string, jama: string): string => {
      const magilNum = parseFloat(magil) || 0;
      const chaluNum = parseFloat(chalu) || 0;
      const jamaNum = parseFloat(jama) || 0;
      const balance = (magilNum + chaluNum) - jamaNum;
      return balance >= 0 ? balance.toFixed(2) : '0.00';
    };

    setFormData(prev => ({
      ...prev,
      gruhkarShillak: calculateBalance(prev.gruhkarMagil, prev.gruhkarChalu, prev.gruhkarJama),
      vizShillak: calculateBalance(prev.vizMagil, prev.vizChalu, prev.vizJama),
      aarogyaShillak: calculateBalance(prev.aarogyaMagil, prev.aarogyaChalu, prev.aarogyaJama),
      safaeShillak: calculateBalance(prev.safaeMagil, prev.safaeChalu, prev.safaeJama),
      samanyaPaniShillak: calculateBalance(prev.samanyaPaniMagil, prev.samanyaPaniChalu, prev.samanyaPaniJama),
      visheshPaniShillak: calculateBalance(prev.visheshPaniMagil, prev.visheshPaniChalu, prev.visheshPaniJama),
      noticeFeeShillak: calculateBalance(prev.noticeFeeMagil, prev.noticeFeeChalu, prev.noticeFeeJama),
      etarFeeShillak: calculateBalance(prev.etarFeeMagil, prev.etarFeeChalu, prev.etarFeeJama),
    }));
  }, [
    formData.gruhkarMagil, formData.gruhkarChalu, formData.gruhkarJama,
    formData.vizMagil, formData.vizChalu, formData.vizJama,
    formData.aarogyaMagil, formData.aarogyaChalu, formData.aarogyaJama,
    formData.safaeMagil, formData.safaeChalu, formData.safaeJama,
    formData.samanyaPaniMagil, formData.samanyaPaniChalu, formData.samanyaPaniJama,
    formData.visheshPaniMagil, formData.visheshPaniChalu, formData.visheshPaniJama,
    formData.noticeFeeMagil, formData.noticeFeeChalu, formData.noticeFeeJama,
    formData.etarFeeMagil, formData.etarFeeChalu, formData.etarFeeJama
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (year: string) => {
    setFormData(prev => ({ ...prev, year }));
  };

  const handleDateChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          paymentImage: file,
          paymentImagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, paymentImage: null, paymentImagePreview: '' }));
    }
  };

  // Auto-fill property + previous/current tax when anu_kramank + ward are entered
  const handleAutofill = async () => {
    const anu = formData.anuKramank.trim();
    const ward = formData.wardKramank.trim();
    if (!anu || !ward) return;

    showLoader('माहिती मिळवत आहे... (Fetching data...)');
    try {
      const res = await vasuliService.autofill({
        anu_kramank: anu,
        ward_number: ward,
        year: formData.year,
      });

      const data = res.data as VasuliAutofillResponse | undefined;
      if (!res.success || !data || !data.found || !data.property) {
        toast.info('या अनु क्रमांक व प्रभागासाठी नोंद आढळली नाही (No record found)');
        return;
      }

      const p = data.property;
      const magil = data.magil as VasuliTaxHeads;
      const chalu = data.chalu as VasuliTaxHeads;
      // shillak (balance) = magil + chalu (no jama collected yet)
      const s = (m: number, c: number) => (Number(m) + Number(c)).toString();

      setFormData(prev => ({
        ...prev,
        nodniId: String(p.nodni_id ?? ''),
        // property fields
        malmattaKramank: p.malmatta_number ?? prev.malmattaKramank,
        plotKramank: p.plot_number ?? '',
        khasaraKramank: p.khasara_number ?? '',
        surveyKramank: p.survey_number ?? '',
        khatedharkacheNav: p.khatedharkache_nav ?? '',
        bhogwatdaracheNav: p.bhogwatdarache_nav ?? '',
        patta: p.patta ?? '',
        // magil (previous) column
        gruhkarMagil: String(magil.gruhkar),
        vizMagil: String(magil.viz),
        aarogyaMagil: String(magil.aarogya),
        safaeMagil: String(magil.safae),
        samanyaPaniMagil: String(magil.samanya_pani),
        visheshPaniMagil: String(magil.vishesh_pani),
        noticeFeeMagil: String(magil.notice_fee),
        etarFeeMagil: String(magil.etar_fee),
        // chalu (current) column
        gruhkarChalu: String(chalu.gruhkar),
        vizChalu: String(chalu.viz),
        aarogyaChalu: String(chalu.aarogya),
        safaeChalu: String(chalu.safae),
        samanyaPaniChalu: String(chalu.samanya_pani),
        visheshPaniChalu: String(chalu.vishesh_pani),
        noticeFeeChalu: String(chalu.notice_fee),
        etarFeeChalu: String(chalu.etar_fee),
        // shillak (balance) column
        gruhkarShillak: s(magil.gruhkar, chalu.gruhkar),
        vizShillak: s(magil.viz, chalu.viz),
        aarogyaShillak: s(magil.aarogya, chalu.aarogya),
        safaeShillak: s(magil.safae, chalu.safae),
        samanyaPaniShillak: s(magil.samanya_pani, chalu.samanya_pani),
        visheshPaniShillak: s(magil.vishesh_pani, chalu.vishesh_pani),
        noticeFeeShillak: s(magil.notice_fee, chalu.notice_fee),
        etarFeeShillak: s(magil.etar_fee, chalu.etar_fee),
      }));

      toast.success('माहिती भरली (Data filled)');
    } catch (err) {
      const message = (err as { message?: string })?.message || 'काहीतरी चूक झाली (Something went wrong)';
      toast.error(message);
    } finally {
      hideLoader();
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const magilTotal = [
      formData.gruhkarMagil,
      formData.vizMagil,
      formData.aarogyaMagil,
      formData.safaeMagil,
      formData.samanyaPaniMagil,
      formData.visheshPaniMagil,
      formData.noticeFeeMagil,
      formData.etarFeeMagil
    ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const chaluTotal = [
      formData.gruhkarChalu,
      formData.vizChalu,
      formData.aarogyaChalu,
      formData.safaeChalu,
      formData.samanyaPaniChalu,
      formData.visheshPaniChalu,
      formData.noticeFeeChalu,
      formData.etarFeeChalu
    ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const jamaTotal = [
      formData.gruhkarJama,
      formData.vizJama,
      formData.aarogyaJama,
      formData.safaeJama,
      formData.samanyaPaniJama,
      formData.visheshPaniJama,
      formData.noticeFeeJama,
      formData.etarFeeJama
    ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const shillakTotal = [
      formData.gruhkarShillak,
      formData.vizShillak,
      formData.aarogyaShillak,
      formData.safaeShillak,
      formData.samanyaPaniShillak,
      formData.visheshPaniShillak,
      formData.noticeFeeShillak,
      formData.etarFeeShillak
    ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    return {
      magilTotal: magilTotal.toFixed(2),
      chaluTotal: chaluTotal.toFixed(2),
      jamaTotal: jamaTotal.toFixed(2),
      shillakTotal: shillakTotal.toFixed(2)
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // A vasuli record must be tied to a property (nodni). It is set during auto-fill.
    if (!formData.nodniId) {
      toast.error('कृपया आधी अनु क्रमांक व प्रभाग टाकून माहिती मिळवा (Fetch property first via Anu Kramank + Ward)');
      return;
    }

    // Numeric tax columns are NOT NULL (default 0) -> send 0 for empty.
    // Date/text columns are nullable -> send null for empty.
    const num = (v: string) => (v === '' || v === undefined || v === null ? 0 : Number(v));
    const txt = (v: string) => (v === '' ? null : v);

    // Map form (camelCase) -> API (snake_case, matches vasuli table columns)
    const payload: Record<string, unknown> = {
      nodni_id: Number(formData.nodniId),
      year: formData.year,
      to_year: formData.toYear,
      anu_kramank: formData.anuKramank,
      malmatta_number: formData.malmattaKramank,
      ward_number: formData.wardKramank,
      plot_number: formData.plotKramank,
      khasara_kramank: formData.khasaraKramank,
      survey_number: formData.surveyKramank,
      khatedharkache_nav: formData.khatedharkacheNav,
      bhogwatdarache_nav: formData.bhogwatdaracheNav,
      patta_address: formData.patta,

      magil_gruhkar_v_bhumikar: num(formData.gruhkarMagil),
      chalu_gruhkar_v_bhumikar: num(formData.gruhkarChalu),
      jama_keleli_rakkam_gruhkar_v_bhumikar: num(formData.gruhkarJama),
      sillak_gruhkar_v_bhumikar: num(formData.gruhkarShillak),

      magil_viz_divabatti_kar: num(formData.vizMagil),
      chalu_viz_divabatti_kar: num(formData.vizChalu),
      jama_keleli_rakkam_viz_divabatti_kar: num(formData.vizJama),
      sillak_viz_divabatti_kar: num(formData.vizShillak),

      magil_aarogya_rakshan_kar: num(formData.aarogyaMagil),
      chalu_aarogya_rakshan_kar: num(formData.aarogyaChalu),
      jama_kelili_rakkam_aarogya_rakshan_kar: num(formData.aarogyaJama),
      sillak_aarogya_rakshan_kar: num(formData.aarogyaShillak),

      magil_safae_kar: num(formData.safaeMagil),
      chalu_safae_kar: num(formData.safaeChalu),
      jama_keleli_rakkam_safae_kar: num(formData.safaeJama),
      sillak_safae_kar: num(formData.safaeShillak),

      gruhkar_v_bhumikar_pavti_date: txt(formData.gruhkarPavtiDate),

      magil_samanya_pani_kar: num(formData.samanyaPaniMagil),
      chalu_samanya_pani_kar: num(formData.samanyaPaniChalu),
      jama_keleli_rakkam_samanya_pani_kar: num(formData.samanyaPaniJama),
      sillak_samanya_pani_kar: num(formData.samanyaPaniShillak),

      magil_vishesh_pani_kar: num(formData.visheshPaniMagil),
      chalu_vishesh_pani_kar: num(formData.visheshPaniChalu),
      jama_keleli_rakkam_vishesh_pani_kar: num(formData.visheshPaniJama),
      sillak_vishesh_pani_kar: num(formData.visheshPaniShillak),

      pani_kar_pavti_v_date: txt(formData.paniPavtiDate),

      magil_notice_fee: num(formData.noticeFeeMagil),
      chalu_notice_fee: num(formData.noticeFeeChalu),
      jama_keleli_rakkam_notice_fee: num(formData.noticeFeeJama),
      sillak_noticie_fee: num(formData.noticeFeeShillak),

      magil_etar_fee: num(formData.etarFeeMagil),
      chalu_etar_fee: num(formData.etarFeeChalu),
      jama_keleli_rakkam_etar_fee: num(formData.etarFeeJama),
      sillak_etar_fee: num(formData.etarFeeShillak),

      magil_ekun: num(totals.magilTotal),
      chalu_ekun: num(totals.chaluTotal),
      jama_keleli_ekun: num(totals.jamaTotal),
      sillak_ekun: num(totals.shillakTotal),
    };

    showLoader('वसुली जतन करत आहे... (Saving vasuli...)');
    try {
      const res = isEdit && existingRecord?.id
        ? await vasuliService.update(Number(existingRecord.id), payload)
        : await vasuliService.create(payload);

      if (res.success) {
        toast.success(
          isEdit
            ? 'वसुली यशस्वीरित्या अद्यतनित केली (Vasuli updated successfully)'
            : 'वसुली यशस्वीरित्या जतन केली (Vasuli saved successfully)'
        );
        setTimeout(() => navigate('/vasuli'), 1500);
      } else {
        toast.error(res.message || 'वसुली जतन करण्यात अयशस्वी (Failed to save vasuli)');
      }
    } catch (err) {
      const message = (err as { message?: string })?.message || 'काहीतरी चूक झाली (Something went wrong)';
      toast.error(message);
    } finally {
      hideLoader();
    }
  };

  const handleReset = () => {
    setFormData({
      nodniId: '',
      year: new Date().getFullYear().toString(),
      toYear: (new Date().getFullYear() + 1).toString(),
      anuKramank: '',
      malmattaKramank: '',
      wardKramank: '',
      plotKramank: '',
      khasaraKramank: '',
      surveyKramank: '',
      khatedharkacheNav: '',
      bhogwatdaracheNav: '',
      patta: '',
      billBookNumber: '',
      pavtiNumber: '',
      gruhkarMagil: '',
      gruhkarChalu: '',
      gruhkarJama: '',
      gruhkarShillak: '',
      vizMagil: '',
      vizChalu: '',
      vizJama: '',
      vizShillak: '',
      aarogyaMagil: '',
      aarogyaChalu: '',
      aarogyaJama: '',
      aarogyaShillak: '',
      safaeMagil: '',
      safaeChalu: '',
      safaeJama: '',
      safaeShillak: '',
      gruhkarPavtiDate: '',
      samanyaPaniMagil: '',
      samanyaPaniChalu: '',
      samanyaPaniJama: '',
      samanyaPaniShillak: '',
      visheshPaniMagil: '',
      visheshPaniChalu: '',
      visheshPaniJama: '',
      visheshPaniShillak: '',
      paniPavtiDate: '',
      noticeFeeMagil: '',
      noticeFeeChalu: '',
      noticeFeeJama: '',
      noticeFeeShillak: '',
      etarFeeMagil: '',
      etarFeeChalu: '',
      etarFeeJama: '',
      etarFeeShillak: '',
      // Payment method
      paymentType: '',
      cashAmount: '',
      chequeNumber: '',
      chequeAmount: '',
      chequeDate: '',
      chequeBankName: '',
      ddNumber: '',
      ddAmount: '',
      ddDate: '',
      ddBankName: '',
      onlineProvider: '',
      onlineAmount: '',
      onlineTransactionId: '',
      paymentImage: null,
      paymentImagePreview: '',
    });
  };

  const handleBack = () => {
    navigate('/vasuli');
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'वसुली संपादित करा (Edit Vasuli)' : 'वसुली जोडा (Add Vasuli)'}
            </h1>
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              परत (Back)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Row - 8 Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  वर्ष
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
                  ते वर्ष
                </label>
                <input
                  type="text"
                  name="toYear"
                  value={formData.toYear}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  मालमत्ता क्रमांक
                </label>
                <input
                  type="text"
                  name="malmattaKramank"
                  value={formData.malmattaKramank}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  प्रभाग क्रमांक
                </label>
                <input
                  type="text"
                  name="wardKramank"
                  value={formData.wardKramank}
                  onChange={handleInputChange}
                  onBlur={handleAutofill}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  प्लॉट क्रमांक
                </label>
                <input
                  type="text"
                  name="plotKramank"
                  value={formData.plotKramank}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Second Row - 3 Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  खातेधारकाचे नाव
                </label>
                <input
                  type="text"
                  name="khatedharkacheNav"
                  value={formData.khatedharkacheNav}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  भोगवटदाराचे नाव
                </label>
                <input
                  type="text"
                  name="bhogwatdaracheNav"
                  value={formData.bhogwatdaracheNav}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  पत्ता
                </label>
                <input
                  type="text"
                  name="patta"
                  value={formData.patta}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  बिल बुक नंबर
                </label>
                <input
                  type="text"
                  name="billBookNumber"
                  value={formData.billBookNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  पावती नंबर
                </label>
                <input
                  type="text"
                  name="pavtiNumber"
                  value={formData.pavtiNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Tax Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600">
                      कर
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600">
                      मागील कर
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600">
                      चालू कर
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600">
                      जमा केलेली रक्कम
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                      शिल्लक रक्कम
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: गृहकर व भूमिकर */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      गृहकर व भूमिकर
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="gruhkarMagil"
                        value={formData.gruhkarMagil}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="gruhkarChalu"
                        value={formData.gruhkarChalu}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="gruhkarJama"
                        value={formData.gruhkarJama}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="gruhkarShillak"
                        value={formData.gruhkarShillak}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Row 2: विज दिवाबत्ती कर */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      विज दिवाबत्ती कर
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="vizMagil"
                        value={formData.vizMagil}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="vizChalu"
                        value={formData.vizChalu}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="vizJama"
                        value={formData.vizJama}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="vizShillak"
                        value={formData.vizShillak}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Row 3: आरोग्य रक्षण कर */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      आरोग्य रक्षण कर
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="aarogyaMagil"
                        value={formData.aarogyaMagil}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="aarogyaChalu"
                        value={formData.aarogyaChalu}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="aarogyaJama"
                        value={formData.aarogyaJama}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="aarogyaShillak"
                        value={formData.aarogyaShillak}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Row 4: सफाई कर */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      सफाई कर
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="safaeMagil"
                        value={formData.safaeMagil}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="safaeChalu"
                        value={formData.safaeChalu}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="safaeJama"
                        value={formData.safaeJama}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="safaeShillak"
                        value={formData.safaeShillak}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Row 5: गृहकर व भूमिकर पावती क्रमांक व दिनांक */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      गृहकर व भूमिकर पावती क्रमांक व दिनांक
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <DatePicker
                        name="gruhkarPavtiDate"
                        value={formData.gruhkarPavtiDate}
                        onChange={handleDateChange('gruhkarPavtiDate')}
                        format="DD/MM/YYYY"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600"></td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600"></td>
                    <td className="px-4 py-3"></td>
                  </tr>

                  {/* Row 6: सामान्य पाणी कर */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      सामान्य पाणी कर
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="samanyaPaniMagil"
                        value={formData.samanyaPaniMagil}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="samanyaPaniChalu"
                        value={formData.samanyaPaniChalu}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="samanyaPaniJama"
                        value={formData.samanyaPaniJama}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="samanyaPaniShillak"
                        value={formData.samanyaPaniShillak}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Row 7: विशेष पाणी कर */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      विशेष पाणी कर
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="visheshPaniMagil"
                        value={formData.visheshPaniMagil}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="visheshPaniChalu"
                        value={formData.visheshPaniChalu}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="visheshPaniJama"
                        value={formData.visheshPaniJama}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="visheshPaniShillak"
                        value={formData.visheshPaniShillak}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Row 8: पाणी कर पावती क्रमांक व दिनांक */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      पाणी कर पावती क्रमांक व दिनांक
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <DatePicker
                        name="paniPavtiDate"
                        value={formData.paniPavtiDate}
                        onChange={handleDateChange('paniPavtiDate')}
                        format="DD/MM/YYYY"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600"></td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600"></td>
                    <td className="px-4 py-3"></td>
                  </tr>

                  {/* Row 9: नोटीस फी */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      नोटीस फी
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="noticeFeeMagil"
                        value={formData.noticeFeeMagil}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="noticeFeeChalu"
                        value={formData.noticeFeeChalu}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="noticeFeeJama"
                        value={formData.noticeFeeJama}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="noticeFeeShillak"
                        value={formData.noticeFeeShillak}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Row 10: इतर फी */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      इतर फी
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="etarFeeMagil"
                        value={formData.etarFeeMagil}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="etarFeeChalu"
                        value={formData.etarFeeChalu}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="etarFeeJama"
                        value={formData.etarFeeJama}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="etarFeeShillak"
                        value={formData.etarFeeShillak}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Row 11: एकूण (Totals) */}
                  <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      एकूण
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      ₹ {totals.magilTotal}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      ₹ {totals.chaluTotal}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      ₹ {totals.jamaTotal}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      ₹ {totals.shillakTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Method Block */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                पेमेंट पद्धत (Payment Method)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    पेमेंट प्रकार (Payment Type)
                  </label>
                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleSelectChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">-- निवडा --</option>
                    <option value="cash">रोख (Cash)</option>
                    <option value="cheque">चेक (Cheque)</option>
                    <option value="dd">डीडी (DD)</option>
                    <option value="online">ऑनलाइन (Online)</option>
                  </select>
                </div>
              </div>

              {/* Cash Fields */}
              {formData.paymentType === 'cash' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      रोख रक्कम (Cash Amount)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="cashAmount"
                      value={formData.cashAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="₹ रक्कम टाका"
                    />
                  </div>
                </div>
              )}

              {/* Cheque Fields */}
              {formData.paymentType === 'cheque' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      चेक क्रमांक (Cheque Number)
                    </label>
                    <input
                      type="text"
                      name="chequeNumber"
                      value={formData.chequeNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="चेक क्रमांक"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      रक्कम (Amount)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="chequeAmount"
                      value={formData.chequeAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="₹ रक्कम टाका"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      चेक दिनांक (Cheque Date)
                    </label>
                    <DatePicker
                      name="chequeDate"
                      value={formData.chequeDate}
                      onChange={handleDateChange('chequeDate')}
                      format="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      बँकेचे नाव (Bank Name)
                    </label>
                    <input
                      type="text"
                      name="chequeBankName"
                      value={formData.chequeBankName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="बँकेचे नाव"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      चेक इमेज (Cheque Image)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentImageChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                    />
                    {formData.paymentImagePreview && (
                      <img src={formData.paymentImagePreview} alt="Cheque" className="mt-2 h-32 rounded-lg border border-gray-300 dark:border-gray-600 object-contain" />
                    )}
                  </div>
                </div>
              )}

              {/* DD Fields */}
              {formData.paymentType === 'dd' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      डीडी क्रमांक (DD Number)
                    </label>
                    <input
                      type="text"
                      name="ddNumber"
                      value={formData.ddNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="डीडी क्रमांक"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      रक्कम (Amount)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="ddAmount"
                      value={formData.ddAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="₹ रक्कम टाका"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      डीडी दिनांक (DD Date)
                    </label>
                    <DatePicker
                      name="ddDate"
                      value={formData.ddDate}
                      onChange={handleDateChange('ddDate')}
                      format="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      बँकेचे नाव (Bank Name)
                    </label>
                    <input
                      type="text"
                      name="ddBankName"
                      value={formData.ddBankName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="बँकेचे नाव"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      डीडी इमेज (DD Image)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentImageChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                    />
                    {formData.paymentImagePreview && (
                      <img src={formData.paymentImagePreview} alt="DD" className="mt-2 h-32 rounded-lg border border-gray-300 dark:border-gray-600 object-contain" />
                    )}
                  </div>
                </div>
              )}

              {/* Online Fields */}
              {formData.paymentType === 'online' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      ऑनलाइन प्रदाता (Provider)
                    </label>
                    <select
                      name="onlineProvider"
                      value={formData.onlineProvider}
                      onChange={handleSelectChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">-- निवडा --</option>
                      <option value="phonepe">PhonePe</option>
                      <option value="paytm">Paytm</option>
                      <option value="gpay">Google Pay</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="other">इतर (Other)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      रक्कम (Amount)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="onlineAmount"
                      value={formData.onlineAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="₹ रक्कम टाका"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      व्यवहार क्रमांक (Transaction ID)
                    </label>
                    <input
                      type="text"
                      name="onlineTransactionId"
                      value={formData.onlineTransactionId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Transaction ID"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      पेमेंट स्क्रीनशॉट (Payment Screenshot)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentImageChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                    />
                    {formData.paymentImagePreview && (
                      <img src={formData.paymentImagePreview} alt="Payment" className="mt-2 h-32 rounded-lg border border-gray-300 dark:border-gray-600 object-contain" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons - Centered */}
            <div className="flex justify-center gap-4">
              <button
                type="submit"
                className="px-8 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
              >
                {isEdit ? 'बदल करा (Update)' : 'जतन करा (Save)'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-8 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
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

export default VasuliForm;

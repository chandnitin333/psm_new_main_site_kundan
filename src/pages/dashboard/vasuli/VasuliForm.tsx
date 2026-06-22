import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import YearPicker from '../../../components/common/YearPicker';
import DatePicker from '../../../components/common/DatePicker';
import type { VasuliFormData } from '../../../interfaces/dashboard/vasuli/VasuliForm.types';
import { vasuliService, type VasuliAutofillResponse, type VasuliTaxHeads } from '../../../services/vasuliService';
import { trackAction } from '../../../utils/tracker';
import { config } from '../../../config';

// Map a saved vasuli DB record -> form fields (when an existing vasuli for the year
// is found, so the form shows that record's values instead of fresh nodni data).
const _s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const _d = (v: unknown) => {
  if (!v) return '';
  const raw = String(v);
  let d = new Date(raw);
  if (isNaN(d.getTime())) { const part = raw.split(/[ T]/)[0]; d = new Date(part); if (isNaN(d.getTime())) return part; }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const vasuliToFormPatch = (r: Record<string, any>) => ({
  nodniId: _s(r.nodni_id), year: _s(r.year), toYear: _s(r.to_year),
  anuKramank: _s(r.anu_kramank), malmattaKramank: _s(r.malmatta_number), wardKramank: _s(r.ward_number),
  plotKramank: _s(r.plot_number), khasaraKramank: _s(r.khasara_kramank), surveyKramank: _s(r.survey_number),
  khatedharkacheNav: _s(r.khatedharkache_nav), bhogwatdaracheNav: _s(r.bhogwatdarache_nav), patta: _s(r.patta_address),
  gruhkarMagil: _s(r.magil_gruhkar_v_bhumikar), gruhkarChalu: _s(r.chalu_gruhkar_v_bhumikar), gruhkarJama: _s(r.jama_keleli_rakkam_gruhkar_v_bhumikar), gruhkarShillak: _s(r.sillak_gruhkar_v_bhumikar),
  vizMagil: _s(r.magil_viz_divabatti_kar), vizChalu: _s(r.chalu_viz_divabatti_kar), vizJama: _s(r.jama_keleli_rakkam_viz_divabatti_kar), vizShillak: _s(r.sillak_viz_divabatti_kar),
  aarogyaMagil: _s(r.magil_aarogya_rakshan_kar), aarogyaChalu: _s(r.chalu_aarogya_rakshan_kar), aarogyaJama: _s(r.jama_kelili_rakkam_aarogya_rakshan_kar), aarogyaShillak: _s(r.sillak_aarogya_rakshan_kar),
  safaeMagil: _s(r.magil_safae_kar), safaeChalu: _s(r.chalu_safae_kar), safaeJama: _s(r.jama_keleli_rakkam_safae_kar), safaeShillak: _s(r.sillak_safae_kar),
  gruhkarPavtiDate: _d(r.gruhkar_v_bhumikar_pavti_date),
  samanyaPaniMagil: _s(r.magil_samanya_pani_kar), samanyaPaniChalu: _s(r.chalu_samanya_pani_kar), samanyaPaniJama: _s(r.jama_keleli_rakkam_samanya_pani_kar), samanyaPaniShillak: _s(r.sillak_samanya_pani_kar),
  visheshPaniMagil: _s(r.magil_vishesh_pani_kar), visheshPaniChalu: _s(r.chalu_vishesh_pani_kar), visheshPaniJama: _s(r.jama_keleli_rakkam_vishesh_pani_kar), visheshPaniShillak: _s(r.sillak_vishesh_pani_kar),
  paniPavtiDate: _d(r.pani_kar_pavti_v_date),
  noticeFeeMagil: _s(r.magil_notice_fee), noticeFeeChalu: _s(r.chalu_notice_fee), noticeFeeJama: _s(r.jama_keleli_rakkam_notice_fee), noticeFeeShillak: _s(r.sillak_noticie_fee),
  etarFeeMagil: _s(r.magil_etar_fee), etarFeeChalu: _s(r.chalu_etar_fee), etarFeeJama: _s(r.jama_keleli_rakkam_etar_fee), etarFeeShillak: _s(r.sillak_etar_fee),
});

const VasuliForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const isEdit = location.state?.isEdit || false;
  const existingRecord = location.state?.record;

  // payments (a vasuli can have many partial payments — add + view only)
  const [savedVasuliId, setSavedVasuliId] = useState<number | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [addingPayment, setAddingPayment] = useState(false);
  const localPayIdRef = useRef(-1);

  // gram panchayat payment details (QR scanners + bank/UPI) — payment only via these
  const [gpPay, setGpPay] = useState<any>(null);
  const [scannerPreview, setScannerPreview] = useState<string | null>(null);
  const gpImg = (p?: string) => (p ? `${config.api.baseUrl.replace(/\/api$/, '')}/${String(p).replace(/^\/+/, '')}` : '');
  useEffect(() => {
    (async () => {
      try { const r = await vasuliService.getGpPaymentInfo(); if (r.success) setGpPay(r.data); } catch { /* ignore */ }
    })();
  }, []);
  const currentVasuliId = existingRecord?.id ? Number(existingRecord.id) : savedVasuliId;

  const loadPayments = async (vid: number) => {
    try {
      const res = await vasuliService.listPayments(vid);
      if (res.success) setPayments((res.data as any[]) || []);
    } catch { /* ignore */ }
  };

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
    gharBillBook: '',
    gharPavti: '',
    paniBillBook: '',
    paniPavti: '',
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
    gharAmount: '',
    paniAmount: '',
    gharImage: null,
    gharImagePreview: '',
    paniImage: null,
    paniImagePreview: '',
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
          // load all payment entries for this vasuli
          if ((r.payments as any[])?.length) setPayments(r.payments as any[]);
          else loadPayments(Number(existingRecord.id));
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
      const magilNum = Math.round(parseFloat(magil) || 0);
      const chaluNum = Math.round(parseFloat(chalu) || 0);
      const jamaNum = Math.round(parseFloat(jama) || 0);
      const balance = (magilNum + chaluNum) - jamaNum;
      return balance >= 0 ? String(balance) : '0';
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
    // if anu + ward already entered, re-fetch nodni data for the newly selected year
    if (formData.anuKramank.trim() && formData.wardKramank.trim() && year) {
      handleAutofill(year);
    }
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

  const clearPaymentBlock = () => setFormData(prev => ({
    ...prev, paymentType: '', cashAmount: '', chequeNumber: '', chequeAmount: '',
    chequeDate: '', chequeBankName: '', ddNumber: '', ddAmount: '', ddDate: '', ddBankName: '',
    onlineProvider: '', onlineAmount: '', onlineTransactionId: '', paymentImage: null, paymentImagePreview: '',
    gharBillBook: '', gharPavti: '', paniBillBook: '', paniPavti: '',
    gharAmount: '', paniAmount: '', gharImage: null, gharImagePreview: '', paniImage: null, paniImagePreview: '',
  }));

  const buildPaymentObj = () => {
    const t = (v: string) => (v === '' ? null : v);
    const isOnline = formData.paymentType === 'online';
    return {
      nodni_id: formData.nodniId ? Number(formData.nodniId) : null,
      payment_type: t(formData.paymentType),               // 'cash' | 'online'
      ghar_amount: formData.gharAmount === '' ? null : Number(formData.gharAmount),
      pani_amount: formData.paniAmount === '' ? null : Number(formData.paniAmount),
      reference_no: isOnline ? t(formData.onlineTransactionId) : null,
      ghar_bill_book_no: t(formData.gharBillBook),
      ghar_pavti_no: t(formData.gharPavti),
      pani_bill_book_no: t(formData.paniBillBook),
      pani_pavti_no: t(formData.paniPavti),
    };
  };

  // proof screenshot handler for गृहकर / पाणी कर
  const handleProofImage = (which: 'ghar' | 'pani') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const fileKey = which === 'ghar' ? 'gharImage' : 'paniImage';
    const prevKey = which === 'ghar' ? 'gharImagePreview' : 'paniImagePreview';
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [fileKey]: file, [prevKey]: reader.result as string }));
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [fileKey]: null, [prevKey]: '' }));
    }
  };

  // Add ONE payment entry. If the vasuli isn't saved yet (first-time/new form),
  // the payment is QUEUED locally and saved automatically when the vasuli is saved.
  const handleAddPayment = async () => {
    if (!formData.paymentType) {
      toast.error('पेमेंट प्रकार निवडा (Select payment type)');
      return;
    }
    if ((formData.gharAmount === '' || Number(formData.gharAmount) <= 0) &&
        (formData.paniAmount === '' || Number(formData.paniAmount) <= 0)) {
      toast.error('गृहकर किंवा पाणी कर रक्कम टाका (Enter ghar or pani amount)');
      return;
    }
    const payment = buildPaymentObj();

    // not saved yet -> queue locally (will be flushed on vasuli save)
    if (!currentVasuliId) {
      setPayments(prev => [...prev, {
        id: localPayIdRef.current--,
        _local: true,
        _gharFile: formData.gharImage || null,
        _paniFile: formData.paniImage || null,
        amount: (Number(formData.gharAmount || 0) + Number(formData.paniAmount || 0)),
        ...payment,
      }]);
      clearPaymentBlock();
      toast.success('पेमेंट जोडले — वसुली जतन केल्यावर साठवले जाईल (Queued; saved on vasuli save)');
      return;
    }

    // vasuli exists -> save immediately
    setAddingPayment(true);
    showLoader('पेमेंट जोडत आहे... (Adding payment...)');
    try {
      const res = await vasuliService.addPayment(currentVasuliId, payment);
      if (res.success) {
        const pid = Number((res.data as any)?.id);
        if (pid) {
          if (formData.gharImage) {
            try { await vasuliService.uploadPaymentImage(pid, formData.gharImage as File, 'ghar'); } catch { /* ignore */ }
          }
          if (formData.paniImage) {
            try { await vasuliService.uploadPaymentImage(pid, formData.paniImage as File, 'pani'); } catch { /* ignore */ }
          }
        }
        await loadPayments(currentVasuliId);
        clearPaymentBlock();
        toast.success('पेमेंट जोडले (Payment added)');
      } else {
        toast.error(res.message || 'पेमेंट जोडता आले नाही (Failed to add payment)');
      }
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'काहीतरी चूक झाली (Something went wrong)');
    } finally {
      hideLoader();
      setAddingPayment(false);
    }
  };

  // flush locally-queued payments after the vasuli gets an id
  const flushLocalPayments = async (vid: number) => {
    const locals = payments.filter((p: any) => p._local);
    for (const lp of locals) {
      try {
        const res = await vasuliService.addPayment(vid, lp);
        const pid = Number((res.data as any)?.id);
        if (pid) {
          if (lp._gharFile) { try { await vasuliService.uploadPaymentImage(pid, lp._gharFile as File, 'ghar'); } catch { /* ignore */ } }
          if (lp._paniFile) { try { await vasuliService.uploadPaymentImage(pid, lp._paniFile as File, 'pani'); } catch { /* ignore */ } }
        }
      } catch { /* ignore individual failure */ }
    }
    await loadPayments(vid);
  };

  // amount actually paid in a payment row (= ghar + pani total)
  const paymentAmount = (p: any): number => Number(p.amount || 0);
  const PAYMENT_TYPE_LABEL: Record<string, string> = {
    cash: 'रोख', online: 'ऑनलाइन', cheque: 'चेक', dd: 'डीडी',
  };

  // Auto-fill property + previous/current tax when anu_kramank + ward are entered
  const handleAutofill = async (yearArg?: string) => {
    const anu = formData.anuKramank.trim();
    const ward = formData.wardKramank.trim();
    const year = ((yearArg ?? formData.year) || '').toString().trim();
    if (!anu || !ward) return;

    showLoader('माहिती मिळवत आहे... (Fetching data...)');
    try {
      // 1) Existing vasuli for this year? -> load it (with its payments)
      const fr = await vasuliService.findByYear(anu, ward, year);
      const fd = fr?.data as any;
      if (fr?.success && fd?.found && fd?.vasuli) {
        const rec = fd.vasuli;
        setFormData(prev => ({ ...prev, ...vasuliToFormPatch(rec) }));
        setSavedVasuliId(Number(rec.id));
        setPayments(rec.payments || []);
        toast.success('या वर्षाची वसुली आधीच आहे — ती लोड केली (Existing vasuli loaded)');
        return;
      }

      // not found -> fresh entry: clear any previously loaded vasuli id + payments
      if (!isEdit) { setSavedVasuliId(null); setPayments([]); }

      // 2) Otherwise fetch fresh from nodni
      const res = await vasuliService.autofill({
        anu_kramank: anu,
        ward_number: ward,
        year,
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
      const s = (m: number, c: number) => String(Math.round(Number(m) || 0) + Math.round(Number(c) || 0));
      const ri = (v: number) => String(Math.round(Number(v) || 0));

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
        gruhkarMagil: ri(magil.gruhkar),
        vizMagil: ri(magil.viz),
        aarogyaMagil: ri(magil.aarogya),
        safaeMagil: ri(magil.safae),
        samanyaPaniMagil: ri(magil.samanya_pani),
        visheshPaniMagil: ri(magil.vishesh_pani),
        noticeFeeMagil: ri(magil.notice_fee),
        etarFeeMagil: ri(magil.etar_fee),
        // chalu (current) column
        gruhkarChalu: ri(chalu.gruhkar),
        vizChalu: ri(chalu.viz),
        aarogyaChalu: ri(chalu.aarogya),
        safaeChalu: ri(chalu.safae),
        samanyaPaniChalu: ri(chalu.samanya_pani),
        visheshPaniChalu: ri(chalu.vishesh_pani),
        noticeFeeChalu: ri(chalu.notice_fee),
        etarFeeChalu: ri(chalu.etar_fee),
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
    ].reduce((sum, val) => sum + Math.round(parseFloat(val) || 0), 0);

    const chaluTotal = [
      formData.gruhkarChalu,
      formData.vizChalu,
      formData.aarogyaChalu,
      formData.safaeChalu,
      formData.samanyaPaniChalu,
      formData.visheshPaniChalu,
      formData.noticeFeeChalu,
      formData.etarFeeChalu
    ].reduce((sum, val) => sum + Math.round(parseFloat(val) || 0), 0);

    const jamaTotal = [
      formData.gruhkarJama,
      formData.vizJama,
      formData.aarogyaJama,
      formData.safaeJama,
      formData.samanyaPaniJama,
      formData.visheshPaniJama,
      formData.noticeFeeJama,
      formData.etarFeeJama
    ].reduce((sum, val) => sum + Math.round(parseFloat(val) || 0), 0);

    const shillakTotal = [
      formData.gruhkarShillak,
      formData.vizShillak,
      formData.aarogyaShillak,
      formData.safaeShillak,
      formData.samanyaPaniShillak,
      formData.visheshPaniShillak,
      formData.noticeFeeShillak,
      formData.etarFeeShillak
    ].reduce((sum, val) => sum + Math.round(parseFloat(val) || 0), 0);

    // गृहकर total = शिल्लक of ALL heads EXCEPT विशेष पाणी कर
    const gruhkarTotal = [
      formData.gruhkarShillak,
      formData.vizShillak,
      formData.aarogyaShillak,
      formData.safaeShillak,
      formData.samanyaPaniShillak,
      formData.noticeFeeShillak,
      formData.etarFeeShillak
    ].reduce((sum, val) => sum + Math.round(parseFloat(val) || 0), 0);
    // पाणी कर total = ONLY विशेष पाणी कर शिल्लक
    const paniTotal = Math.round(parseFloat(formData.visheshPaniShillak) || 0);

    // everything is integer -> rows always add up to the total (no ±1-2)
    return {
      magilTotal: String(magilTotal),
      chaluTotal: String(chaluTotal),
      jamaTotal: String(jamaTotal),
      shillakTotal: String(shillakTotal),
      gruhkarTotal: String(gruhkarTotal),
      paniTotal: String(paniTotal),
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
      // if the vasuli already exists (edit, or created earlier in this session) -> update
      const vid = (isEdit && existingRecord?.id) ? Number(existingRecord.id) : savedVasuliId;
      const res = vid
        ? await vasuliService.update(vid, payload)
        : await vasuliService.create(payload);

      if (res.success) {
        const savedId = vid ?? Number((res.data as any)?.id);

        trackAction(
          isEdit
            ? `वसुली रेकॉर्ड मध्ये डेटा बदलून अद्यतनित (Update) केला — खातेदार: ${(formData as any).khatedharkacheNav || '-'}, अनु क्रमांक: ${formData.anuKramank || '-'}, वॉर्ड क्र.: ${formData.wardKramank || '-'}, वर्ष: ${formData.year || '-'}`
            : `वसुली मध्ये नवीन रेकॉर्ड तयार (Create) केला — खातेदार: ${(formData as any).khatedharkacheNav || '-'}, अनु क्रमांक: ${formData.anuKramank || '-'}, वॉर्ड क्र.: ${formData.wardKramank || '-'}, वर्ष: ${formData.year || '-'}`,
          { page: '/vasuli/vasuli-form', mode: isEdit ? 'update' : 'create', anu_kramank: formData.anuKramank, ward: formData.wardKramank, year: formData.year }
        );
        if (isEdit) {
          toast.success('वसुली यशस्वीरित्या अद्यतनित केली (Vasuli updated successfully)');
          setTimeout(() => navigate('/vasuli'), 1500);
        } else {
          // stay on page; persist any locally-queued payments against the new id
          if (savedId) { setSavedVasuliId(savedId); await flushLocalPayments(savedId); }
          toast.success('वसुली जतन झाली. आता खाली पेमेंट जोडू शकता. (Saved — payments stored; add more below)');
        }
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
      gharBillBook: '',
      gharPavti: '',
      paniBillBook: '',
      paniPavti: '',
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
      gharAmount: '',
      paniAmount: '',
      gharImage: null,
      gharImagePreview: '',
      paniImage: null,
      paniImagePreview: '',
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
                  वॉर्ड क्र.
                </label>
                <input
                  type="text"
                  name="wardKramank"
                  value={formData.wardKramank}
                  onChange={handleInputChange}
                  onBlur={() => handleAutofill()}
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

              {/* गृहकर / पाणी कर totals (शिल्लक) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">गृहकर एकूण (विशेष पाणी सोडून)</span>
                  <span className="text-lg font-bold text-primary-700 dark:text-primary-300">₹{totals.gruhkarTotal}</span>
                </div>
                <div className="rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">पाणी कर एकूण (विशेष पाणी)</span>
                  <span className="text-lg font-bold text-cyan-700 dark:text-cyan-300">₹{totals.paniTotal}</span>
                </div>
              </div>

              {/* Bill book + pavti numbers (गृहकर & पाणी कर) — above the payment method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">गृहकर बिल बुक नं.</label>
                  <input type="text" name="gharBillBook" value={formData.gharBillBook} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">गृहकर पावती नं.</label>
                  <input type="text" name="gharPavti" value={formData.gharPavti} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">पाणी कर बिल बुक नं.</label>
                  <input type="text" name="paniBillBook" value={formData.paniBillBook} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">पाणी कर पावती नं.</label>
                  <input type="text" name="paniPavti" value={formData.paniPavti} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    पेमेंट पद्धत (Payment Method)
                  </label>
                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleSelectChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">-- निवडा --</option>
                    <option value="cash">रोख (Cash)</option>
                    <option value="online">ऑनलाइन (Online)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    गृहकर रक्कम (₹)
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    name="gharAmount"
                    value={formData.gharAmount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="गृहकर रक्कम"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    पाणी कर रक्कम (₹)
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    name="paniAmount"
                    value={formData.paniAmount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="पाणी कर रक्कम"
                  />
                </div>
                {formData.paymentType === 'online' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      संदर्भ क्र. / UTR (Reference)
                    </label>
                    <input
                      type="text" name="onlineTransactionId" value={formData.onlineTransactionId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="UTR / Txn / UPI Ref"
                    />
                  </div>
                )}
              </div>

              {/* Online: provider-specific GP details + screenshot */}
              {formData.paymentType === 'online' && (
                <div className="space-y-4">
                  {/* Pay guide — separate घरकर / पाणी कर boxes (₹2000 पर्यंत scanner, नंतर bank/UPI) — bill-pay design */}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">QR स्कॅन करून किंवा बँक/UPI ने भरणा करा</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {([
                        { key: 'ghar', label: 'घरकर / गृहकर', amt: Number(totals.gruhkarTotal) },
                        { key: 'pani', label: 'पाणी कर (विशेष)', amt: Number(totals.paniTotal) },
                      ] as const).map(({ key, label, amt }) => {
                        const g = gpPay?.[key] || {};
                        const useBank = amt > 2000;
                        return (
                          <div key={key} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center bg-gray-50 dark:bg-gray-800/40">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{label}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              भरावयाची रक्कम: <b className="text-emerald-600 dark:text-emerald-400">₹{amt.toFixed(2)}</b>
                            </p>
                            {!useBank ? (
                              g.scanner ? (
                                <>
                                  <img
                                    src={gpImg(g.scanner)} alt={label}
                                    onClick={() => setScannerPreview(gpImg(g.scanner))}
                                    className="w-44 h-44 object-contain mx-auto border border-gray-300 dark:border-gray-600 rounded bg-white cursor-zoom-in hover:ring-2 hover:ring-primary-400 transition"
                                  />
                                  <p className="text-[11px] text-gray-500 mt-1">🔍 स्कॅन करण्यासाठी टॅप करा{g.upi ? ` • UPI: ${g.upi}` : ''}</p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 py-6">स्कॅनर उपलब्ध नाही.</p>
                              )
                            ) : (
                              (g.bank_name || g.account_no || g.upi) ? (
                                <div className="text-left text-sm text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 rounded p-3 mt-1 bg-white dark:bg-gray-800">
                                  <p className="text-[12px] text-amber-600 dark:text-amber-400 mb-2">₹2000 पेक्षा जास्त — बँक खात्यात / UPI ने भरा</p>
                                  {g.bank_name && <p className="flex justify-between gap-2"><span className="text-gray-500">बँक</span><b>{g.bank_name}</b></p>}
                                  {g.holder && <p className="flex justify-between gap-2"><span className="text-gray-500">खातेधारक</span><b>{g.holder}</b></p>}
                                  {g.account_no && <p className="flex justify-between gap-2"><span className="text-gray-500">खाते क्र.</span><b>{g.account_no}</b></p>}
                                  {g.ifsc && <p className="flex justify-between gap-2"><span className="text-gray-500">IFSC</span><b>{g.ifsc}</b></p>}
                                  {g.upi && <p className="flex justify-between gap-2"><span className="text-gray-500">UPI</span><b>{g.upi}</b></p>}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 py-6">बँक तपशील उपलब्ध नाहीत.</p>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2 proof screenshots — गृहकर + पाणी कर */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">गृहकर स्क्रीनशॉट / पावती</label>
                      <input
                        type="file" accept="image/*" onChange={handleProofImage('ghar')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                      />
                      {formData.gharImagePreview && <img src={formData.gharImagePreview} alt="गृहकर proof" className="mt-2 h-32 rounded-lg border border-gray-300 dark:border-gray-600 object-contain" />}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">पाणी कर स्क्रीनशॉट / पावती</label>
                      <input
                        type="file" accept="image/*" onChange={handleProofImage('pani')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                      />
                      {formData.paniImagePreview && <img src={formData.paniImagePreview} alt="पाणी कर proof" className="mt-2 h-32 rounded-lg border border-gray-300 dark:border-gray-600 object-contain" />}
                    </div>
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

              {/* Online Fields (legacy — replaced by scanner/bank/upi above) */}
              {false && (
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

              {/* Add this payment entry (multiple partial payments allowed) */}
              <div className="mt-4 flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={addingPayment}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  ➕ पेमेंट जोडा (Add Payment)
                </button>
                {!currentVasuliId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    जोडलेली पेमेंट्स खाली यादीत दिसतील व वसुली जतन करताच साठवली जातील. (Added payments show below and are stored when you save the vasuli.)
                  </p>
                )}
              </div>
            </div>

            {/* Payments list (view only) — all partial payments against this vasuli */}
            {(currentVasuliId || payments.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
                  <span>केलेली पेमेंट्स (Payments)</span>
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
                    एकूण भरणा: <strong className="text-emerald-600 dark:text-emerald-400">₹{payments.reduce((s, p) => s + paymentAmount(p), 0).toFixed(2)}</strong>
                  </span>
                </h3>
                {payments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-3">अद्याप कोणतेही पेमेंट नाही.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-100 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">प्रकार</th>
                          <th className="px-3 py-2 text-right">रक्कम (₹)</th>
                          <th className="px-3 py-2 text-left">तपशील</th>
                          <th className="px-3 py-2 text-left">बिल/पावती</th>
                          <th className="px-3 py-2 text-left">दिनांक</th>
                          <th className="px-3 py-2 text-left">इमेज</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, i) => {
                          const ref = p.reference_no || '-';
                          const typeLabel = PAYMENT_TYPE_LABEL[p.payment_type] || p.payment_type || '-';
                          const karLabel = ({ gruhkar: 'गृहकर', pani: 'पाणी कर', both: 'दोन्ही' } as Record<string, string>)[p.kar_prakar] || '';
                          const ghAmt = Number(p.ghar_amount || 0);
                          const paAmt = Number(p.pani_amount || 0);
                          const date = p.created_at || '';
                          const base = `${config.api.baseUrl.replace(/\/api$/, '')}/`;
                          const gharImg = p.ghar_image ? base + p.ghar_image : '';
                          const paniImg = p.pani_image ? base + p.pani_image : '';
                          return (
                            <tr key={p.id} className="border-t border-gray-200 dark:border-gray-700">
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{i + 1}</td>
                              <td className="px-3 py-2 text-gray-900 dark:text-white">
                                {typeLabel}
                                {karLabel && <div className="text-[10px] text-gray-500">{karLabel}</div>}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                                {paymentAmount(p).toFixed(2)}
                                {(ghAmt > 0 || paAmt > 0) && (
                                  <div className="text-[10px] font-normal text-gray-500">गृह {ghAmt.toFixed(0)} / पाणी {paAmt.toFixed(0)}</div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{ref}</td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-[11px] whitespace-nowrap">
                                {(p.ghar_bill_book_no || p.ghar_pavti_no) && <div>गृह: {p.ghar_bill_book_no || '-'} / {p.ghar_pavti_no || '-'}</div>}
                                {(p.pani_bill_book_no || p.pani_pavti_no) && <div>पाणी: {p.pani_bill_book_no || '-'} / {p.pani_pavti_no || '-'}</div>}
                                {!(p.ghar_bill_book_no || p.ghar_pavti_no || p.pani_bill_book_no || p.pani_pavti_no) && '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{date ? String(date).slice(0, 10) : '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {gharImg && <a href={gharImg} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">गृह</a>}
                                {gharImg && paniImg && ' / '}
                                {paniImg && <a href={paniImg} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">पाणी</a>}
                                {!gharImg && !paniImg && ((p._local && (p._gharFile || p._paniFile)) ? <span className="text-gray-500 dark:text-gray-400">निवडली</span> : '-')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Buttons - Centered */}
            <div className="flex justify-center gap-4">
              <button
                type="submit"
                className="px-8 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
              >
                {(isEdit || currentVasuliId) ? 'बदल करा (Update)' : 'जतन करा (Save)'}
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

      {/* Scanner enlarged preview (tap QR to scan) */}
      {scannerPreview && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setScannerPreview(null)}
        >
          <div className="relative bg-white rounded-xl p-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setScannerPreview(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 text-white text-lg leading-none shadow-lg"
              aria-label="बंद करा"
            >
              ✕
            </button>
            <img src={scannerPreview} alt="QR scanner" className="w-[80vw] max-w-sm h-auto object-contain" />
            <p className="text-center text-sm text-gray-600 mt-2">QR स्कॅन करा</p>
          </div>
        </div>
      )}
    </>
  );
};

export default VasuliForm;

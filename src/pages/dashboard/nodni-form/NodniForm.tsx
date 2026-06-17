import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { config } from '../../../config';
import KhulaBhukhandModal from './KhulaBhukhandModal';
import BandkamModal from './BandkamModal';
import ManoryachModal from './ManoryachModal';
import KhulaBhukhandTable from './KhulaBhukhandTable';
import BandkamTable from './BandkamTable';
import ManoryachTable from './ManoryachTable';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { trackAction } from '../../../utils/tracker';
import type { NodniFormData } from '../../../interfaces/dashboard/nodni-form/NodniForm.types';
import { authService, nodniService } from '../../../services';

interface TaxItem {
  tax_id: number;
  tax_name: string;
  rate: string;
  selected: boolean;
}

const NodniForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [editingId, setEditingId] = useState<number | null>(null);
  const editApiDataRef = useRef<Record<string, any> | null>(null);

  // Optional image (uploaded AFTER the nodni is saved, using its id)
  const [nodniImageFile, setNodniImageFile] = useState<File | null>(null);
  const [nodniImagePreview, setNodniImagePreview] = useState<string | null>(null);
  const [existingNodniImageUrl, setExistingNodniImageUrl] = useState<string | null>(null);
  const nodniImageInputRef = useRef<HTMLInputElement>(null);
  const [isKhulaBhukhandModalOpen, setIsKhulaBhukhandModalOpen] = useState(false);
  const [isBandkamModalOpen, setIsBandkamModalOpen] = useState(false);
  const [isManoryachModalOpen, setIsManoryachModalOpen] = useState(false);

  const [khulaBhukhandRecords, setKhulaBhukhandRecords] = useState<any[]>([]);
  const [bandkamRecords, setBandkamRecords] = useState<any[]>([]);
  const [manoryachRecords, setManoryachRecords] = useState<any[]>([]);

  const [editingKhulaBhukhandIndex, setEditingKhulaBhukhandIndex] = useState<number | null>(null);
  const [editingBandkamIndex, setEditingBandkamIndex] = useState<number | null>(null);
  const [editingManoryachIndex, setEditingManoryachIndex] = useState<number | null>(null);

  // Other Tax Calculation State - dynamic from API
  const [otherTaxes, setOtherTaxes] = useState<TaxItem[]>([]);
  const [taxLoading, setTaxLoading] = useState(false);
  // Snapshot of otherTaxes taken just before "शासकीय इमारत = होय" zeroes them,
  // so selecting नाही can restore their original selection + rates.
  const otherTaxesBackupRef = useRef<TaxItem[] | null>(null);

  // Property Tax Calculation State
  const [propertyTax, setPropertyTax] = useState({
    urvaritKhaliJaga: '',
    jaminicheBhandavliMulya: '',
    imaraticheBhandavliMulya: '',
    ekunBhandavliMulya: '',
    khulaBhukhandAakarani: '',
    imaraticheKarAakarani: '',
    gruhkarVBhumikar: '',
  });

  // Tax Payable State
  const [taxPayable, setTaxPayable] = useState({
    gruhkarVBhumikarPayable: '',
    chaluKar: '',
    magilBaki: '',
    ekunKarBharna: '',
    magahunGhatBadal: '',
  });

  const [formData, setFormData] = useState<NodniFormData>({
    anuKramank: '',
    malmattaNo: '',
    wardNo: '',
    plotNo: '',
    khasaraNo: '',
    surveyNo: '',
    votarCardNo: '',
    mobileNo: '',
    aadharCardNo: '',
    gharMalkacheNav: '',
    patniMulacheNav: '',
    bhogwatdharNav: '',
    pattaNagarLayout: '',
    kaymchaPatta: '',
    purvesh: '',
    paschimes: '',
    uttares: '',
    dakshines: '',
    panyachiVyavasta: '',
    souchalay: '',
    vanijyaPrakar: '',
    milkatPrakar: '',
    imaratMokli: '',
    dharmikEducation: '',
    shauryaPadak: '',
    shaskiyaImarat: '',
    lambi: '',
    rundi: '',
    shetrafalChorasFoot: '',
    shetrafalChorasMeter: '',
  });

  // Ref for अनु क्रमांक input field
  const anuKramankInputRef = useRef<HTMLInputElement>(null);
  // Ref for वॉर्ड क्र. input (now the first field — focused on load)
  const wardInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on वॉर्ड क्र. field when component loads with loader
  // (ward is entered first; अनु क्रमांक then auto-fills ward-wise)
  useEffect(() => {
    document.title = 'Nodni Form - नोंदणी फॉर्म';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
      if (wardInputRef.current) {
        wardInputRef.current.focus();
      }
    };
    loadPage();
  }, []);

  // Ward-wise अनु क्रमांक auto-increment: when the user finishes entering the
  // ward, fetch the ward's last anu_kramank and bind (last + 1). New records only.
  const handleWardBlur = async () => {
    if (editingId) return;                 // don't touch an existing record's number
    const ward = (formData.wardNo || '').trim();
    if (!ward) {
      // Ward cleared -> clear the auto-filled अनु क्रमांक too
      setFormData(prev => ({ ...prev, anuKramank: '' }));
      return;
    }
    try {
      const res = await nodniService.getNextAnuKramank(ward) as {
        success: boolean; data?: { next_anu_kramank: number; last_anu_kramank: number };
      };
      if (res.success && res.data) {
        setFormData(prev => ({ ...prev, anuKramank: String(res.data!.next_anu_kramank) }));
      }
    } catch {
      /* ignore — leave anu kramank as-is on failure */
    }
  };

  // Populate form when edit data is passed via navigation state
  useEffect(() => {
    const editData = (location.state as any)?.editData;
    if (editData?.id) {
      setEditingId(editData.id);
      editApiDataRef.current = editData;
      populateFormFromEditData(editData);
      // show the currently-saved image (if any) for this nodni
      (async () => {
        try {
          const res = await nodniService.getImagesByNodni(editData.id);
          const imgs = (res?.data as any[]) || [];
          if (imgs.length > 0) {
            const base = config.api.baseUrl.replace(/\/api$/, '');
            setExistingNodniImageUrl(`${base}/${imgs[0].image_path}`);
          }
        } catch { /* ignore */ }
      })();
    }
  }, [location.state]);

  const taxFetchedRef = useRef(false);

  // Fetch dynamic tax list from API
  useEffect(() => {
    if (taxFetchedRef.current) return;
    taxFetchedRef.current = true;

    const fetchTaxList = async () => {
      const currentUser = authService.getCurrentUser();
      if (
        !currentUser?.district_id ||
        !currentUser?.taluka_id ||
        !currentUser?.gram_panchayat_id ||
        !currentUser?.gat_gram_panchayat_id
      ) return;

      setTaxLoading(true);
      try {
        const response = await nodniService.getTaxList({
          district_id: currentUser.district_id as number,
          taluka_id: currentUser.taluka_id as number,
          gram_panchayat_id: currentUser.gram_panchayat_id as number,
          gat_gram_panchayat_id: currentUser.gat_gram_panchayat_id as number,
        }) as { success: boolean; data?: Array<{ tax_id: number; tax_name: string; rate: number }> };
        if (response.success && response.data) {
          const savedTaxes: Array<{ tax_id: number; tax_rate: number }> =
            editApiDataRef.current?.other_tax_calculation ?? [];

          setOtherTaxes(
            response.data.map(item => {
              const match = savedTaxes.find(s => s.tax_id === item.tax_id);
              return {
                tax_id: item.tax_id,
                tax_name: item.tax_name,
                rate: match ? String(match.tax_rate) : (item.rate?.toString() || ''),
                selected: !!match,
              };
            })
          );
        }
      } catch {
        // keep list empty on error
      } finally {
        setTaxLoading(false);
      }
    };
    fetchTaxList();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    // Auto-calculate ekun jagechi shetrafal
    if (name === 'lambi' || name === 'rundi') {
      const lambi = parseFloat(name === 'lambi' ? value : formData.lambi) || 0;
      const rundi = parseFloat(name === 'rundi' ? value : formData.rundi) || 0;
      const chorasFoot = lambi * rundi;
      updated.shetrafalChorasFoot = chorasFoot ? chorasFoot.toFixed(2) : '';
      updated.shetrafalChorasMeter = chorasFoot ? (chorasFoot * 0.092903).toFixed(2) : '';
    }

    // Auto-calculate choras meter when choras foot is manually changed
    if (name === 'shetrafalChorasFoot') {
      const chorasFoot = parseFloat(value) || 0;
      updated.shetrafalChorasMeter = chorasFoot ? (chorasFoot * 0.092903).toFixed(2) : '';
    }

    // शासकीय / सामाजिक-धार्मिक इमारत / सेवा निवृत्त अधिकारी:
    //   होय -> सर्व कर निवडून दर ० करा (आधीची स्थिती जतन करून ठेवा)
    //   नाही -> जतन केलेली आधीची स्थिती (निवड + दर) परत आणा
    if (name === 'shaskiyaImarat') {
      if (value === 'होय') {
        // backup the current state (synchronously) once, then zero everything out
        if (!otherTaxesBackupRef.current) {
          otherTaxesBackupRef.current = otherTaxes.map(t => ({ ...t }));
        }
        setOtherTaxes(prev => prev.map(t => ({ ...t, selected: true, rate: '0' })));
      } else {
        // नाही -> restore the saved snapshot (capture ref synchronously first!)
        const backup = otherTaxesBackupRef.current;
        otherTaxesBackupRef.current = null;
        if (backup) {
          setOtherTaxes(backup.map(t => ({ ...t })));
        }
      }
    }

    // पाण्याची व्यवस्था -> auto-(de)select water tax checkboxes in इतर कर गणना:
    //   हातपंप / विहीर / सार्वजनिक नळ -> सामान्य पाणी कर ✓ , विशेष पाणी कर ✗
    //   घरी नळ                        -> विशेष पाणी कर ✓ , सामान्य पाणी कर ✗
    //   नाही                          -> both ✗
    if (name === 'panyachiVyavasta') {
      const wantSamanya = ['हातपंप', 'विहीर', 'सार्वजनिक नळ'].includes(value);
      const wantVishesh = value === 'घरी नळ';
      setOtherTaxes(prev => prev.map(t => {
        if (t.tax_name.includes('सामान्य पाणी')) return { ...t, selected: wantSamanya };
        if (t.tax_name.includes('विशेष पाणी')) return { ...t, selected: wantVishesh };
        return t;
      }));
    }

    setFormData(updated);
  };

  // Handle Other Tax checkbox change
  const handleOtherTaxCheckbox = (index: number) => {
    setOtherTaxes(prev => prev.map((t, i) => i === index ? { ...t, selected: !t.selected } : t));
  };

  // Handle Other Tax rate change
  const handleOtherTaxRate = (index: number, value: string) => {
    setOtherTaxes(prev => prev.map((t, i) => i === index ? { ...t, rate: value } : t));
  };

  // Calculate total for Other Taxes
  const calculateOtherTaxTotal = () => {
    return otherTaxes
      .filter(tax => tax.selected)
      .reduce((sum, tax) => sum + (parseFloat(tax.rate) || 0), 0)
      .toFixed(2);
  };

  // Handle Property Tax input change
  const handlePropertyTaxChange = (field: string, value: string) => {
    const updatedPropertyTax = { ...propertyTax, [field]: value };

    // Auto-calculate Ekun Bhandavli Mulya
    if (field === 'jaminicheBhandavliMulya' || field === 'imaraticheBhandavliMulya') {
      const jaminiMulya = parseFloat(field === 'jaminicheBhandavliMulya' ? value : propertyTax.jaminicheBhandavliMulya) || 0;
      const imaratMulya = parseFloat(field === 'imaraticheBhandavliMulya' ? value : propertyTax.imaraticheBhandavliMulya) || 0;
      updatedPropertyTax.ekunBhandavliMulya = (jaminiMulya + imaratMulya).toString();
    }

    // Auto-calculate Gruhkar V Bhumikar
    if (field === 'khulaBhukhandAakarani' || field === 'imaraticheKarAakarani') {
      const khulaBhukhand = parseFloat(field === 'khulaBhukhandAakarani' ? value : propertyTax.khulaBhukhandAakarani) || 0;
      const imaratKar = parseFloat(field === 'imaraticheKarAakarani' ? value : propertyTax.imaraticheKarAakarani) || 0;
      updatedPropertyTax.gruhkarVBhumikar = (khulaBhukhand + imaratKar).toString();
    }

    setPropertyTax(updatedPropertyTax);
  };

  // Handle Tax Payable input change
  const handleTaxPayableChange = (field: string, value: string) => {
    const updatedTaxPayable = { ...taxPayable, [field]: value };

    // Auto-calculate Ekun Kar Bharna
    if (field === 'chaluKar' || field === 'magilBaki') {
      const chaluKar = parseFloat(field === 'chaluKar' ? value : taxPayable.chaluKar) || 0;
      const magilBaki = parseFloat(field === 'magilBaki' ? value : taxPayable.magilBaki) || 0;
      updatedTaxPayable.ekunKarBharna = (chaluKar + magilBaki).toString();
    }

    setTaxPayable(updatedTaxPayable);
  };

  // Auto-fill Property Tax & Tax Payable when khulaBhukhandRecords change
  useEffect(() => {
    if (khulaBhukhandRecords.length === 0) return;

    // Sum values from all khula bhukhand records
    const totalSqFeet = khulaBhukhandRecords.reduce(
      (sum, r) => sum + (Number(r.ekunShetrafalChorasFoot) || 0), 0
    );
    const totalCapitalValue = khulaBhukhandRecords.reduce(
      (sum, r) => sum + (r.ekunShetrafalChorasFoot && r.jaminicheVarshikMulya
        ? Number(r.ekunShetrafalChorasFoot) * 0.092903 * Number(r.jaminicheVarshikMulya)
        : 0), 0
    );
    const totalTaxAssessment = khulaBhukhandRecords.reduce(
      (sum, r) => sum + (r.ekunShetrafalChorasFoot && r.jaminicheVarshikMulya && r.aakraniDar
        ? (Number(r.ekunShetrafalChorasFoot) * 0.092903 * Number(r.jaminicheVarshikMulya) * Number(r.aakraniDar)) / 1000
        : 0), 0
    );

    setPropertyTax(prev => {
      const ekunBhandavliMulya = totalCapitalValue + (parseFloat(prev.imaraticheBhandavliMulya) || 0);
      const gruhkarVBhumikar = totalTaxAssessment + (parseFloat(prev.imaraticheKarAakarani) || 0);

      // Also update Tax Payable
      setTaxPayable(prevTax => {
        const totalOtherTax = otherTaxes
          .filter(t => t.selected)
          .reduce((sum, t) => sum + (parseFloat(t.rate) || 0), 0);
        const chaluKar = gruhkarVBhumikar + totalOtherTax;
        return {
          ...prevTax,
          gruhkarVBhumikarPayable: gruhkarVBhumikar.toFixed(2),
          chaluKar: chaluKar.toFixed(2),
          ekunKarBharna: chaluKar.toFixed(2),
        };
      });

      return {
        ...prev,
        urvaritKhaliJaga: totalSqFeet.toFixed(2),
        jaminicheBhandavliMulya: totalCapitalValue.toFixed(2),
        khulaBhukhandAakarani: totalTaxAssessment.toFixed(2),
        ekunBhandavliMulya: ekunBhandavliMulya.toFixed(2),
        gruhkarVBhumikar: gruhkarVBhumikar.toFixed(2),
      };
    });
  }, [khulaBhukhandRecords]);

  // Auto-fill Property Tax & Tax Payable when bandkamRecords or manoryachRecords change
  useEffect(() => {
    if (bandkamRecords.length === 0 && manoryachRecords.length === 0) return;

    // Sum Building Capital Value from all bandkam records
    const totalBuildingCapitalValue = bandkamRecords.reduce(
      (sum, r) => sum + (r.ekunShetrafalChorasFoot && r.imaraticheVarshikMulya && r.bharank
        ? Number(r.ekunShetrafalChorasFoot) * 0.092903 * Number(r.imaraticheVarshikMulya) * Number(r.bharank)
        : 0), 0
    );
    // Sum Tax Assessment from all bandkam records
    const totalBuildingTaxAssessment = bandkamRecords.reduce(
      (sum, r) => sum + (r.ekunShetrafalChorasFoot && r.imaraticheVarshikMulya && r.bharank && r.aakraniDar
        ? (Number(r.ekunShetrafalChorasFoot) * 0.092903 * Number(r.imaraticheVarshikMulya) * Number(r.bharank) * Number(r.aakraniDar)) / 1000
        : 0), 0
    );
    // Sum Tax Assessment from all manoryach records
    const totalManoryachTaxAssessment = manoryachRecords.reduce(
      (sum, r) => sum + (r.ekunShetrafalChorasFoot && r.aakraniDar
        ? Number(r.ekunShetrafalChorasFoot) * Number(r.aakraniDar) * (Number(r.majla) || 1)
        : 0), 0
    );

    const totalKarAakarani = totalBuildingTaxAssessment + totalManoryachTaxAssessment;

    setPropertyTax(prev => {
      const ekunBhandavliMulya = (parseFloat(prev.jaminicheBhandavliMulya) || 0) + totalBuildingCapitalValue;
      const gruhkarVBhumikar = (parseFloat(prev.khulaBhukhandAakarani) || 0) + totalKarAakarani;

      // Also update Tax Payable
      setTaxPayable(prevTax => {
        const totalOtherTax = otherTaxes
          .filter(t => t.selected)
          .reduce((sum, t) => sum + (parseFloat(t.rate) || 0), 0);
        const chaluKar = gruhkarVBhumikar + totalOtherTax;
        return {
          ...prevTax,
          gruhkarVBhumikarPayable: gruhkarVBhumikar.toFixed(2),
          chaluKar: chaluKar.toFixed(2),
          ekunKarBharna: chaluKar.toFixed(2),
        };
      });

      return {
        ...prev,
        imaraticheBhandavliMulya: totalBuildingCapitalValue.toFixed(2),
        imaraticheKarAakarani: totalKarAakarani.toFixed(2),
        ekunBhandavliMulya: ekunBhandavliMulya.toFixed(2),
        gruhkarVBhumikar: gruhkarVBhumikar.toFixed(2),
      };
    });
  }, [bandkamRecords, manoryachRecords]);

  // Auto-update Tax Payable when Other Taxes checkbox selection changes
  useEffect(() => {
    const totalOtherTax = otherTaxes
      .filter(tax => tax.selected)
      .reduce((sum, tax) => sum + (parseFloat(tax.rate) || 0), 0);

    setTaxPayable(prev => {
      const gruhkar = parseFloat(prev.gruhkarVBhumikarPayable) || 0;
      const chaluKar = gruhkar + totalOtherTax;
      return {
        ...prev,
        chaluKar: chaluKar.toFixed(2),
        ekunKarBharna: chaluKar.toFixed(2),
      };
    });
  }, [otherTaxes]);

  const handleKhulaBhukhandSave = (data: any) => {
    if (editingKhulaBhukhandIndex !== null) {
      // Edit existing record
      const updatedRecords = [...khulaBhukhandRecords];
      updatedRecords[editingKhulaBhukhandIndex] = data;
      setKhulaBhukhandRecords(updatedRecords);
      setEditingKhulaBhukhandIndex(null);
      toast.success('खुला भूखंड रेकॉर्ड यशस्वीरित्या अद्यतनित केले (Khula Bhukhand record updated successfully)');
    } else {
      // Add new record
      setKhulaBhukhandRecords([...khulaBhukhandRecords, data]);
      toast.success('खुला भूखंड रेकॉर्ड यशस्वीरित्या जतन केले (Khula Bhukhand record saved successfully)');
    }
  };

  const handleBandkamSave = (data: any) => {
    if (editingBandkamIndex !== null) {
      // Edit existing record
      const updatedRecords = [...bandkamRecords];
      updatedRecords[editingBandkamIndex] = data;
      setBandkamRecords(updatedRecords);
      setEditingBandkamIndex(null);
      toast.success('बांदकाम रेकॉर्ड यशस्वीरित्या अद्यतनित केले (Bandkam record updated successfully)');
    } else {
      // Add new record
      setBandkamRecords([...bandkamRecords, data]);
      toast.success('बांदकाम रेकॉर्ड यशस्वीरित्या जतन केले (Bandkam record saved successfully)');
    }
  };

  const handleManoryachSave = (data: any) => {
    if (editingManoryachIndex !== null) {
      // Edit existing record
      const updatedRecords = [...manoryachRecords];
      updatedRecords[editingManoryachIndex] = data;
      setManoryachRecords(updatedRecords);
      setEditingManoryachIndex(null);
      toast.success('मनोऱ्याचे रेकॉर्ड यशस्वीरित्या अद्यतनित केले (Manoryach record updated successfully)');
    } else {
      // Add new record
      setManoryachRecords([...manoryachRecords, data]);
      toast.success('मनोऱ्याचे रेकॉर्ड यशस्वीरित्या जतन केले (Manoryach record saved successfully)');
    }
  };

  const handleEditKhulaBhukhand = (index: number) => {
    setEditingKhulaBhukhandIndex(index);
    setIsKhulaBhukhandModalOpen(true);
  };

  const handleDeleteKhulaBhukhand = (index: number) => {
    const updatedRecords = khulaBhukhandRecords.filter((_, i) => i !== index);
    setKhulaBhukhandRecords(updatedRecords);
  };

  const handleEditBandkam = (index: number) => {
    setEditingBandkamIndex(index);
    setIsBandkamModalOpen(true);
  };

  const handleDeleteBandkam = (index: number) => {
    const updatedRecords = bandkamRecords.filter((_, i) => i !== index);
    setBandkamRecords(updatedRecords);
  };

  const handleEditManoryach = (index: number) => {
    setEditingManoryachIndex(index);
    setIsManoryachModalOpen(true);
  };

  const handleDeleteManoryach = (index: number) => {
    const updatedRecords = manoryachRecords.filter((_, i) => i !== index);
    setManoryachRecords(updatedRecords);
  };

  // Build the API payload from all form states
  const buildApiPayload = () => {
    // Selected taxes only
    const selectedTaxes = otherTaxes
      .filter(t => t.selected)
      .map(t => ({ tax_id: t.tax_id, tax_rate: parseFloat(t.rate) || 0 }));

    return {
      // Basic info
      anu_kramank: formData.anuKramank,
      malmatta_number: formData.malmattaNo,
      ward_kramnak: formData.wardNo,
      plot_number: formData.plotNo,
      khasara_number: formData.khasaraNo,
      survey_number: formData.surveyNo,
      matdar_card_number: formData.votarCardNo,
      mobile_number: formData.mobileNo,
      aadahar_card_number: formData.aadharCardNo,
      ghar_malkache_nav: formData.gharMalkacheNav,
      patni_mulache_nav: formData.patniMulacheNav,
      bhogavat_darache_nav: formData.bhogwatdharNav,
      patta_nagar_layout_society: formData.pattaNagarLayout,
      kayamcha_patta: formData.kaymchaPatta,
      // Boundaries
      purv: formData.purvesh,
      paschim: formData.paschimes,
      uttar: formData.uttares,
      dakshin: formData.dakshines,
      // Facilities
      pinyacha_panyachi_vyavastha: formData.panyachiVyavasta,
      ghari_souychalaya: formData.souchalay,
      vanijya_prakar: formData.vanijyaPrakar,
      milkat_prakar: formData.milkatPrakar,
      imarat_kiva_mokdi_jaga: formData.imaratMokli,
      imarat_jamin_keval_dharmik_shekshink: formData.dharmikEducation,
      bhogvatdar_sarkarsasan_dalatil: formData.shauryaPadak,
      shaskiy_samajik_sevanivrut_imarat: formData.shaskiyaImarat,
      // Area
      lambi: formData.lambi,
      rundi: formData.rundi,
      shetrafal_choras_foot: formData.shetrafalChorasFoot,
      shetrafal_choras_meter: formData.shetrafalChorasMeter,
      // Property Tax
      urvarit_khali_jaga_choras_foot: propertyTax.urvaritKhaliJaga,
      jaminiche_bhandvali_mulya: propertyTax.jaminicheBhandavliMulya,
      imaratiche_bhandvali_mulya: propertyTax.imaraticheBhandavliMulya,
      ekun_bhandvali_mulya: propertyTax.ekunBhandavliMulya,
      khula_bhukhand_aakarani: propertyTax.khulaBhukhandAakarani,
      imaratiche_kar_aakarani: propertyTax.imaraticheKarAakarani,
      gruhkar_v_bhumikar: propertyTax.gruhkarVBhumikar,
      // Tax Payable
      kar_gruhkar_v_bhumikar: taxPayable.gruhkarVBhumikarPayable,
      chalu_kar: taxPayable.chaluKar,
      magil_baki: taxPayable.magilBaki,
      ekun_kar_bharne: taxPayable.ekunKarBharna,
      magahun_ghat_kiva_badal: taxPayable.magahunGhatBadal,
      // Other Tax Calculation (dynamic)
      taxes: selectedTaxes,
      // Child records — used for sync on update (ignored by create endpoint)
      khula_bhukhand_records: khulaBhukhandRecords.map(r => buildKhulaBhukhandPayload(r, 0)),
      bandkam_records: bandkamRecords.map(r => buildBandkamPayload(r, 0)),
      manoryach_records: manoryachRecords.map(r => buildManoryachePayload(r, 0)),
    };
  };

  // Map Khula Bhukhand frontend record to backend payload
  const buildKhulaBhukhandPayload = (record: any, nodniId: number) => {
    const purvPachimFoot = Number(record.shetrafalPurabPachimMeter) || 0;
    const uttarDakshinFoot = Number(record.shetrafalUttarDakshinFoot) || 0;
    const purvPachimMeter = Number(record.shetrafalPurabPachimMeter2) || 0;
    const uttarDakshinMeter = Number(record.shetrafalUttarDakshinMeter) || 0;
    const varshikMulya = Number(record.jaminicheVarshikMulya) || 0;
    const aakraniDar = Number(record.aakraniDar) || 0;

    const ekunChorasFoot = purvPachimFoot * uttarDakshinFoot;
    const ekunChorasMeter = purvPachimMeter * uttarDakshinMeter;
    const bhandvaliMulya = ekunChorasMeter * varshikMulya;
    const karAakarani = (bhandvaliMulya * aakraniDar) / 1000;

    return {
      nodni_id: nodniId,
      malmatteche_prakar: record.malmattechePrakar,
      malmatteche_varnan: record.malmattecheVarnan,
      vapar_prakar: record.vaparPrakar,
      gavache_nav: record.gavacheNav,
      gavthan_baher: record.gavthanBaher,
      shetrafal_purv_paschim_foot: purvPachimFoot,
      shetrafal_uttar_dakshin_foot: uttarDakshinFoot,
      ekun_shetrafal_choras_foot: ekunChorasFoot,
      shetrafal_purv_paschim_meter: purvPachimMeter,
      shetrafal_uttar_dakshin_meter: uttarDakshinMeter,
      ekun_shetrafal_choras_meter: ekunChorasMeter,
      jaminiche_varshik_mulya: varshikMulya,
      aakarani_dar: aakraniDar,
      jamniche_bhandvali_mulya: bhandvaliMulya,
      kar_aakarani: karAakarani,
    };
  };

  // Map Bandkam frontend record to backend payload
  const buildBandkamPayload = (record: any, nodniId: number) => {
    const purvPachimFoot = Number(record.shetrafalPurvPachimFoot) || 0;
    const uttarDakshinFoot = Number(record.shetrafalUttarDakshinFoot) || 0;
    const purvPachimMeter = Number(record.shetrafalPurvPachimMeter) || 0;
    const uttarDakshinMeter = Number(record.shetrafalUttarDakshinMeter) || 0;
    const varshikMulya = Number(record.imaraticheVarshikMulya) || 0;
    const aakraniDar = Number(record.aakraniDar) || 0;
    const ghasaraDar = Number(record.ghasaraDar) || 0;
    const bharank = Number(record.bharank) || 0;

    const ekunChorasFoot = purvPachimFoot * uttarDakshinFoot;
    const ekunChorasMeter = purvPachimMeter * uttarDakshinMeter;
    const bhandvaliMulya = ekunChorasMeter * varshikMulya;
    const karAakarani = (ekunChorasMeter * varshikMulya * ghasaraDar * bharank * aakraniDar) / 1000;

    return {
      nodni_id: nodniId,
      malmatteche_prakar: record.malmattechePrakar,
      malmatteche_varnan: record.malmattecheVarnan,
      vapar_prakar: record.vaparPrakar,
      bandkam_majla: record.bandkamMajla,
      shetrafal_purv_paschim_foot: purvPachimFoot,
      shetrafal_uttar_dakshin_foot: uttarDakshinFoot,
      ekun_shetrafal_choras_foot: ekunChorasFoot,
      shetrafal_purv_paschim_meter: purvPachimMeter,
      shetrafal_uttar_dakshin_meter: uttarDakshinMeter,
      ekun_shetrafal_choras_meter: ekunChorasMeter,
      vayoman: Number(record.vayoman) || 0,
      imaratiche_bankam_varsh: Number(record.imaraticheBandkamVarsh) || 0,
      ghasara_dar: ghasaraDar,
      bharank: bharank,
      imaratiche_varshik_mulya: varshikMulya,
      aakarani_dar: aakraniDar,
      imaratiche_bhandvali_mulya: bhandvaliMulya,
      kar_aakarani: karAakarani,
    };
  };

  // Map Manoryache frontend record to backend payload
  const buildManoryachePayload = (record: any, nodniId: number) => {
    const purvPachimFoot = Number(record.shetrafalPurvPachimFoot) || 0;
    const uttarDakshinFoot = Number(record.shetrafalUttarDakshinFoot) || 0;
    const purvPachimMeter = Number(record.shetrafalPurvPachimMeter) || 0;
    const uttarDakshinMeter = Number(record.shetrafalUttarDakshinMeter) || 0;
    const aakraniDar = Number(record.aakraniDar) || 0;

    const ekunChorasFoot = purvPachimFoot * uttarDakshinFoot;
    const ekunChorasMeter = purvPachimMeter * uttarDakshinMeter;
    const karAakarani = (ekunChorasMeter * aakraniDar) / 1000;

    return {
      nodni_id: nodniId,
      malmatteche_prakar: record.malmattechePrakar,
      malmatteche_varnan: record.malmattecheVarnan,
      vapar_prakar: record.vaparPrakar,
      manoryache_bhag: record.manorycheBhag,
      shetrafal_purv_paschim_foot: purvPachimFoot,
      shetrafal_uttar_dakshin_foot: uttarDakshinFoot,
      ekun_shetrafal_choras_foot: ekunChorasFoot,
      shetrafal_purv_paschim_meter: purvPachimMeter,
      shetrafal_uttar_dakshin_meter: uttarDakshinMeter,
      ekun_shetrafal_choras_meter: ekunChorasMeter,
      aakarani_dar: aakraniDar,
      majla: Number(record.majla) || 1,
      kar_aakarani: karAakarani,
    };
  };

  const populateFormFromEditData = (data: Record<string, any>) => {
    const str = (v: any) => (v !== null && v !== undefined ? String(v) : '');

    setFormData({
      anuKramank: str(data.anu_kramank),
      malmattaNo: str(data.malmatta_number),
      wardNo: str(data.ward_kramnak),
      plotNo: str(data.plot_number),
      khasaraNo: str(data.khasara_number),
      surveyNo: str(data.survey_number),
      votarCardNo: str(data.matdar_card_number),
      mobileNo: str(data.mobile_number),
      aadharCardNo: str(data.aadahar_card_number),
      gharMalkacheNav: str(data.ghar_malkache_nav),
      patniMulacheNav: str(data.patni_mulache_nav),
      bhogwatdharNav: str(data.bhogavat_darache_nav),
      pattaNagarLayout: str(data.patta_nagar_layout_society),
      kaymchaPatta: str(data.kayamcha_patta),
      purvesh: str(data.purv),
      paschimes: str(data.paschim),
      uttares: str(data.uttar),
      dakshines: str(data.dakshin),
      panyachiVyavasta: str(data.pinyacha_panyachi_vyavastha),
      souchalay: str(data.ghari_souychalaya),
      vanijyaPrakar: str(data.vanijya_prakar),
      milkatPrakar: str(data.milkat_prakar),
      imaratMokli: str(data.imarat_kiva_mokdi_jaga),
      dharmikEducation: str(data.imarat_jamin_keval_dharmik_shekshink),
      shauryaPadak: str(data.bhogvatdar_sarkarsasan_dalatil),
      shaskiyaImarat: str(data.shaskiy_samajik_sevanivrut_imarat),
      lambi: str(data.lambi),
      rundi: str(data.rundi),
      shetrafalChorasFoot: str(data.shetrafal_choras_foot),
      shetrafalChorasMeter: str(data.shetrafal_choras_meter),
    });

    setPropertyTax({
      urvaritKhaliJaga: str(data.urvarit_khali_jaga_choras_foot),
      jaminicheBhandavliMulya: str(data.jaminiche_bhandvali_mulya),
      imaraticheBhandavliMulya: str(data.imaratiche_bhandvali_mulya),
      ekunBhandavliMulya: str(data.ekun_bhandvali_mulya),
      khulaBhukhandAakarani: str(data.khula_bhukhand_aakarani),
      imaraticheKarAakarani: str(data.imaratiche_kar_aakarani),
      gruhkarVBhumikar: str(data.gruhkar_v_bhumikar),
    });

    setTaxPayable({
      gruhkarVBhumikarPayable: str(data.kar_gruhkar_v_bhumikar),
      chaluKar: str(data.chalu_kar),
      magilBaki: str(data.magil_baki),
      ekunKarBharna: str(data.ekun_kar_bharne),
      magahunGhatBadal: str(data.magahun_ghat_kiva_badal),
    });

    if (Array.isArray(data.khula_bhukhand_kar_aakarani) && data.khula_bhukhand_kar_aakarani.length > 0) {
      setKhulaBhukhandRecords(data.khula_bhukhand_kar_aakarani.map((r: any) => ({
        malmattechePrakar: str(r.malmatteche_prakar),
        malmattechePrakarName: str(r.malmatteche_prakar_name),
        malmattecheVarnan: str(r.malmatteche_varnan),
        malmattecheVarnanName: str(r.malmatteche_varnan_name),
        vaparPrakar: str(r.vapar_prakar),
        gavacheNav: str(r.gavache_nav),
        gavacheNavName: str(r.gavache_nav_name),
        gavthanBaher: str(r.gavthan_baher),
        gavthanBaherName: str(r.gavthan_baher_name),
        shetrafalPurabPachimMeter: str(r.shetrafal_purv_paschim_foot),
        shetrafalUttarDakshinFoot: str(r.shetrafal_uttar_dakshin_foot),
        ekunShetrafalChorasFoot: str(r.ekun_shetrafal_choras_foot),
        shetrafalPurabPachimMeter2: str(r.shetrafal_purv_paschim_meter),
        shetrafalUttarDakshinMeter: str(r.shetrafal_uttar_dakshin_meter),
        jaminicheVarshikMulya: str(r.jaminiche_varshik_mulya),
        aakraniDar: str(r.aakarani_dar),
      })));
    }

    if (Array.isArray(data.bandkamachi_kar_aakarani) && data.bandkamachi_kar_aakarani.length > 0) {
      setBandkamRecords(data.bandkamachi_kar_aakarani.map((r: any) => ({
        malmattechePrakar: str(r.malmatteche_prakar),
        malmattechePrakarName: str(r.malmatteche_prakar_name),
        malmattecheVarnan: str(r.malmatteche_varnan),
        malmattecheVarnanName: str(r.malmatteche_varnan_name),
        vaparPrakar: str(r.vapar_prakar),
        bandkamMajla: str(r.bandkam_majla),
        bandkamMajlaName: str(r.bandkam_majla_name),
        shetrafalPurvPachimFoot: str(r.shetrafal_purv_paschim_foot),
        shetrafalUttarDakshinFoot: str(r.shetrafal_uttar_dakshin_foot),
        ekunShetrafalChorasFoot: str(r.ekun_shetrafal_choras_foot),
        shetrafalPurvPachimMeter: str(r.shetrafal_purv_paschim_meter),
        shetrafalUttarDakshinMeter: str(r.shetrafal_uttar_dakshin_meter),
        vayoman: str(r.vayoman),
        imaraticheBandkamVarsh: str(r.imaratiche_bankam_varsh),
        ghasaraDar: str(r.ghasara_dar),
        bharank: str(r.bharank),
        imaraticheVarshikMulya: str(r.imaratiche_varshik_mulya),
        aakraniDar: str(r.aakarani_dar),
      })));
    }

    if (Array.isArray(data.manoryache_kar_aakarani) && data.manoryache_kar_aakarani.length > 0) {
      setManoryachRecords(data.manoryache_kar_aakarani.map((r: any) => ({
        malmattechePrakar: str(r.malmatteche_prakar),
        malmattechePrakarName: str(r.malmatteche_prakar_name),
        malmattecheVarnan: str(r.malmatteche_varnan),
        malmattecheVarnanName: str(r.malmatteche_varnan_name),
        vaparPrakar: str(r.vapar_prakar),
        manorycheBhag: str(r.manoryache_bhag),
        manorycheBhagName: str(r.manoryache_bhag_name),
        shetrafalPurvPachimFoot: str(r.shetrafal_purv_paschim_foot),
        shetrafalUttarDakshinFoot: str(r.shetrafal_uttar_dakshin_foot),
        ekunShetrafalChorasFoot: str(r.ekun_shetrafal_choras_foot),
        shetrafalPurvPachimMeter: str(r.shetrafal_purv_paschim_meter),
        shetrafalUttarDakshinMeter: str(r.shetrafal_uttar_dakshin_meter),
        aakraniDar: str(r.aakarani_dar),
        majla: str(r.majla || 1),
      })));
    }
  };

  const handleNodniImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('कृपया फक्त इमेज फाइल निवडा (Please select only image files)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setNodniImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setNodniImageFile(file);
  };

  const removeNodniImage = () => {
    setNodniImageFile(null);
    setNodniImagePreview(null);
    if (nodniImageInputRef.current) nodniImageInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.gharMalkacheNav.trim()) {
      toast.error('घर मालकाचे नाव आवश्यक आहे (House owner name is required)');
      return;
    }

    showLoader(editingId ? 'अद्यतन करत आहे... (Updating...)' : 'नोंदणी जतन करत आहे... (Saving...)');

    try {
      const payload = buildApiPayload();
      let nodniId: number;

      if (editingId) {
        // Update existing record
        const response = await nodniService.update(editingId, payload) as { success: boolean; message?: string; data?: { id: number } };
        if (!response.success) {
          hideLoader();
          toast.error(response.message || 'अद्यतन अयशस्वी (Update failed)');
          return;
        }
        nodniId = editingId;
        // optional: upload/replace image using the nodni id
        if (nodniImageFile) {
          try { await nodniService.uploadImage(nodniId, nodniImageFile); }
          catch { toast.error('इमेज अपलोड अयशस्वी (Image upload failed)'); }
        }
        trackAction(
          `नोंदणी फॉर्म मध्ये डेटा बदलून अद्यतनित (Update) केला — खातेदार: ${formData.gharMalkacheNav || '-'}, अनु क्रमांक: ${formData.anuKramank || '-'}, वॉर्ड: ${formData.wardNo || '-'}`,
          { mode: 'update', nodni_id: nodniId, khatedar: formData.gharMalkacheNav, anu_kramank: formData.anuKramank, ward: formData.wardNo, page: '/nodni-form' }
        );
        hideLoader();
        toast.success('नोंदणी यशस्वीरित्या अद्यतन केली (Nodni updated successfully)');
        setTimeout(() => {
          navigate('/malmatta-nodni');
        }, 1500);
        return;
      } else {
        // Create new record
        const response = await nodniService.create(payload) as { success: boolean; message?: string; data?: { id: number } };

        if (!response.success || !response.data?.id) {
          hideLoader();
          toast.error(response.message || 'जतन अयशस्वी (Save failed)');
          return;
        }

        nodniId = response.data.id;

        // Save child records only on create
        for (const record of khulaBhukhandRecords) {
          await nodniService.createKhulaBhukhand(buildKhulaBhukhandPayload(record, nodniId));
        }
        for (const record of bandkamRecords) {
          await nodniService.createBandkam(buildBandkamPayload(record, nodniId));
        }
        for (const record of manoryachRecords) {
          await nodniService.createManoryache(buildManoryachePayload(record, nodniId));
        }

        // optional: upload image using the freshly-created nodni id
        if (nodniImageFile) {
          try { await nodniService.uploadImage(nodniId, nodniImageFile); }
          catch { toast.error('इमेज अपलोड अयशस्वी (Image upload failed)'); }
        }

        trackAction(
          `नोंदणी फॉर्म मध्ये नवीन नोंदणी तयार (Create) केली — खातेदार: ${formData.gharMalkacheNav || '-'}, अनु क्रमांक: ${formData.anuKramank || '-'}, वॉर्ड: ${formData.wardNo || '-'}`,
          { mode: 'create', nodni_id: nodniId, khatedar: formData.gharMalkacheNav, anu_kramank: formData.anuKramank, ward: formData.wardNo, page: '/nodni-form' }
        );
        hideLoader();
        toast.success('नोंदणी यशस्वीरित्या जतन केली (Nodni saved successfully)');
      }

      setTimeout(() => {
        handleReset();
      }, 1500);
    } catch (error: any) {
      hideLoader();
      toast.error(error?.message || 'काहीतरी चूक झाली (Something went wrong)');
    }
  };

  const handleReset = () => {
    setFormData({
      anuKramank: '',
      malmattaNo: '',
      wardNo: '',
      plotNo: '',
      khasaraNo: '',
      surveyNo: '',
      votarCardNo: '',
      mobileNo: '',
      aadharCardNo: '',
      gharMalkacheNav: '',
      patniMulacheNav: '',
      bhogwatdharNav: '',
      pattaNagarLayout: '',
      kaymchaPatta: '',
      purvesh: '',
      paschimes: '',
      uttares: '',
      dakshines: '',
      panyachiVyavasta: '',
      souchalay: '',
      vanijyaPrakar: '',
      milkatPrakar: '',
      imaratMokli: '',
      dharmikEducation: '',
      shauryaPadak: '',
      shaskiyaImarat: '',
      lambi: '',
      rundi: '',
      shetrafalChorasFoot: '',
      shetrafalChorasMeter: '',
    });

    // Reset tax records
    setKhulaBhukhandRecords([]);
    setBandkamRecords([]);
    setManoryachRecords([]);

    // Reset other taxes - only uncheck selections, keep API data
    setOtherTaxes(prev => prev.map(t => ({ ...t, selected: false })));
    setEditingId(null);
    editApiDataRef.current = null;

    // Reset optional image
    setNodniImageFile(null);
    setNodniImagePreview(null);
    setExistingNodniImageUrl(null);
    if (nodniImageInputRef.current) nodniImageInputRef.current.value = '';

    // Reset property tax
    setPropertyTax({
      urvaritKhaliJaga: '',
      jaminicheBhandavliMulya: '',
      imaraticheBhandavliMulya: '',
      ekunBhandavliMulya: '',
      khulaBhukhandAakarani: '',
      imaraticheKarAakarani: '',
      gruhkarVBhumikar: '',
    });

    // Reset tax payable
    setTaxPayable({
      gruhkarVBhumikarPayable: '',
      chaluKar: '',
      magilBaki: '',
      ekunKarBharna: '',
      magahunGhatBadal: '',
    });
  };

  return (
    <>
      {/* Smaller, lighter placeholders across the whole nodni form */}
      <style>{`
        .nodni-form-scope input::placeholder,
        .nodni-form-scope textarea::placeholder {
          font-size: 0.7rem;
          opacity: 0.8;
        }
      `}</style>
      <ToastContainer />
      <div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            नोंदणी फॉर्म (Nodni Form)
          </h1>

        <form onSubmit={handleSubmit} className="space-y-6 nodni-form-scope">
          {/* Basic Information */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              मूलभूत माहिती
            </h2> */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                वॉर्ड क्र.
                </label>
                <input
                  type="text"
                  name="wardNo"
                  value={formData.wardNo}
                  onChange={handleInputChange}
                  onBlur={handleWardBlur}
                  ref={wardInputRef}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="वॉर्ड क्र."
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
                  readOnly
                  tabIndex={-1}
                  ref={anuKramankInputRef}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                  placeholder="वॉर्ड निवडल्यावर आपोआप"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  मालमत्ता नं
                </label>
                <input
                  type="text"
                  name="malmattaNo"
                  value={formData.malmattaNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="मालमत्ता नं"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  प्लॉट नं
                </label>
                <input
                  type="text"
                  name="plotNo"
                  value={formData.plotNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="प्लॉट नं"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  खसरा नं
                </label>
                <input
                  type="text"
                  name="khasaraNo"
                  value={formData.khasaraNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="खसरा नं"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  सर्वे नं
                </label>
                <input
                  type="text"
                  name="surveyNo"
                  value={formData.surveyNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="सर्वे नं"
                />
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              वैयक्तिक माहिती
            </h2> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  मतदार कार्ड नं
                </label>
                <input
                  type="text"
                  name="votarCardNo"
                  value={formData.votarCardNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="मतदार कार्ड नं"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  मोबाईल नं
                </label>
                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleInputChange}
                  pattern="[0-9]{10}"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="मोबाईल नं"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  आधार कार्ड नं
                </label>
                <input
                  type="text"
                  name="aadharCardNo"
                  value={formData.aadharCardNo}
                  onChange={handleInputChange}
                  pattern="[0-9]{12}"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="आधार कार्ड नं"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  घर मालकाचे नाव
                </label>
                <input
                  type="text"
                  name="gharMalkacheNav"
                  value={formData.gharMalkacheNav}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="घर मालकाचे नाव"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  पत्नी/मुलाचे नाव
                </label>
                <input
                  type="text"
                  name="patniMulacheNav"
                  value={formData.patniMulacheNav}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="पत्नी/मुलाचे नाव"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  भोगवटदाराचे नाव
                </label>
                <input
                  type="text"
                  name="bhogwatdharNav"
                  value={formData.bhogwatdharNav}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="भोगवटदाराचे नाव"
                />
              </div>
            </div>
          </div>

          {/* Property Address */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              मालमत्ता पत्ता (Property Address)
            </h2> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  पत्ता: नगर/लेआउट/सोसायटी (Address)
                </label>
                <input
                  type="text"
                  name="pattaNagarLayout"
                  value={formData.pattaNagarLayout}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter Nagar/Layout/Society"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  कायमचा पत्ता (Permanent Address)
                </label>
                <input
                  type="text"
                  name="kaymchaPatta"
                  value={formData.kaymchaPatta}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter Permanent Address"
                />
              </div>
            </div>
          </div>

          {/* Chatursima (Boundaries) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              चतुर्सीमा (Boundaries)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  पूर्वेस (East)
                </label>
                <input
                  type="text"
                  name="purvesh"
                  value={formData.purvesh}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="East Boundary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  पश्चिमेस (West)
                </label>
                <input
                  type="text"
                  name="paschimes"
                  value={formData.paschimes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="West Boundary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  उत्तरेस (North)
                </label>
                <input
                  type="text"
                  name="uttares"
                  value={formData.uttares}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="North Boundary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  दक्षिणेस (South)
                </label>
                <input
                  type="text"
                  name="dakshines"
                  value={formData.dakshines}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="South Boundary"
                />
              </div>
            </div>
          </div>

          {/* Facilities & Property Details */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              सुविधा व मालमत्ता तपशील (Facilities & Property Details)
            </h2> */}
            <div className="space-y-6">
              {/* Water Supply */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  पिण्याच्या पाण्याची व्यवस्था (Water Supply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {['हातपंप', 'विहीर', 'सार्वजनिक नळ', 'घरी नळ', 'नाही'].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="panyachiVyavasta"
                        value={option}
                        checked={formData.panyachiVyavasta === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toilet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  घरी शौचालय आहे का? (Toilet Available)
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="souchalay"
                      value="होय"
                      checked={formData.souchalay === 'होय'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="souchalay"
                      value="नाही"
                      checked={formData.souchalay === 'नाही'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">नाही (No)</span>
                  </label>
                </div>
              </div>

              {/* Commercial Type */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    वाणिज्य प्रकार (Commercial Type)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, vanijyaPrakar: '' }))}
                    title="निवड रद्द करा (Reset)"
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    रद्द करा
                  </button>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vanijyaPrakar"
                      value="औद्योगिक"
                      checked={formData.vanijyaPrakar === 'औद्योगिक'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">औद्योगिक (Industrial)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vanijyaPrakar"
                      value="मनोरा"
                      checked={formData.vanijyaPrakar === 'मनोरा'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">मनोरा (Tower)</span>
                  </label>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  मिलकत प्रकार (Property Type)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['अधिकृत', 'इमलाकार', 'घरकुल', 'घर कर लावायचे'].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="milkatPrakar"
                        value={option}
                        checked={formData.milkatPrakar === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Building/Land Usage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  इमारत किंवा मोकळी जागा दळण किंवा इतर प्रयोजनासाठी वापरली जाते का?
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imaratMokli"
                      value="होय"
                      checked={formData.imaratMokli === 'होय'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imaratMokli"
                      value="नाही"
                      checked={formData.imaratMokli === 'नाही'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">नाही (No)</span>
                  </label>
                </div>
              </div>

              {/* Religious/Educational Use */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  इमारत/जमीन केवळ धार्मिक/शैक्षणिक प्रयोजनासाठी वापरली जाते का? (1961 चा अधिनियम क्रमांक 43 अन्वये सूट देण्यात आली आहे)
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dharmikEducation"
                      value="होय"
                      checked={formData.dharmikEducation === 'होय'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dharmikEducation"
                      value="नाही"
                      checked={formData.dharmikEducation === 'नाही'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">नाही (No)</span>
                  </label>
                </div>
              </div>

              {/* Military Medal Holder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  भोगवटदारक (मालक) सरकारशन दलातील शौर्य पदक किंवा सेवा पदक धारकाचा किंवा अवलंबनीचा वापरातील निवासी इमारत (फक्त एक) आहे का?
                  (होय असल्यास जिल्हा सैनिक कल्याण अधिकाऱ्याचे प्रमाण पत्र जोडावे)
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shauryaPadak"
                      value="होय"
                      checked={formData.shauryaPadak === 'होय'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shauryaPadak"
                      value="नाही"
                      checked={formData.shauryaPadak === 'नाही'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">नाही (No)</span>
                  </label>
                </div>
              </div>

              {/* Govt / social-religious buildings / retired army officer (tax-exempt) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  शासकीय इमारती व जागा / सामाजिक व धार्मिक इमारती व जागा / सेनेतील सेवा निवृत्त अधिकारी आहे का?
                  <span className="text-xs text-gray-500 dark:text-gray-400"> (होय असल्यास सर्व कर ० दराने आकारले जातील)</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shaskiyaImarat"
                      value="होय"
                      checked={formData.shaskiyaImarat === 'होय'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shaskiyaImarat"
                      value="नाही"
                      checked={formData.shaskiyaImarat === 'नाही'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">नाही (No)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Area Calculation */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              एकूण जागेची क्षेत्रफळ
            </h2>
            <div className="space-y-4">
              {/* Lambi * Rundi = Shetrafal Row */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    लांबी (Lambi) *
                  </label>
                  <input
                    type="text"
                    name="lambi"
                    value={formData.lambi}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter Lambi"
                  />
                </div>

                <div className="hidden sm:flex items-center h-10 text-2xl font-bold text-gray-700 dark:text-gray-300 pb-1">
                  ×
                </div>

                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    रुंदी (Rundi) *
                  </label>
                  <input
                    type="text"
                    name="rundi"
                    value={formData.rundi}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter Rundi"
                  />
                </div>

                <div className="hidden sm:flex items-center h-10 text-2xl font-bold text-gray-700 dark:text-gray-300 pb-1">
                  =
                </div>

                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    क्षेत्रफळ चौरस फूट (Shetrafal Choras Foot)
                  </label>
                  <input
                    type="text"
                    name="shetrafalChorasFoot"
                    value={formData.shetrafalChorasFoot}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter in Square Feet"
                  />
                </div>

                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    क्षेत्रफळ चौरस मीटर (Shetrafal Choras Meter)
                  </label>
                  <input
                    type="text"
                    value={formData.shetrafalChorasMeter}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Aakarani Buttons - Only show if both anuKramank and wardNo are filled */}
          {formData.anuKramank && formData.wardNo && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                आकारणी (Tax Assessment)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setIsKhulaBhukhandModalOpen(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium text-center"
                >
                  खुला भूखंड कर आकारणी
                </button>
                <button
                  type="button"
                  onClick={() => setIsBandkamModalOpen(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium text-center"
                >
                  बांदकामाची कर आकारणी
                </button>
                <button
                  type="button"
                  onClick={() => setIsManoryachModalOpen(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium text-center"
                >
                  मनोऱ्याचे कर आकारणी
                </button>
              </div>
            </div>
          )}

          {/* Records Tables */}
          {(khulaBhukhandRecords.length > 0 || bandkamRecords.length > 0 || manoryachRecords.length > 0) && (
            <div className="space-y-6">
              <KhulaBhukhandTable 
                records={khulaBhukhandRecords}
                onEdit={handleEditKhulaBhukhand}
                onDelete={handleDeleteKhulaBhukhand}
              />
              
              <BandkamTable 
                records={bandkamRecords}
                onEdit={handleEditBandkam}
                onDelete={handleDeleteBandkam}
              />
              
              <ManoryachTable 
                records={manoryachRecords}
                onEdit={handleEditManoryach}
                onDelete={handleDeleteManoryach}
              />
            </div>
          )}

          {/* Tax Calculation Section - Always visible */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Other Tax Calculation */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  इतर कर गणना (Other Tax Calculation)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          निवडा
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          कराचे नाव
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          कर दर
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxLoading ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            लोड होत आहे... (Loading...)
                          </td>
                        </tr>
                      ) : otherTaxes.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            कोणताही कर सापडला नाही (No tax found)
                          </td>
                        </tr>
                      ) : (
                        otherTaxes.map((tax, index) => (
                          <tr key={tax.tax_id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={tax.selected}
                                onChange={() => handleOtherTaxCheckbox(index)}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                              {tax.tax_name}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tax.rate}
                                onChange={(e) => handleOtherTaxRate(index, e.target.value)}
                                disabled={!tax.selected}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                placeholder="0.00"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
                        <td colSpan={2} className="px-3 py-2 text-right text-sm text-gray-900 dark:text-white">
                          एकूण (Total):
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                          ₹ {calculateOtherTaxTotal()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side - Property Tax Calculation */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  मालमत्ता कर गणना (Property Tax Calculation)
                </h3>
                <div className="space-y-4">
                  {/* Row 1: Urvarit Khali Jaga */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      उर्वरित खाली जागा (चौरस फूट)
                    </label>
                    <input
                      type="text"
                      value={propertyTax.urvaritKhaliJaga}
                      onChange={(e) => handlePropertyTaxChange('urvaritKhaliJaga', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter value"
                    />
                  </div>

                  {/* Row 2: Bhandavli Mulya Calculation */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          जमिनीचे भांडवली मूल्य
                        </label>
                        <input
                          type="text"
                          value={propertyTax.jaminicheBhandavliMulya}
                          onChange={(e) => handlePropertyTaxChange('jaminicheBhandavliMulya', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center h-10 mt-6 text-xl font-bold text-gray-700 dark:text-gray-300">
                        +
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          इमारतीचे भांडवली मूल्य
                        </label>
                        <input
                          type="text"
                          value={propertyTax.imaraticheBhandavliMulya}
                          onChange={(e) => handlePropertyTaxChange('imaraticheBhandavliMulya', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center h-10 mt-6 text-xl font-bold text-gray-700 dark:text-gray-300">
                        =
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          एकूण भांडवली मूल्य
                        </label>
                        <input
                          type="text"
                          value={propertyTax.ekunBhandavliMulya}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Kar Aakarani Calculation */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          खुला भूखंड आकारणी
                        </label>
                        <input
                          type="text"
                          value={propertyTax.khulaBhukhandAakarani}
                          onChange={(e) => handlePropertyTaxChange('khulaBhukhandAakarani', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center h-10 mt-6 text-xl font-bold text-gray-700 dark:text-gray-300">
                        +
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          इमारतीचे कर आकारणी
                        </label>
                        <input
                          type="text"
                          value={propertyTax.imaraticheKarAakarani}
                          onChange={(e) => handlePropertyTaxChange('imaraticheKarAakarani', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center h-10 mt-6 text-xl font-bold text-gray-700 dark:text-gray-300">
                        =
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          गृहकर व भूमिकर
                        </label>
                        <input
                          type="text"
                          value={propertyTax.gruhkarVBhumikar}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Tax Payable Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              कर भरणे (Tax Payable)
            </h3>

            {/* Row 1: Four fields in a row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  गृहकर व भूमिकर
                </label>
                <input
                  type="text"
                  value={taxPayable.gruhkarVBhumikarPayable}
                  onChange={(e) => handleTaxPayableChange('gruhkarVBhumikarPayable', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  चालू कर
                </label>
                <input
                  type="text"
                  value={taxPayable.chaluKar}
                  onChange={(e) => handleTaxPayableChange('chaluKar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  मागील बाकी
                </label>
                <input
                  type="text"
                  value={taxPayable.magilBaki}
                  onChange={(e) => handleTaxPayableChange('magilBaki', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  एकूण कर भरणे
                </label>
                <input
                  type="text"
                  value={taxPayable.ekunKarBharna}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Row 2: Full width textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                मागाहून घट किंवा बदल झालेल्या बाबतीत आदेशाचा उल्लेख धरून शेरे
              </label>
              <textarea
                value={taxPayable.magahunGhatBadal}
                onChange={(e) => handleTaxPayableChange('magahunGhatBadal', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter remarks..."
              />
            </div>
          </div>

          {/* Image Upload (optional) — uploaded after the nodni is saved, via its id */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              इमेज अपलोड (Image Upload) <span className="text-sm font-normal text-gray-500 dark:text-gray-400">— वैकल्पिक (optional)</span>
            </h2>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={nodniImageInputRef}
                  accept="image/*"
                  onChange={handleNodniImageSelect}
                  className="hidden"
                  id="nodni-image-upload"
                />
                <label
                  htmlFor="nodni-image-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-[rgb(106,115,55)] text-white rounded-lg hover:bg-[rgb(86,95,35)] transition-colors cursor-pointer font-medium"
                >
                  <Upload className="w-5 h-5" />
                  इमेज निवडा (Choose Image)
                </label>
                {nodniImageFile && (
                  <span className="text-sm text-gray-700 dark:text-gray-300 break-all">{nodniImageFile.name}</span>
                )}
              </div>

              {/* New selected image preview */}
              {nodniImagePreview && (
                <div className="relative max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">इमेज पूर्वावलोकन (Preview)</label>
                    <button
                      type="button"
                      onClick={removeNodniImage}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" /> काढा (Remove)
                    </button>
                  </div>
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <img src={nodniImagePreview} alt="Preview" className="w-full h-auto object-contain" />
                  </div>
                </div>
              )}

              {/* Existing saved image (edit mode) — shown until a new one is chosen */}
              {!nodniImagePreview && existingNodniImageUrl && (
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">सध्याची इमेज (Current Image)</label>
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <img src={existingNodniImageUrl} alt="Current" className="w-full h-auto object-contain" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">नवीन इमेज निवडल्यास ही बदलली जाईल.</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-center gap-4">
            <button
                type="submit"
                className="px-8 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
              >
                {editingId ? 'बदल करा (Update)' : 'जतन करा (Save)'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-8 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
              >
                रीसेट करा (Reset)
              </button>
          </div>
        </form>
      </div>

      {/* Khula Bhukhand Kar Aakarni Modal */}
      <KhulaBhukhandModal
        isOpen={isKhulaBhukhandModalOpen}
        onClose={() => {
          setIsKhulaBhukhandModalOpen(false);
          setEditingKhulaBhukhandIndex(null);
        }}
        onSave={handleKhulaBhukhandSave}
        initialData={editingKhulaBhukhandIndex !== null ? khulaBhukhandRecords[editingKhulaBhukhandIndex] : undefined}
      />

      {/* Bandkam Kar Aakarni Modal */}
      <BandkamModal
        isOpen={isBandkamModalOpen}
        onClose={() => {
          setIsBandkamModalOpen(false);
          setEditingBandkamIndex(null);
        }}
        onSave={handleBandkamSave}
        initialData={editingBandkamIndex !== null ? bandkamRecords[editingBandkamIndex] : undefined}
      />

      {/* Manoryach Kar Aakarni Modal */}
      <ManoryachModal
        isOpen={isManoryachModalOpen}
        onClose={() => {
          setIsManoryachModalOpen(false);
          setEditingManoryachIndex(null);
        }}
        onSave={handleManoryachSave}
        initialData={editingManoryachIndex !== null ? manoryachRecords[editingManoryachIndex] : undefined}
      />
      </div>
    </>
  );
};

export default NodniForm;

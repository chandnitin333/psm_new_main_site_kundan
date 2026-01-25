import { useState, useEffect, useRef } from 'react';
import KhulaBhukhandModal from './KhulaBhukhandModal';
import BandkamModal from './BandkamModal';
import ManoryachModal from './ManoryachModal';
import KhulaBhukhandTable from './KhulaBhukhandTable';
import BandkamTable from './BandkamTable';
import ManoryachTable from './ManoryachTable';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import type { NodniFormData } from '../../../interfaces/dashboard/nodni-form/NodniForm.types';

const NodniForm = () => {
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [isKhulaBhukhandModalOpen, setIsKhulaBhukhandModalOpen] = useState(false);
  const [isBandkamModalOpen, setIsBandkamModalOpen] = useState(false);
  const [isManoryachModalOpen, setIsManoryachModalOpen] = useState(false);

  const [khulaBhukhandRecords, setKhulaBhukhandRecords] = useState<any[]>([]);
  const [bandkamRecords, setBandkamRecords] = useState<any[]>([]);
  const [manoryachRecords, setManoryachRecords] = useState<any[]>([]);

  const [editingKhulaBhukhandIndex, setEditingKhulaBhukhandIndex] = useState<number | null>(null);
  const [editingBandkamIndex, setEditingBandkamIndex] = useState<number | null>(null);
  const [editingManoryachIndex, setEditingManoryachIndex] = useState<number | null>(null);

  // Other Tax Calculation State
  const [otherTaxes, setOtherTaxes] = useState<Array<{ selected: boolean; name: string; rate: string }>>([
    { selected: false, name: 'पाणी कर (Water Tax)', rate: '' },
    { selected: false, name: 'गटार कर (Sewerage Tax)', rate: '' },
    { selected: false, name: 'शिक्षण कर (Education Tax)', rate: '' },
    { selected: false, name: 'सफाई कर (Sanitation Tax)', rate: '' },
    { selected: false, name: 'इतर कर (Other Tax)', rate: '' },
  ]);

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
    lambi: '',
    rundi: '',
    shetrafalChorasFoot: '',
    shetrafalChorasMeter: '',
  });

  // Ref for अनु क्रमांक input field
  const anuKramankInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on अनु क्रमांक field when component loads with loader
  useEffect(() => {
    document.title = 'Nodni Form - नोंदणी फॉर्म';
    const loadPage = async () => {
      showLoader('पृष्ठ लोड होत आहे... (Loading page...)');
      await new Promise(resolve => setTimeout(resolve, 800));
      hideLoader();
      if (anuKramankInputRef.current) {
        anuKramankInputRef.current.focus();
      }
    };
    loadPage();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Other Tax checkbox change
  const handleOtherTaxCheckbox = (index: number) => {
    const updatedTaxes = [...otherTaxes];
    updatedTaxes[index].selected = !updatedTaxes[index].selected;
    setOtherTaxes(updatedTaxes);
  };

  // Handle Other Tax rate change
  const handleOtherTaxRate = (index: number, value: string) => {
    const updatedTaxes = [...otherTaxes];
    updatedTaxes[index].rate = value;
    setOtherTaxes(updatedTaxes);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    showLoader('नोंदणी जतन करत आहे...');

    // Simulate async operation (API call)
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Form Data:', formData);
    // TODO: Implement save logic (e.g., API call)

    hideLoader();

    toast.success('नोंदणी यशस्वीरित्या जतन केली (Nodni saved successfully)');

    // Reset form after successful submission
    setTimeout(() => {
      handleReset();
    }, 1500);
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
      lambi: '',
      rundi: '',
      shetrafalChorasFoot: '',
      shetrafalChorasMeter: '',
    });

    // Reset tax records
    setKhulaBhukhandRecords([]);
    setBandkamRecords([]);
    setManoryachRecords([]);

    // Reset other taxes
    setOtherTaxes([
      { selected: false, name: 'पाणी कर (Water Tax)', rate: '' },
      { selected: false, name: 'गटार कर (Sewerage Tax)', rate: '' },
      { selected: false, name: 'शिक्षण कर (Education Tax)', rate: '' },
      { selected: false, name: 'सफाई कर (Sanitation Tax)', rate: '' },
      { selected: false, name: 'इतर कर (Other Tax)', rate: '' },
    ]);

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
      <ToastContainer />
      <div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            नोंदणी फॉर्म (Nodni Form)
          </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              मूलभूत माहिती
            </h2> */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  अनु क्रमांक
                </label>
                <input
                  type="text"
                  name="anuKramank"
                  value={formData.anuKramank}
                  onChange={handleInputChange}
                  ref={anuKramankInputRef}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="अनु क्रमांक"
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
                  प्रभाग क्र.
                </label>
                <input
                  type="text"
                  name="wardNo"
                  value={formData.wardNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="प्रभाग क्र."
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
                  {['hatpump', 'vihir', 'sarvjnik_nal', 'ghari_nal', 'nahi'].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="panyachiVyavasta"
                        value={option}
                        checked={formData.panyachiVyavasta === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {option === 'hatpump' && 'हातपंप'}
                        {option === 'vihir' && 'विहीर'}
                        {option === 'sarvjnik_nal' && 'सार्वजनिक नळ'}
                        {option === 'ghari_nal' && 'घरी नळ'}
                        {option === 'nahi' && 'नाही'}
                      </span>
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
                      value="hoy"
                      checked={formData.souchalay === 'hoy'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="souchalay"
                      value="nahi"
                      checked={formData.souchalay === 'nahi'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">नाही (No)</span>
                  </label>
                </div>
              </div>

              {/* Commercial Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  वाणिज्य प्रकार (Commercial Type)
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vanijyaPrakar"
                      value="audogyik"
                      checked={formData.vanijyaPrakar === 'audogyik'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">औद्योगिक (Industrial)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vanijyaPrakar"
                      value="manora"
                      checked={formData.vanijyaPrakar === 'manora'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">मनोरंजन (Entertainment)</span>
                  </label>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  मिलकत प्रकार (Property Type)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['adhikrut', 'imlakar', 'gharkul', 'ghar_kar'].map((option) => (
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
                        {option === 'adhikrut' && 'अधिकृत'}
                        {option === 'imlakar' && 'इमलाकार'}
                        {option === 'gharkul' && 'घरकुल'}
                        {option === 'ghar_kar' && 'घर कर लावायचे'}
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
                      value="hoy"
                      checked={formData.imaratMokli === 'hoy'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imaratMokli"
                      value="nahi"
                      checked={formData.imaratMokli === 'nahi'}
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
                      value="hoy"
                      checked={formData.dharmikEducation === 'hoy'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dharmikEducation"
                      value="nahi"
                      checked={formData.dharmikEducation === 'nahi'}
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
                      value="hoy"
                      checked={formData.shauryaPadak === 'hoy'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">होय (Yes)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shauryaPadak"
                      value="nahi"
                      checked={formData.shauryaPadak === 'nahi'}
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
                <div className="flex-1 min-w-[150px]">
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

                <div className="flex items-center h-10 text-2xl font-bold text-gray-700 dark:text-gray-300 pb-1">
                  ×
                </div>

                <div className="flex-1 min-w-[150px]">
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

                <div className="flex items-center h-10 text-2xl font-bold text-gray-700 dark:text-gray-300 pb-1">
                  =
                </div>

                <div className="flex-1 min-w-[150px]">
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

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    क्षेत्रफळ चौरस मीटर (Shetrafal Choras Meter)
                  </label>
                  <input
                    type="text"
                    name="shetrafalChorasMeter"
                    value={formData.shetrafalChorasMeter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter in Square Meters"
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
                      {otherTaxes.map((tax, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={tax.selected}
                              onChange={() => handleOtherTaxCheckbox(index)}
                              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {tax.name}
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
                      ))}
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

          {/* Form Actions */}
          <div className="flex justify-center gap-4">
            <button
                type="submit"
                className="px-8 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
              >
                जतन करा (Save)
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

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import YearPicker from '../../../components/common/YearPicker';
import DatePicker from '../../../components/common/DatePicker';
import type { VasuliFormData } from '../../../interfaces/dashboard/vasuli/VasuliForm.types';

const VasuliForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const isEdit = location.state?.isEdit || false;
  const existingRecord = location.state?.record;

  const [formData, setFormData] = useState<VasuliFormData>({
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

  // Load existing record data if editing
  useEffect(() => {
    if (isEdit && existingRecord) {
      // Parse year from "2024-2025" format
      const yearMatch = existingRecord.year?.match(/(\d{4})-(\d{4})/);
      const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
      const toYear = yearMatch ? yearMatch[2] : (new Date().getFullYear() + 1).toString();

      setFormData({
        year: year,
        toYear: toYear,
        anuKramank: existingRecord.anuKramank || '',
        malmattaKramank: existingRecord.milkatKramank || '',
        wardKramank: existingRecord.wardNo || '',
        plotKramank: existingRecord.plotNo || '',
        khasaraKramank: existingRecord.khasaraKramank || '',
        surveyKramank: existingRecord.surveyKramank || '',
        khatedharkacheNav: existingRecord.khatedharkacheNav || '',
        bhogwatdaracheNav: existingRecord.bhogwatdaracheNav || '',
        patta: existingRecord.patta || '',
        // Tax fields
        gruhkarMagil: existingRecord.gruhkarMagil || '',
        gruhkarChalu: existingRecord.gruhkarChalu || '',
        gruhkarJama: existingRecord.gruhkarJama || '',
        gruhkarShillak: existingRecord.gruhkarShillak || '',
        vizMagil: existingRecord.vizMagil || '',
        vizChalu: existingRecord.vizChalu || '',
        vizJama: existingRecord.vizJama || '',
        vizShillak: existingRecord.vizShillak || '',
        aarogyaMagil: existingRecord.aarogyaMagil || '',
        aarogyaChalu: existingRecord.aarogyaChalu || '',
        aarogyaJama: existingRecord.aarogyaJama || '',
        aarogyaShillak: existingRecord.aarogyaShillak || '',
        safaeMagil: existingRecord.safaeMagil || '',
        safaeChalu: existingRecord.safaeChalu || '',
        safaeJama: existingRecord.safaeJama || '',
        safaeShillak: existingRecord.safaeShillak || '',
        gruhkarPavtiDate: existingRecord.gruhkarPavtiDate || '',
        samanyaPaniMagil: existingRecord.samanyaPaniMagil || '',
        samanyaPaniChalu: existingRecord.samanyaPaniChalu || '',
        samanyaPaniJama: existingRecord.samanyaPaniJama || '',
        samanyaPaniShillak: existingRecord.samanyaPaniShillak || '',
        visheshPaniMagil: existingRecord.visheshPaniMagil || '',
        visheshPaniChalu: existingRecord.visheshPaniChalu || '',
        visheshPaniJama: existingRecord.visheshPaniJama || '',
        visheshPaniShillak: existingRecord.visheshPaniShillak || '',
        paniPavtiDate: existingRecord.paniPavtiDate || '',
        noticeFeeMagil: existingRecord.noticeFeeMagil || '',
        noticeFeeChalu: existingRecord.noticeFeeChalu || '',
        noticeFeeJama: existingRecord.noticeFeeJama || '',
        noticeFeeShillak: existingRecord.noticeFeeShillak || '',
        etarFeeMagil: existingRecord.etarFeeMagil || '',
        etarFeeChalu: existingRecord.etarFeeChalu || '',
        etarFeeJama: existingRecord.etarFeeJama || '',
        etarFeeShillak: existingRecord.etarFeeShillak || '',
      });
    }
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

    showLoader('वसुली जतन करत आहे...');

    // Simulate async operation (API call)
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Vasuli Form Data:', formData);

    // Map form field names to record field names
    const recordData = {
      anuKramank: formData.anuKramank,
      milkatKramank: formData.malmattaKramank,
      wardNo: formData.wardKramank,
      khasaraKramank: formData.khasaraKramank,
      khatedharkacheNav: formData.khatedharkacheNav,
      bhogwatdaracheNav: formData.bhogwatdaracheNav,
      year: `${formData.year}-${formData.toYear}`,
      plotNo: formData.plotKramank,
      surveyKramank: formData.surveyKramank,
      patta: formData.patta,
      // Include all tax fields
      gruhkarMagil: formData.gruhkarMagil,
      gruhkarChalu: formData.gruhkarChalu,
      gruhkarJama: formData.gruhkarJama,
      gruhkarShillak: formData.gruhkarShillak,
      vizMagil: formData.vizMagil,
      vizChalu: formData.vizChalu,
      vizJama: formData.vizJama,
      vizShillak: formData.vizShillak,
      aarogyaMagil: formData.aarogyaMagil,
      aarogyaChalu: formData.aarogyaChalu,
      aarogyaJama: formData.aarogyaJama,
      aarogyaShillak: formData.aarogyaShillak,
      safaeMagil: formData.safaeMagil,
      safaeChalu: formData.safaeChalu,
      safaeJama: formData.safaeJama,
      safaeShillak: formData.safaeShillak,
      gruhkarPavtiDate: formData.gruhkarPavtiDate,
      samanyaPaniMagil: formData.samanyaPaniMagil,
      samanyaPaniChalu: formData.samanyaPaniChalu,
      samanyaPaniJama: formData.samanyaPaniJama,
      samanyaPaniShillak: formData.samanyaPaniShillak,
      visheshPaniMagil: formData.visheshPaniMagil,
      visheshPaniChalu: formData.visheshPaniChalu,
      visheshPaniJama: formData.visheshPaniJama,
      visheshPaniShillak: formData.visheshPaniShillak,
      paniPavtiDate: formData.paniPavtiDate,
      noticeFeeMagil: formData.noticeFeeMagil,
      noticeFeeChalu: formData.noticeFeeChalu,
      noticeFeeJama: formData.noticeFeeJama,
      noticeFeeShillak: formData.noticeFeeShillak,
      etarFeeMagil: formData.etarFeeMagil,
      etarFeeChalu: formData.etarFeeChalu,
      etarFeeJama: formData.etarFeeJama,
      etarFeeShillak: formData.etarFeeShillak,
    };

    hideLoader();

    if (isEdit) {
      toast.success('वसुली यशस्वीरित्या अद्यतनित केली (Vasuli updated successfully)');
      // Delay navigation to allow toast to be visible
      setTimeout(() => {
        navigate('/vasuli', { state: { updatedRecord: recordData, isEdit: true, originalRecord: existingRecord } });
      }, 2500);
    } else {
      toast.success('वसुली यशस्वीरित्या जतन केली (Vasuli saved successfully)');
      // Delay navigation to allow toast to be visible
      setTimeout(() => {
        navigate('/vasuli', { state: { newRecord: recordData } });
      }, 2500);
    }
  };

  const handleReset = () => {
    setFormData({
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

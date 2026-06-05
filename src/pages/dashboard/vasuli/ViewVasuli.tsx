import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { vasuliService } from '../../../services/vasuliService';
import { numberToWordsRupees } from '../../../utils/numberToWords';
import type { ViewVasuliData } from '../../../interfaces/dashboard/vasuli/ViewVasuli.types';

const ViewVasuli = () => {
  const componentRef = useRef<HTMLDivElement>(null);

  // Force light mode
  useEffect(() => {
    // Remove dark class from html and body
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');

    // Force white background with !important via inline styles
    document.documentElement.setAttribute('style', 'background-color: #ffffff !important');
    document.body.setAttribute('style', 'background-color: #ffffff !important');

    // Also set color-scheme to light
    document.documentElement.style.colorScheme = 'light';

    return () => {
      // Cleanup is optional - you can restore theme if needed
    };
  }, []);

  // Today's date (used in the receipt footer)
  const getTodayDate = () => new Date().toLocaleDateString('en-GB');

  // Header (gram panchayat / tahsil / jilha) from the logged-in user, best-effort
  const getUserLocation = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        gramPanchayat: u.gram_panchayat || u.gramPanchayat || u.gram_panchayat_name || '',
        tahsil: u.taluka || u.taluka_name || u.tahsil || '',
        jilha: u.district || u.district_name || u.jilha || '',
      };
    } catch {
      return { gramPanchayat: '', tahsil: '', jilha: '' };
    }
  };
  const userLoc = getUserLocation();

  // Default/placeholder values; record-specific fields are filled from the API below
  const defaultData: ViewVasuliData = {
    gramPanchayat: userLoc.gramPanchayat,
    tahsil: userLoc.tahsil,
    jilha: userLoc.jilha,
    pavtiKramank: '',
    anuKramank: '',
    malmattaKramank: '',
    wardKramank: '',
    plotKramank: '',
    khasaraKramank: '',
    surveyKramank: '',
    khatedarkacheNav: '',
    patniMulacheNav: '',
    bhogwatdaracheNav: '',
    gruhkarVBhumikarDinank: '',
    paniKarDinank: '',
    shera: 'या पावतीच्या आधारे करभरणा केलेली रक्कम माझ्याकडून मिळाली आणि ती ग्रामपंचायतीच्या खात्यात जमा केली गेली आहे.',
    gruhkarVBhumikar: { magilBaki: '0', chaluKar: '0', ekunJamaRakkam: '0', thakbakiRakkam: '0' },
    divabattiVizKar: { magilBaki: '0', chaluKar: '0', ekunJamaRakkam: '0', thakbakiRakkam: '0' },
    aarogyaRakshanKar: { magilBaki: '0', chaluKar: '0', ekunJamaRakkam: '0', thakbakiRakkam: '0' },
    safaeKar: { magilBaki: '0', chaluKar: '0', ekunJamaRakkam: '0', thakbakiRakkam: '0' },
    samanyaPaniKar: { magilBaki: '0', chaluKar: '0', ekunJamaRakkam: '0', thakbakiRakkam: '0' },
    visheshPaniKar: { magilBaki: '0', chaluKar: '0', ekunJamaRakkam: '0', thakbakiRakkam: '0' },
    ekunRakkam: { magilBaki: '0', chaluKar: '0', ekunJamaRakkam: '0', thakbakiRakkam: '0' },
    bharleliRakkamAkshari: '',
  };

  const [data, setData] = useState<ViewVasuliData>(defaultData);

  // Fetch the full vasuli record (by id from the URL) and populate the receipt dynamically
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('id'));
    if (!id) return;

    const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
    const dateStr = (v: unknown) => {
      if (!v) return '';
      const raw = String(v);
      // Try parsing the full string first (handles RFC like "Thu, 04 Jun 2026 00:00:00 GMT")
      let d = new Date(raw);
      if (isNaN(d.getTime())) {
        // Fallback for "YYYY-MM-DD HH:MM:SS" / ISO -> take the date portion
        const datePart = raw.split(/[ T]/)[0];
        d = new Date(datePart);
        if (isNaN(d.getTime())) return raw;
      }
      return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
    };
    const row = (r: Record<string, unknown>, magil: string, chalu: string, jama: string, sillak: string) => ({
      magilBaki: s(r[magil] ?? '0'),
      chaluKar: s(r[chalu] ?? '0'),
      ekunJamaRakkam: s(r[jama] ?? '0'),
      thakbakiRakkam: s(r[sillak] ?? '0'),
    });

    (async () => {
      try {
        const res = await vasuliService.getById(id);
        if (res.success && res.data) {
          const r = res.data as Record<string, unknown>;
          // भरलेली रक्कम (amount paid) = total jama; show it in words
          const totalPaid = Number(r.jama_keleli_ekun ?? 0);
          setData(prev => ({
            ...prev,
            bharleliRakkamAkshari: numberToWordsRupees(totalPaid),
            patniMulacheNav: s(r.patni_mulache_nav),
            pavtiKramank: s(r.id),
            anuKramank: s(r.anu_kramank),
            malmattaKramank: s(r.malmatta_number),
            wardKramank: s(r.ward_number),
            plotKramank: s(r.plot_number),
            khasaraKramank: s(r.khasara_kramank),
            surveyKramank: s(r.survey_number),
            khatedarkacheNav: s(r.khatedharkache_nav),
            bhogwatdaracheNav: s(r.bhogwatdarache_nav),
            gruhkarVBhumikarDinank: dateStr(r.gruhkar_v_bhumikar_pavti_date),
            paniKarDinank: dateStr(r.pani_kar_pavti_v_date),
            gruhkarVBhumikar: row(r, 'magil_gruhkar_v_bhumikar', 'chalu_gruhkar_v_bhumikar', 'jama_keleli_rakkam_gruhkar_v_bhumikar', 'sillak_gruhkar_v_bhumikar'),
            divabattiVizKar: row(r, 'magil_viz_divabatti_kar', 'chalu_viz_divabatti_kar', 'jama_keleli_rakkam_viz_divabatti_kar', 'sillak_viz_divabatti_kar'),
            aarogyaRakshanKar: row(r, 'magil_aarogya_rakshan_kar', 'chalu_aarogya_rakshan_kar', 'jama_kelili_rakkam_aarogya_rakshan_kar', 'sillak_aarogya_rakshan_kar'),
            safaeKar: row(r, 'magil_safae_kar', 'chalu_safae_kar', 'jama_keleli_rakkam_safae_kar', 'sillak_safae_kar'),
            samanyaPaniKar: row(r, 'magil_samanya_pani_kar', 'chalu_samanya_pani_kar', 'jama_keleli_rakkam_samanya_pani_kar', 'sillak_samanya_pani_kar'),
            visheshPaniKar: row(r, 'magil_vishesh_pani_kar', 'chalu_vishesh_pani_kar', 'jama_keleli_rakkam_vishesh_pani_kar', 'sillak_vishesh_pani_kar'),
            ekunRakkam: row(r, 'magil_ekun', 'chalu_ekun', 'jama_keleli_ekun', 'sillak_ekun'),
          }));
        }
      } catch (e) {
        console.error('Failed to load vasuli record for view', e);
      }
    })();
  }, []);

  useEffect(() => {
    // Set page title
    document.title = 'View Vasuli - वसुली पाहा';

    // Suppress Chrome extension errors during print
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('runtime.lastError') ||
         args[0].includes('message port closed'))
      ) {
        return; // Suppress these specific errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError; // Restore on unmount
    };
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'करबद्दल पावती (नमुना 10)',
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
        }
        header, footer {
          display: none !important;
        }
        table {
          border-width: 1px !important;
          width: 100% !important;
          page-break-inside: avoid;
        }
        table th, table td {
          border-width: 1px !important;
          padding: 6px 8px !important;
          vertical-align: middle !important;
          text-align: center !important;
          line-height: 1.4 !important;
        }
        .print-container {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
        }
      }
    `,
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 print:p-0 print:bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="mb-4 print:hidden flex justify-end gap-4">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Print / छपाई करा
        </button>
      </div>

      {/* Report Content */}
      <div ref={componentRef} className="max-w-4xl mx-auto bg-white dark:bg-gray-800 print:bg-white print:dark:bg-white p-8 print:p-4 shadow-lg print:shadow-none print:mt-8">
        {/* Header - Title */}
        <div className="text-center mb-2 print:mb-2">
          <h1 className="text-2xl print:text-lg font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
            करबद्दल पावती (नमुना 10)
          </h1>
        </div>

        {/* Header - Gram Panchayat */}
        <div className="text-center mb-2 print:mb-2">
          <h2 className="text-xl print:text-base font-semibold text-gray-900 dark:text-white print:text-black print:leading-tight">
            ग्रामपंचायत कार्यालय :- {data.gramPanchayat}
          </h2>
        </div>

        {/* Header - Tahsil, Jilha, Pavti Kramank */}
        <div className="flex justify-between items-center mb-3 print:mb-2 text-gray-900 dark:text-white print:text-black print:text-sm">
          <div className="font-medium print:leading-tight">
            तहसील: {data.tahsil}
          </div>
          <div className="font-medium text-center print:leading-tight">
            जिल्हा: {data.jilha}
          </div>
          <div className="font-medium print:leading-tight">
            पावती क्रमांक: {data.pavtiKramank}
          </div>
        </div>

        {/* Table 1 - 6 Columns */}
        <div className="mb-3 print:mb-2 overflow-x-auto">
          <table className="w-full border border-gray-900 dark:border-gray-300 print:border-black">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 print:bg-gray-100">
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  अनुक्रमांक
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  मालमत्ता क्रमांक
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  वॉर्ड क्रमांक
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  प्लॉट क्रमांक
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  खसरा क्रमांक
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  सर्वे क्रमांक
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.anuKramank}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.malmattaKramank}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.wardKramank}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.plotKramank}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.khasaraKramank}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.surveyKramank}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table 2 - Personal Details (2 columns, 5 rows) */}
        <div className="mb-3 print:mb-2 overflow-x-auto">
          <table className="w-full border border-gray-900 dark:border-gray-300 print:border-black">
            <tbody>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 font-bold text-gray-900 dark:text-white print:text-black w-1/2 print:text-xs print:leading-tight">
                  खातेदाराचे नाव
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 text-gray-900 dark:text-white print:text-black w-1/2 print:text-xs print:leading-tight">
                  {data.khatedarkacheNav}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 font-bold text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  पत्नी/मुलाचे नाव
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.patniMulacheNav}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 font-bold text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  भोगवटदाराचे नाव
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.bhogwatdaracheNav}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 font-bold text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  गृहकर व भूमीकर दिनांक
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.gruhkarVBhumikarDinank}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 font-bold text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  पाणी कर दिनांक
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-4 py-2 print:px-2 print:py-0.5 text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.paniKarDinank}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Shera/Note Box */}
        <div className="mb-3 print:mb-2 border border-gray-900 dark:border-gray-300 print:border-black p-4 print:p-2">
          <p className="text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
            {data.shera}
          </p>
        </div>

        {/* Table 3 - Financial Details (5 columns, 8 rows) */}
        <div className="mb-3 print:mb-2 overflow-x-auto">
          <table className="w-full border border-gray-900 dark:border-gray-300 print:border-black">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 print:bg-gray-100">
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  कराचे नाव
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  मागील बाकी
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  चालू कर
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  एकूण जमा रक्कम
                </th>
                <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                  थकबाकी रक्कम
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 font-medium text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  गृहकर व भूमीकर
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.gruhkarVBhumikar.magilBaki}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.gruhkarVBhumikar.chaluKar}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.gruhkarVBhumikar.ekunJamaRakkam}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.gruhkarVBhumikar.thakbakiRakkam}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 font-medium text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  दिवाबत्ती/विज कर
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.divabattiVizKar.magilBaki}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.divabattiVizKar.chaluKar}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.divabattiVizKar.ekunJamaRakkam}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.divabattiVizKar.thakbakiRakkam}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 font-medium text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  आरोग्य रक्षण कर
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.aarogyaRakshanKar.magilBaki}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.aarogyaRakshanKar.chaluKar}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.aarogyaRakshanKar.ekunJamaRakkam}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.aarogyaRakshanKar.thakbakiRakkam}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 font-medium text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  सफाई कर
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.safaeKar.magilBaki}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.safaeKar.chaluKar}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.safaeKar.ekunJamaRakkam}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.safaeKar.thakbakiRakkam}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 font-medium text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  सामान्य पाणी कर
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.samanyaPaniKar.magilBaki}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.samanyaPaniKar.chaluKar}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.samanyaPaniKar.ekunJamaRakkam}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.samanyaPaniKar.thakbakiRakkam}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 font-medium text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  विशेष पाणी कर
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.visheshPaniKar.magilBaki}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.visheshPaniKar.chaluKar}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.visheshPaniKar.ekunJamaRakkam}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  {data.visheshPaniKar.thakbakiRakkam}
                </td>
              </tr>
              <tr className="bg-gray-100 dark:bg-gray-700 print:bg-gray-100">
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 font-bold text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                  एकूण रक्कम
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 text-center font-bold text-gray-900 dark:text-white print:text-black">
                  {data.ekunRakkam.magilBaki}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 text-center font-bold text-gray-900 dark:text-white print:text-black">
                  {data.ekunRakkam.chaluKar}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 text-center font-bold text-gray-900 dark:text-white print:text-black">
                  {data.ekunRakkam.ekunJamaRakkam}
                </td>
                <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 text-center font-bold text-gray-900 dark:text-white print:text-black">
                  {data.ekunRakkam.thakbakiRakkam}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer - Amount in Words */}
        <div className="text-center mt-3 print:mt-2">
          <p className="text-lg print:text-sm font-semibold text-gray-900 dark:text-white print:text-black print:leading-tight">
            भरलेली रक्कम अक्षरी: {data.bharleliRakkamAkshari}
          </p>
        </div>

        {/* Footer - Date and Signature */}
        <div className="flex justify-between items-end mt-16 print:mt-8">
          <div className="text-gray-900 dark:text-white print:text-black print:text-sm print:leading-tight">
            <p className="font-medium">दिनांक: {getTodayDate()}</p>
          </div>
          <div className="text-right text-gray-900 dark:text-white print:text-black print:text-sm print:leading-tight">
            <p className="font-medium">प्राप्त करता ग्रामपंचायत कार्यालय सही व शिक्का</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewVasuli;

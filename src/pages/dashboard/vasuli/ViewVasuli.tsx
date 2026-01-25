import { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

  // Get today and tomorrow dates
  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-GB');
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-GB');
  };

  // Get record from sessionStorage
  const getRecordFromSession = () => {
    const stored = sessionStorage.getItem('vasuliViewRecord');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored record:', e);
      }
    }
    return null;
  };

  const storedRecord = getRecordFromSession();

  // Sample data - replace with actual data from sessionStorage
  const data: ViewVasuliData = storedRecord ? {
    gramPanchayat: 'Pune',
    tahsil: 'Pune Gramin',
    jilha: 'Pune',
    pavtiKramank: storedRecord.anuKramank || '1',
    anuKramank: storedRecord.anuKramank || '001',
    malmattaKramank: storedRecord.milkatKramank || 'MK-001',
    wardKramank: storedRecord.wardNo || 'W-01',
    plotKramank: storedRecord.plotKramank || 'P-101',
    khasaraKramank: storedRecord.khasaraKramank || 'KK-001',
    surveyKramank: storedRecord.surveyKramank || 'SK-001',
    khatedarkacheNav: storedRecord.khatedharkacheNav || 'Kundan Kotangale',
    patniMulacheNav: 'ABC PQR',
    bhogwatdaracheNav: storedRecord.bhogwatdaracheNav || 'JKL MNJ',
    gruhkarVBhumikarDinank: getTodayDate(),
    paniKarDinank: getTomorrowDate(),
    shera: 'या पावतीच्या आधारे करभरणा केलेली रक्कम माझ्याकडून मिळाली आणि ती ग्रामपंचायतीच्या खात्यात जमा केली गेली आहे.',
    gruhkarVBhumikar: { magilBaki: '500', chaluKar: '2000', ekunJamaRakkam: '2500', thakbakiRakkam: '0' },
    divabattiVizKar: { magilBaki: '200', chaluKar: '800', ekunJamaRakkam: '1000', thakbakiRakkam: '0' },
    aarogyaRakshanKar: { magilBaki: '150', chaluKar: '600', ekunJamaRakkam: '750', thakbakiRakkam: '0' },
    safaeKar: { magilBaki: '100', chaluKar: '400', ekunJamaRakkam: '500', thakbakiRakkam: '0' },
    samanyaPaniKar: { magilBaki: '300', chaluKar: '1200', ekunJamaRakkam: '1500', thakbakiRakkam: '0' },
    visheshPaniKar: { magilBaki: '250', chaluKar: '1000', ekunJamaRakkam: '1250', thakbakiRakkam: '0' },
    ekunRakkam: { magilBaki: '1500', chaluKar: '6000', ekunJamaRakkam: '7500', thakbakiRakkam: '0' },
    bharleliRakkamAkshari: 'सात हजार पाचशे रुपये फक्त'
  } : {
    gramPanchayat: 'Pune',
    tahsil: 'Pune Gramin',
    jilha: 'Pune',
    pavtiKramank: '1',
    anuKramank: '001',
    malmattaKramank: 'MK-001',
    wardKramank: 'W-01',
    plotKramank: 'P-101',
    khasaraKramank: 'KK-001',
    surveyKramank: 'SK-001',
    khatedarkacheNav: 'Kundan Kotangale',
    patniMulacheNav: 'ABC PQR',
    bhogwatdaracheNav: 'JKL MNJ',
    gruhkarVBhumikarDinank: getTodayDate(),
    paniKarDinank: getTomorrowDate(),
    shera: 'या पावतीच्या आधारे करभरणा केलेली रक्कम माझ्याकडून मिळाली आणि ती ग्रामपंचायतीच्या खात्यात जमा केली गेली आहे.',
    gruhkarVBhumikar: { magilBaki: '500', chaluKar: '2000', ekunJamaRakkam: '2500', thakbakiRakkam: '0' },
    divabattiVizKar: { magilBaki: '200', chaluKar: '800', ekunJamaRakkam: '1000', thakbakiRakkam: '0' },
    aarogyaRakshanKar: { magilBaki: '150', chaluKar: '600', ekunJamaRakkam: '750', thakbakiRakkam: '0' },
    safaeKar: { magilBaki: '100', chaluKar: '400', ekunJamaRakkam: '500', thakbakiRakkam: '0' },
    samanyaPaniKar: { magilBaki: '300', chaluKar: '1200', ekunJamaRakkam: '1500', thakbakiRakkam: '0' },
    visheshPaniKar: { magilBaki: '250', chaluKar: '1000', ekunJamaRakkam: '1250', thakbakiRakkam: '0' },
    ekunRakkam: { magilBaki: '1500', chaluKar: '6000', ekunJamaRakkam: '7500', thakbakiRakkam: '0' },
    bharleliRakkamAkshari: 'तेरा हजार पंचवीस रुपये फक्त'
  };

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

  const handleDownloadPDF = async () => {
    try {
      const element = componentRef.current;
      if (!element) {
        alert('Content not found');
        return;
      }

      // Force light mode before capturing
      const originalHtmlClass = document.documentElement.className;
      const originalBodyClass = document.body.className;
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');

      // Create a canvas from the HTML element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Ensure cloned document is also in light mode
          clonedDoc.documentElement.classList.remove('dark');
          clonedDoc.body.classList.remove('dark');
          clonedDoc.documentElement.style.backgroundColor = '#ffffff';
          clonedDoc.body.style.backgroundColor = '#ffffff';
        }
      });

      // Restore original classes if needed
      document.documentElement.className = originalHtmlClass;
      document.body.className = originalBodyClass;

      // A4 dimensions in mm
      const pdfWidth = 210;

      // Margins matching print preview (10mm on all sides, as per @page margin: 10mm in handlePrint)
      const marginLeft = 10;
      const marginTop = 10;
      const marginRight = 10;

      // Content area after margins
      const contentWidth = pdfWidth - marginLeft - marginRight;

      // Calculate scaled dimensions to fit in content area
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF with margins
      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);

      // Save PDF
      pdf.save('करबद्दल_पावती.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF generation failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 print:p-0 print:bg-white">
      {/* Print and Download Buttons - Hidden when printing */}
      <div className="mb-4 print:hidden flex justify-end gap-4">
        <button
          onClick={handleDownloadPDF}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download PDF / पीडीएफ डाउनलोड करा
        </button>
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

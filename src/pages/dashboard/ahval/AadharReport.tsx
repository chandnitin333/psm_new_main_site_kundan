import { useState, useEffect, useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface WardData {
  wardNo: number;
  wardName: string;
  totalProperties: number;
  totalPopulation: number;
  aadharLinked: number;
}

interface AadharRecord {
  srNo: number;
  milkatNo: string;
  khateDharak: string;
  bhogwatdar: string;
  aadharNo: string;
  voterCard: string;
  panNo: string;
}

const AadharReport = () => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [wardData, setWardData] = useState<WardData | null>(null);
  const [aadharRecords, setAadharRecords] = useState<AadharRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.style.backgroundColor = '#ffffff';
    document.body.style.backgroundColor = '#ffffff';

    return () => {
      // Cleanup is optional - you can restore theme if needed
    };
  }, []);

  // Load ward data from sessionStorage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      const wardDataString = sessionStorage.getItem('aadharReportWard');
      if (wardDataString) {
        const data = JSON.parse(wardDataString);
        setWardData(data);

        // Generate 20 sample aadhar records for demo
        const records: AadharRecord[] = [];
        const recordCount = 20;
        for (let i = 1; i <= recordCount; i++) {
          const generatePAN = () => {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let pan = '';
            for (let j = 0; j < 5; j++) {
              pan += letters.charAt(Math.floor(Math.random() * letters.length));
            }
            pan += Math.floor(1000 + Math.random() * 9000);
            pan += letters.charAt(Math.floor(Math.random() * letters.length));
            return pan;
          };

          records.push({
            srNo: i,
            milkatNo: `${String(i).padStart(4, '0')}`,
            khateDharak: `खातेधारक ${i}`,
            bhogwatdar: `भोगवटदार ${i}`,
            aadharNo: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
            voterCard: `ABC${Math.floor(1000000 + Math.random() * 9000000)}`,
            panNo: generatePAN(),
          });
        }
        setAadharRecords(records);
      }

      setLoading(false);
    };
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

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

      // Margins matching print preview (10mm on all sides)
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
      pdf.save('आधार_कार्ड_यादी.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF generation failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">अहवाल लोड होत आहे... (Loading report...)</p>
        </div>
      </div>
    );
  }

  if (!wardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">प्रभाग माहिती सापडली नाही (Ward data not found)</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 print:p-0 print:bg-white">
        {/* Print and Download Buttons - Hidden in print */}
        <div className="mb-4 print:hidden flex justify-end gap-4">
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            पीडीएफ डाउनलोड करा
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            छपाई करा
          </button>
        </div>

        {/* Report Content */}
        <div ref={componentRef} className="max-w-6xl mx-auto bg-white dark:bg-gray-800 print:bg-white print:dark:bg-white p-8 print:p-4 shadow-lg print:shadow-none print:mt-8">
          {/* Header - Title */}
          <div className="text-center mb-2 print:mb-2">
            <h1 className="text-2xl print:text-lg font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
              आधार कार्ड व मतदार कार्ड यादी
            </h1>
          </div>

          {/* Header - Gram Panchayat */}
          <div className="text-center mb-2 print:mb-2">
            <h2 className="text-xl print:text-base font-semibold text-gray-900 dark:text-white print:text-black print:leading-tight">
              ग्रामपंचायत कार्यालय :- Kharadi
            </h2>
          </div>

          {/* Header - Tahsil, Jilha, Ward */}
          <div className="flex justify-between items-center mb-3 print:mb-2 text-gray-900 dark:text-white print:text-black print:text-sm">
            <div className="font-medium print:leading-tight">
              तहसील: Pune Gramin
            </div>
            <div className="font-medium text-center print:leading-tight">
              जिल्हा: Pune
            </div>
            <div className="font-medium print:leading-tight">
              प्रभाग क्रमांक: {wardData.wardNo}
            </div>
          </div>

          {/* Aadhar Records Table */}
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
                    खातेधारकाचे नाव
                  </th>
                  <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                    भोगवटदाराचे नाव
                  </th>
                  <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                    आधार कार्ड
                  </th>
                  <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                    मतदार कार्ड
                  </th>
                  <th className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-sm print:text-xs font-bold text-gray-900 dark:text-white print:text-black print:leading-tight">
                    पान नंबर
                  </th>
                </tr>
              </thead>
              <tbody>
                {aadharRecords.map((record) => (
                  <tr key={record.srNo}>
                    <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                      {record.srNo}
                    </td>
                    <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                      {record.milkatNo}
                    </td>
                    <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                      {record.khateDharak}
                    </td>
                    <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                      {record.bhogwatdar}
                    </td>
                    <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                      {record.aadharNo}
                    </td>
                    <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                      {record.voterCard}
                    </td>
                    <td className="border border-gray-900 dark:border-gray-300 print:border-black px-2 py-2 print:px-2 print:py-1 text-center text-gray-900 dark:text-white print:text-black print:text-xs print:leading-tight">
                      {record.panNo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .dark\\:bg-gray-800,
          .dark\\:bg-gray-900 {
            background-color: white !important;
          }
          .dark\\:bg-gray-700 {
            background-color: #f3f4f6 !important;
          }
          .dark\\:text-white,
          .dark\\:text-gray-100 {
            color: black !important;
          }
          .dark\\:border-gray-600,
          .dark\\:border-gray-700 {
            border-color: #ddd !important;
          }
        }
      `}</style>
    </>
  );
};

export default AadharReport;

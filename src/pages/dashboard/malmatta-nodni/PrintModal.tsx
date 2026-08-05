import { useEffect, useRef } from 'react';
import Modal from '../../../components/common/Modal';
import { FileText, File, Building2, Sparkles, Image as ImageIcon } from 'lucide-react';
import type { PrintModalProps } from '../../../interfaces/dashboard/malmatta-nodni/PrintModal.types';
import { can } from '../../../utils/permissions';

const PrintModal = ({ isOpen, onClose, record }: PrintModalProps) => {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus on first button when modal opens
  useEffect(() => {
    if (isOpen && firstButtonRef.current) {
      setTimeout(() => {
        firstButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handlePrint = (format: { id: string; title: string }) => {
    // Dedicated design pages (fetch full data by id)
    if (
      format.id === 'namuna8' || format.id === 'namuna9' ||
      format.id === 'sarkari8' || format.id === 'namuna8new' || format.id === 'namuna8images'
    ) {
      const id = (record as { id?: number } | undefined)?.id;
      if (id) {
        const path =
          format.id === 'namuna8' ? '/namuna-8-1'
          : format.id === 'sarkari8' ? '/namuna-8-sarkari-1'
          : format.id === 'namuna8new' ? '/namuna-8-new-1'
          : format.id === 'namuna8images' ? '/namuna-8-images-1'
          : '/namuna-9-1';
        window.open(`${path}?id=${id}`, '_blank');
      } else {
        alert('Record id not found');
      }
      return;
    }

    // Other formats: existing generic template (to be replaced later)
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReport(format.title, record));
      printWindow.document.close();
      printWindow.focus();
    }
    // Don't close the modal - keep it open for multiple prints
  };

  const generateReport = (namunaType: string, data: any) => {
    // Basic HTML template for the report
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${namunaType}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
            }
            body {
              font-family: 'Noto Sans Devanagari', Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 {
              font-size: 24px;
              margin: 10px 0;
            }
            .header h2 {
              font-size: 18px;
              margin: 5px 0;
              color: #333;
            }
            .content {
              margin: 20px 0;
            }
            .row {
              display: flex;
              margin-bottom: 15px;
            }
            .label {
              font-weight: bold;
              width: 200px;
            }
            .value {
              flex: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .footer {
              margin-top: 50px;
              border-top: 2px solid #000;
              padding-top: 20px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature {
              text-align: center;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>महाराष्ट्र राज्य</h1>
            <h2>${namunaType}</h2>
            <p>मालमत्ता नोंदणी</p>
          </div>

          <div class="content">
            <div class="row">
              <span class="label">अनु क्रमांक:</span>
              <span class="value">${data?.anuKramank || '-'}</span>
            </div>
            <div class="row">
              <span class="label">मालमत्ता नं:</span>
              <span class="value">${data?.milkatNo || '-'}</span>
            </div>
            <div class="row">
              <span class="label">वॉर्ड क्र.:</span>
              <span class="value">${data?.wardNo || '-'}</span>
            </div>
            <div class="row">
              <span class="label">खसरा नं:</span>
              <span class="value">${data?.khasaraNo || '-'}</span>
            </div>
            <div class="row">
              <span class="label">खातेदाराचे नाव:</span>
              <span class="value">${data?.khatedaracheNav || '-'}</span>
            </div>
            <div class="row">
              <span class="label">भोगवटदाराचे नाव:</span>
              <span class="value">${data?.bhogvatdaracheNav || '-'}</span>
            </div>
            <div class="row">
              <span class="label">पत्ता:</span>
              <span class="value">${data?.patta || '-'}</span>
            </div>
          </div>

          <div class="footer">
            <div class="signature-section">
              <div class="signature">
                <p>_____________________</p>
                <p>खातेदाराची सही</p>
              </div>
              <div class="signature">
                <p>_____________________</p>
                <p>अधिकाऱ्याची सही</p>
              </div>
            </div>
          </div>

          <script>
            // User can manually print using Ctrl+P or browser print button
          </script>
        </body>
      </html>
    `;
  };

  const allFormats = [
    {
      id: 'namuna8',
      title: 'नमुना 8',
      subtitle: 'Namuna 8',
      icon: FileText,
      color: 'blue',
      description: 'Standard format',
      module: 'report_namuna8',
    },
    {
      id: 'namuna9',
      title: 'नमुना 9',
      subtitle: 'Namuna 9',
      icon: File,
      color: 'green',
      description: 'Alternative format',
      module: 'report_namuna9',
    },
    {
      id: 'sarkari8',
      title: 'सरकारी 8 नमुना',
      subtitle: 'Sarkari 8 Namuna',
      icon: Building2,
      color: 'purple',
      description: 'Government format',
      module: 'report_sarkari8',
    },
    {
      id: 'namuna8new',
      title: 'नमुना 8 नवीन आवृत्ती',
      subtitle: 'Namuna 8 New Version',
      icon: Sparkles,
      color: 'orange',
      description: 'Latest version',
      module: 'report_namuna8_new',
    },
    {
      id: 'namuna8images',
      title: 'नमुना 8 चित्रे',
      subtitle: 'Namuna 8 Images',
      icon: ImageIcon,
      color: 'pink',
      description: 'With images',
      module: 'report_namuna8_images',
    },
  ];
  // Only show the reports this user is permitted to open (each has its own permission).
  const printFormats = allFormats.filter((f) => can(f.module, 'view'));

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      green: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
      orange: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      pink: 'bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 border-pink-200 dark:border-pink-800',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      purple: 'text-purple-600 dark:text-purple-400',
      orange: 'text-orange-600 dark:text-orange-400',
      pink: 'text-pink-600 dark:text-pink-400',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="प्रिंट नमुना निवडा (Select Print Format)"
      size="small"
    >
      <div className="grid grid-cols-1 gap-3">
        {printFormats.map((format, index) => {
          const Icon = format.icon;
          return (
            <button
              key={format.id}
              ref={index === 0 ? firstButtonRef : null}
              type="button"
              onClick={() => handlePrint(format)}
              className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all duration-200 ${getColorClasses(format.color)} focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
            >
              <div className={`flex-shrink-0 ${getIconColorClasses(format.color)}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white text-base">
                  {format.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {format.subtitle}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">
                {format.description}
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default PrintModal;

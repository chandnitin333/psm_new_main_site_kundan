import { FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPdf, type ExportColumn } from '../../utils/exportUtils';
import { can } from '../../utils/permissions';

/* Reusable Excel + PDF export buttons for any listing/report.
   Pass column defs (header + value(row)) and rows; buttons handle the rest.
   Marathi-safe: Excel via SheetJS, PDF via styled print-window (system Devanagari font).

   Per-page permission: pass moduleKey -> buttons render only if can(moduleKey,'export')
   (super_user / full-access always). Add moduleKey on EVERY page that uses export. */

interface Props<T> {
  columns: ExportColumn<T>[];
  rows: T[];
  filename: string;      // base name (no extension)
  title: string;         // report heading (PDF + Excel title row)
  subtitle?: string;     // e.g. GP name / year / filters
  landscape?: boolean;   // PDF orientation for wide tables
  size?: 'sm' | 'md';
  disabled?: boolean;
  moduleKey?: string;    // permission module — gates export via can(moduleKey,'export')
}

function ExportButtons<T>({ columns, rows, filename, title, subtitle, landscape, size = 'sm', disabled, moduleKey }: Props<T>) {
  // per-page export permission (super_user / full-access always pass inside can())
  if (moduleKey && !can(moduleKey, 'export')) return null;
  const isDisabled = disabled || rows.length === 0;
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const doExcel = () => exportToExcel({ filename, title, columns, rows });
  const doPdf = () => exportToPdf({ title, subtitle, columns, rows, landscape });

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={doExcel} disabled={isDisabled}
        className={`flex items-center gap-1.5 rounded-lg border border-emerald-300 font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20 ${pad}`}
        title="Excel मध्ये डाउनलोड करा">
        <FileSpreadsheet className={icon} /> Excel
      </button>
      <button type="button" onClick={doPdf} disabled={isDisabled}
        className={`flex items-center gap-1.5 rounded-lg border border-rose-300 font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/20 ${pad}`}
        title="PDF मध्ये डाउनलोड करा (Save as PDF)">
        <FileText className={icon} /> PDF
      </button>
    </div>
  );
}

export default ExportButtons;

/**
 * Reusable table export — Excel (.xlsx) + PDF.
 *  - Excel: SheetJS (json/aoa) — Unicode/Marathi safe, real .xlsx download.
 *  - PDF:  styled print-window via a hidden iframe — perfect Devanagari (system fonts),
 *          no heavy font embedding. User's print dialog -> "Save as PDF".
 * Column.value(row) lets callers format/derive any cell.
 */
import * as XLSX from 'xlsx';

export interface ExportColumn<T = Record<string, unknown>> {
  header: string;
  value: (row: T) => string | number | null | undefined;
  width?: number; // excel column width (chars)
}

const cell = (v: string | number | null | undefined): string =>
  v === null || v === undefined ? '' : String(v);

/** Download rows as a real .xlsx file. Optional title becomes the first sheet row. */
export function exportToExcel<T>(opts: {
  filename: string;
  sheetName?: string;
  title?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}): void {
  const { filename, sheetName = 'Sheet1', title, columns, rows } = opts;
  const header = columns.map((c) => c.header);
  const body = rows.map((r) => columns.map((c) => c.value(r) ?? ''));
  const aoa: (string | number)[][] = [];
  if (title) aoa.push([title]);
  aoa.push(header, ...body.map((row) => row.map((v) => (v === null || v === undefined ? '' : (v as string | number)))));

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = columns.map((c) => ({ wch: c.width || Math.max(12, c.header.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Open a styled, print-ready page in a hidden iframe and trigger print (Save as PDF). */
export function exportToPdf<T>(opts: {
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  landscape?: boolean;
}): void {
  const { title, subtitle, columns, rows, landscape } = opts;
  const thead = `<tr>${columns.map((c) => `<th>${esc(c.header)}</th>`).join('')}</tr>`;
  const tbody = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${esc(cell(c.value(r)))}</td>`).join('')}</tr>`)
    .join('');

  const printedOn = new Date().toLocaleString('en-GB');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>
    @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 12mm 10mm; }
    * { font-family: 'Noto Sans Devanagari', 'Mangal', 'Nirmala UI', Arial, sans-serif; box-sizing: border-box; }
    body { margin: 0; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1 { font-size: 16px; margin: 0 0 2px; text-align: center; }
    .sub { font-size: 11px; color: #555; text-align: center; margin: 0 0 10px; }
    /* separate mode + border-spacing 0 + every cell draws all 4 borders → each grid line
       (incl. the last row / outer edges) is drawn by the cells themselves, so Chrome print
       never clips or drops it (border-collapse merged them into one droppable border). */
    table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; }
    th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; vertical-align: top; }
    thead { display: table-header-group; }         /* repeat header on every page */
    tr { page-break-inside: avoid; }               /* don't split a row (cuts its border) */
    thead th { background: #f0f0f0; font-weight: 700; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tfoot td { font-size: 9px; color: #888; border: none; padding-top: 8px; }
  </style></head><body>
    <h1>${esc(title)}</h1>
    ${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ''}
    <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    <p style="font-size:9px;color:#999;margin-top:8px">एकूण नोंदी: ${rows.length} · मुद्रित: ${esc(printedOn)}</p>
  </body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => { try { document.body.removeChild(iframe); } catch { /* noop */ } };
  iframe.onload = () => {
    const w = iframe.contentWindow;
    if (!w) { cleanup(); return; }
    w.focus();
    w.print();
    // remove after the dialog is dismissed (best-effort)
    setTimeout(cleanup, 60000);
    w.onafterprint = cleanup;
  };
}

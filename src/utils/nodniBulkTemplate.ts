/**
 * Bulk nodni import — Excel (.xlsx) template + parse + failed-rows export.
 * Only RAW input fields (no tax / auto-calculation / nested modal tables).
 * Choice (radio) fields get real Excel dropdowns via ExcelJS data-validation.
 */
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

export interface BulkColumn { field: string; header: string; }

// order = template column order. header = Marathi label shown in Excel.
export const NODNI_BULK_COLUMNS: BulkColumn[] = [
  { field: 'malmatta_number', header: 'मालमत्ता क्रमांक' },
  { field: 'ward_kramnak', header: 'वॉर्ड क्रमांक' },
  { field: 'plot_number', header: 'प्लॉट क्रमांक' },
  { field: 'khasara_number', header: 'खसरा नंबर' },
  { field: 'survey_number', header: 'सर्वे क्रमांक' },
  { field: 'ghar_malkache_nav', header: 'घरमालकाचे नाव*' },
  { field: 'patni_mulache_nav', header: 'पत्नी/मुलांचे नाव' },
  { field: 'bhogavat_darache_nav', header: 'भोगवटदाराचे नाव' },
  { field: 'patta_nagar_layout_society', header: 'पत्ता' },
  { field: 'mobile_number', header: 'मोबाईल (१० अंकी)' },
  { field: 'aadahar_card_number', header: 'आधार (१२ अंकी)' },
  { field: 'matdar_card_number', header: 'मतदार कार्ड (ABC1234567)' },
  { field: 'milkat_prakar', header: 'मिलकत प्रकार' },
  { field: 'vanijya_prakar', header: 'वाणिज्य प्रकार' },
  { field: 'pinyacha_panyachi_vyavastha', header: 'पाणी व्यवस्था' },
  { field: 'ghari_souychalaya', header: 'शौचालय' },
  { field: 'imarat_kiva_mokdi_jaga', header: 'दळण/इतर वापर' },
  { field: 'imarat_jamin_keval_dharmik_shekshink', header: 'धार्मिक/शैक्षणिक' },
  { field: 'bhogvatdar_sarkarsasan_dalatil', header: 'शौर्य/सेवा पदक' },
  { field: 'shaskiy_samajik_sevanivrut_imarat', header: 'शासकीय/सामाजिक सूट' },
  { field: 'purv', header: 'पूर्वेस' },
  { field: 'paschim', header: 'पश्चिमेस' },
  { field: 'uttar', header: 'उत्तरेस' },
  { field: 'dakshin', header: 'दक्षिणेस' },
  { field: 'lambi', header: 'लांबी' },
  { field: 'rundi', header: 'रुंदी' },
  { field: 'shetrafal_choras_foot', header: 'क्षेत्रफळ (चौ.फूट)' },
];

// dropdown (radio) fields → allowed values
const YESNO = ['होय', 'नाही'];
export const NODNI_CHOICES: Record<string, string[]> = {
  milkat_prakar: ['अधिकृत', 'इमलाकार', 'घरकुल', 'घर कर लावायचे'],
  vanijya_prakar: ['औद्योगिक', 'मनोरा'],
  pinyacha_panyachi_vyavastha: ['हातपंप', 'विहीर', 'सार्वजनिक नळ', 'घरी नळ', 'नाही'],
  ghari_souychalaya: YESNO,
  imarat_kiva_mokdi_jaga: YESNO,
  imarat_jamin_keval_dharmik_shekshink: YESNO,
  bhogvatdar_sarkarsasan_dalatil: YESNO,
  shaskiy_samajik_sevanivrut_imarat: YESNO,
};

const norm = (h: string) => String(h).replace(/\*/g, '').replace(/\(.*?\)/g, '').trim();
const HEADER_TO_FIELD: Record<string, string> = {};
NODNI_BULK_COLUMNS.forEach((c) => { HEADER_TO_FIELD[norm(c.header)] = c.field; });

const DEMO_ROWS: Record<string, string>[] = [
  {
    malmatta_number: '101', ward_kramnak: '1', plot_number: '12',
    khasara_number: '45/2', survey_number: '78', ghar_malkache_nav: 'रमेश सुरेश पाटील',
    patni_mulache_nav: 'सुनीता रमेश पाटील', bhogavat_darache_nav: 'रमेश सुरेश पाटील',
    patta_nagar_layout_society: 'मु.पो. बोरखेडी, ता. जि. नागपूर', mobile_number: '9876543210',
    aadahar_card_number: '123456789012', matdar_card_number: 'ABC1234567', milkat_prakar: 'घरकुल',
    vanijya_prakar: '', pinyacha_panyachi_vyavastha: 'घरी नळ', ghari_souychalaya: 'होय',
    imarat_kiva_mokdi_jaga: 'नाही', imarat_jamin_keval_dharmik_shekshink: 'नाही',
    bhogvatdar_sarkarsasan_dalatil: 'नाही', shaskiy_samajik_sevanivrut_imarat: 'नाही',
    purv: 'रस्ता', paschim: 'शेत', uttar: 'घर क्र. 100', dakshin: 'नाला',
    lambi: '40', rundi: '30', shetrafal_choras_foot: '1200',
  },
  {
    malmatta_number: '102', ward_kramnak: '1', plot_number: '13',
    khasara_number: '46', survey_number: '79', ghar_malkache_nav: 'निखिल भगत',
    patni_mulache_nav: 'प्रिया भगत', bhogavat_darache_nav: 'निखिल भगत',
    patta_nagar_layout_society: 'मु.पो. बोरखेडी, ता. जि. नागपूर', mobile_number: '9822012345',
    aadahar_card_number: '987654321012', matdar_card_number: 'XYZ7654321', milkat_prakar: 'इमलाकार',
    vanijya_prakar: 'औद्योगिक', pinyacha_panyachi_vyavastha: 'विहीर', ghari_souychalaya: 'नाही',
    imarat_kiva_mokdi_jaga: 'होय', imarat_jamin_keval_dharmik_shekshink: 'नाही',
    bhogvatdar_sarkarsasan_dalatil: 'नाही', shaskiy_samajik_sevanivrut_imarat: 'नाही',
    purv: 'घर क्र. 101', paschim: 'रस्ता', uttar: 'मंदिर', dakshin: 'शेत',
    lambi: '35', rundi: '25', shetrafal_choras_foot: '875',
  },
];

const colLetter = (n: number): string => { // 1-based -> A, B, ... AA
  let s = ''; let x = n;
  while (x > 0) { const m = (x - 1) % 26; s = String.fromCharCode(65 + m) + s; x = Math.floor((x - 1) / 26); }
  return s;
};

const triggerDownload = (buf: ArrayBuffer, name: string) => {
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Download the template — header + demo rows + dropdowns for choice fields. */
export const downloadNodniTemplate = async (): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('नोंदणी');
  ws.columns = NODNI_BULK_COLUMNS.map((c) => ({ header: c.header, key: c.field, width: Math.max(14, c.header.length + 2) }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { horizontal: 'center', wrapText: true };
  DEMO_ROWS.forEach((r) => ws.addRow(r));

  // dropdowns on choice columns for rows 2..1000
  const LAST = 1000;
  NODNI_BULK_COLUMNS.forEach((c, i) => {
    const opts = NODNI_CHOICES[c.field];
    if (!opts) return;
    const L = colLetter(i + 1);
    for (let row = 2; row <= LAST; row++) {
      ws.getCell(`${L}${row}`).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`"${opts.join(',')}"`],
        showErrorMessage: true, error: 'सूचीतील पर्याय निवडा', errorTitle: 'चुकीचे मूल्य',
      };
    }
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  triggerDownload(buf as ArrayBuffer, 'nodni-template.xlsx');
};

/** Parse an uploaded xlsx/csv into rows keyed by backend field names. */
export const parseNodniFile = async (file: File): Promise<Record<string, string>[]> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const rows: Record<string, string>[] = [];
  for (const r of raw) {
    const out: Record<string, string> = {};
    let any = false;
    for (const [k, v] of Object.entries(r)) {
      const field = HEADER_TO_FIELD[norm(k)];
      if (!field) continue;
      const val = v == null ? '' : String(v).trim();
      out[field] = val;
      if (val) any = true;
    }
    if (any) rows.push(out);
  }
  return rows;
};

export interface FailedRow { _row: number; reason: string; data: Record<string, unknown>; }

/** Download the failed rows (original columns + reason) as xlsx. */
export const downloadFailedNodni = (failed: FailedRow[]): void => {
  const rows = failed.map((f) => {
    const o: Record<string, string> = { 'ओळ क्र.': String(f._row) };
    NODNI_BULK_COLUMNS.forEach((c) => { o[c.header] = String((f.data?.[c.field] ?? '') as string); });
    o['कारण (Error)'] = f.reason;
    return o;
  });
  const header = ['ओळ क्र.', ...NODNI_BULK_COLUMNS.map((c) => c.header), 'कारण (Error)'];
  const ws = XLSX.utils.json_to_sheet(rows, { header });
  ws['!cols'] = header.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'अयशस्वी');
  XLSX.writeFile(wb, 'failed-nodni.xlsx');
};

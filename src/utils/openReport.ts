/**
 * Open a report in a new tab only if data exists.
 *
 * Opens a blank tab synchronously (preserves the user-gesture so popup blockers
 * don't kick in), then fetches/filters the records. If there is data, it stores
 * the params in sessionStorage and navigates the tab to the report URL; otherwise
 * it closes the tab and calls onEmpty (show a toast).
 */
import { trackAction } from './tracker';

// Marathi names for the report URLs (for human-readable tracking)
const REPORT_NAMES: Record<string, string> = {
  '/view-bill-129-1': 'कराची मागणी पावती १२९(१)',
  '/view-bill-129-2': 'कराची मागणी पावती १२९(२)',
  '/namuna-8-1': 'नमुना ८',
  '/namuna-8-sarkari-1': 'नमुना ८ (सरकारी)',
  '/namuna-8-new-1': 'नमुना ८ (नवीन)',
  '/namuna-8-images-1': 'नमुना ८ (फोटोसह)',
  '/namuna-9-1': 'नमुना ९',
  '/view-aadhar-report': 'आधार यादी अहवाल',
  '/view-mobile-report': 'मोबाईल क्रमांक अहवाल',
  '/view-pani-report': 'पिण्याचे पाणी अहवाल',
  '/view-shouchalay-report': 'शौचालय अहवाल',
  '/view-dharkachi-yadi': 'मालमत्ता धारकाची यादी',
  '/view-namuna8-anukramika': 'नमुना ८ अनुक्रमणिका',
  '/view-namuna8-multi': 'नमुना ८ (एकत्रित)',
  '/view-namuna8-new-multi': 'नमुना ८ नवीन (एकत्रित)',
  '/view-namuna8-images-multi': 'नमुना ८ फोटो (एकत्रित)',
  '/view-namuna8-ghosvara': 'नमुना ८ घोषवारा',
  '/view-namuna8-sarkari-multi': 'नमुना ८ सरकारी (एकत्रित)',
  '/view-namuna9-anukramika': 'नमुना ९ अनुक्रमणिका',
  '/view-namuna9-multi': 'नमुना ९ (एकत्रित)',
  '/view-namuna9-new-multi': 'नमुना ९ नवीन (एकत्रित)',
  '/view-namuna9-ghosvara': 'नमुना ९ घोषवारा',
  '/view-imlakar': 'इमला कर अहवाल',
  '/view-imlakar-anukramika': 'इमला कर अनुक्रमणिका',
  '/water-meter-report': 'पाणी मीटर बिल / अहवाल (एकत्रित)',
};

// Marathi labels for the selection params carried in sessionValue
const PARAM_LABELS: Record<string, string> = {
  ward: 'वॉर्ड क्र.',
  wardNo: 'वॉर्ड क्र.',
  year: 'वर्ष',
  toYear: 'ते वर्ष',
  bharna: 'भरणा (दिवस)',
  type: 'यादी प्रकार',
  namuna: 'नमुना प्रकार',
  startDate: 'देयक दिनांक',
  endDate: 'अंतिम दिनांक',
  prakar: 'प्रकार',
};

// Build a human Marathi sentence from whatever the user selected for the report.
function describeSelection(p: unknown): string {
  if (!p || typeof p !== 'object') return '';
  const o = p as Record<string, unknown>;
  const parts: string[] = [];
  const has = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== '';

  // anu kramank range first (start/end belong together)
  if (has(o.start) || has(o.end)) {
    parts.push(`अनु क्रमांक: ${has(o.start) ? o.start : '?'} ते ${has(o.end) ? o.end : '?'}`);
  }
  for (const [k, v] of Object.entries(o)) {
    if (k === 'start' || k === 'end') continue;
    if (!has(v)) continue;
    const label = PARAM_LABELS[k];
    if (label) parts.push(`${label}: ${v}`);
  }
  return parts.length ? ' — निवड: ' + parts.join(', ') : '';
}

export async function openReportIfData<T>(opts: {
  fetcher: () => Promise<T[]>;
  url: string;
  sessionKey: string;
  sessionValue: unknown;
  onEmpty: () => void;
  onError?: () => void;
}): Promise<void> {
  // Store params BEFORE opening the tab. A tab opened via window.open inherits a
  // snapshot of the opener's sessionStorage at open-time; values written afterwards
  // are NOT visible to it. Setting first guarantees the report tab can read them.
  sessionStorage.setItem(opts.sessionKey, JSON.stringify(opts.sessionValue));
  const win = window.open('', '_blank');
  try {
    const data = await opts.fetcher();
    if (!data || data.length === 0) {
      win?.close();
      opts.onEmpty();
      return;
    }
    const reportName = REPORT_NAMES[opts.url] || opts.url;
    trackAction(
      `"${reportName}" अहवाल तयार करून पाहिला${describeSelection(opts.sessionValue)}`,
      { report: reportName, url: opts.url, params: opts.sessionValue }
    );
    if (win) win.location.href = opts.url;
    else window.open(opts.url, '_blank');
  } catch (e) {
    console.error('openReportIfData failed', e);
    win?.close();
    (opts.onError || opts.onEmpty)();
  }
}

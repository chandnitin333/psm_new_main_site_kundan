/**
 * ग्राम सहायक — rule-based guided assistant (NO LLM / no OpenAI).
 * Each "flow" = a task. Navigation flows just go to a page. Report flows ask for
 * a few params step-by-step (namuna → ward → year → range) and then open the
 * report exactly like the existing Ahval launchers (openReportIfData).
 */
import { openReportIfData } from '../../utils/openReport';
import { nodniService } from '../../services';

export type StepType = 'options' | 'ward' | 'year' | 'number' | 'text';

export interface FlowStep {
  key: string;
  prompt: string;                              // bot question (Marathi)
  type: StepType;
  options?: { label: string; value: string }[]; // for type 'options'
  optional?: boolean;                          // user can skip
  skipLabel?: string;                          // custom label for the skip button (default "वगळा")
}

export interface RunCtx {
  navigate: (to: string) => void;
  toastError: (m: string) => void;
}

export interface Flow {
  id: string;
  label: string;     // menu button text
  icon: string;      // emoji
  keywords: string[]; // free-text match (lowercase substrings)
  steps: FlowStep[];
  /** permission module key (must match utils/permissions). Omit for always-visible.
   *  Certificates are special-cased in the widget via canAnyCertificate(). */
  module?: string;
  run: (answers: Record<string, string>, ctx: RunCtx) => Promise<string> | string;
}

type AnyRow = Record<string, unknown>;

// ---- Namuna 8 / 9 report maps (mirrors the Ahval launchers) ----
const NAMUNA8 = [
  { value: 'namuna8_anukramnika', label: 'नमुना 8 अनुक्रमणिका', url: '/view-namuna8-anukramika', key: 'anukramikaParams' },
  { value: 'namuna8', label: 'नमुना 8', url: '/view-namuna8-multi', key: 'namuna8Params' },
  { value: 'namuna8_new', label: 'नमुना 8 न्यू', url: '/view-namuna8-new-multi', key: 'namuna8NewParams' },
  { value: 'namuna8_images', label: 'नमुना 8 इमेजेस', url: '/view-namuna8-images-multi', key: 'namuna8ImagesParams' },
  { value: 'namuna8_ghoshwara', label: 'नमुना 8 घोषवारा', url: '/view-namuna8-ghosvara', key: 'ghosvaraParams' },
  { value: 'sarkari_namuna8', label: 'सरकारी नमुना 8', url: '/view-namuna8-sarkari-multi', key: 'sarkari8Params' },
];

const NAMUNA9 = [
  { value: 'namuna9_anukramnika', label: 'नमुना 9 अनुक्रमणिका', url: '/view-namuna9-anukramika', key: 'namuna9AnukramikaParams' },
  { value: 'namuna9', label: 'नमुना 9', url: '/view-namuna9-multi', key: 'namuna9Params' },
  { value: 'namuna9_new', label: 'नमुना 9 न्यू', url: '/view-namuna9-new-multi', key: 'namuna9NewParams' },
  { value: 'namuna9_ghoshwara_new', label: 'नमुना 9 घोषवारा न्यू', url: '/view-namuna9-ghosvara', key: 'namuna9GhosvaraParams' },
];

// shared opener for namuna 8/9 (both read the same property list)
const openNamuna = (
  list: typeof NAMUNA8,
  a: Record<string, string>,
  ctx: RunCtx,
): string => {
  const t = list.find((x) => x.value === a.namuna);
  if (!t) { ctx.toastError('नमुना निवडला नाही'); return 'कृपया नमुना निवडा.'; }
  // optional range "1-50" -> start/end (empty = whole list)
  let start = '', end = '';
  if (a.range && a.range.trim()) {
    const parts = a.range.replace(/[^0-9-]/g, '').split('-');
    start = (parts[0] || '').trim();
    end = (parts[1] || '').trim();
  }
  openReportIfData({
    fetcher: async () => {
      const res = await nodniService.getDharkachiYadi(a.ward, start, end, '', a.year);
      return (res.success ? (res.data as AnyRow[]) : []) || [];
    },
    url: t.url,
    sessionKey: t.key,
    sessionValue: {
      ward: a.ward || '', start, end, year: a.year || '',
      side: '', orientation: '',
    },
    onEmpty: () => ctx.toastError('या निवडीसाठी माहिती उपलब्ध नाही (No data found)'),
  });
  return `✅ ${t.label} उघडत आहे... (नवीन टॅबमध्ये)`;
};

// ward-based list reports (Aadhar / Mobile / Pani / Shouchalay): pick ward -> open
const openWardReport = (key: string, url: string, label: string): Flow['run'] =>
  (a, ctx) => {
    if (!a.ward) { ctx.toastError('कृपया वॉर्ड निवडा'); return 'वॉर्ड आवश्यक आहे.'; }
    sessionStorage.setItem(key, String(a.ward));
    window.open(url, '_blank');
    return `✅ ${label} (वॉर्ड ${a.ward}) नवीन टॅबमध्ये उघडत आहे...`;
  };

const wardStep: FlowStep[] = [
  { key: 'ward', prompt: 'वॉर्ड क्रमांक निवडा', type: 'ward' },
];

const reportSteps = (namunaOptions: { label: string; value: string }[]): FlowStep[] => [
  { key: 'namuna', prompt: 'कोणता अहवाल?', type: 'options', options: namunaOptions },
  { key: 'ward', prompt: 'वॉर्ड क्रमांक निवडा', type: 'ward', optional: true, skipLabel: 'सर्व वॉर्ड' },
  { key: 'year', prompt: 'वर्ष निवडा', type: 'year' },
  // single optional step: type a range like "1-50", or skip = view whole report
  { key: 'range', prompt: 'अनु.क्र. श्रेणी हवी? (उदा. 1-50) — किंवा थेट अहवाल पहा', type: 'text', optional: true, skipLabel: '📄 अहवाल पहा' },
];

// navigation helper
const goto = (route: string, name: string): Flow['run'] => (_a, ctx) => {
  ctx.navigate(route);
  return `✅ ${name} उघडत आहे...`;
};

export const FLOWS: Flow[] = [
  // ---- Reports ----
  {
    id: 'namuna8', label: 'नमुना 8 अहवाल', icon: '📄', module: 'ahval_namuna8',
    keywords: ['namuna 8', 'namuna8', 'नमुना 8', 'नमुना ८', 'namuna aath'],
    steps: reportSteps(NAMUNA8.map(({ label, value }) => ({ label, value }))),
    run: (a, ctx) => openNamuna(NAMUNA8, a, ctx),
  },
  {
    id: 'namuna9', label: 'नमुना 9 अहवाल', icon: '📄', module: 'ahval_namuna9',
    keywords: ['namuna 9', 'namuna9', 'नमुना 9', 'नमुना ९', 'namuna nau'],
    steps: reportSteps(NAMUNA9.map(({ label, value }) => ({ label, value }))),
    run: (a, ctx) => openNamuna(NAMUNA9, a, ctx),
  },

  // ---- Ward-wise list reports ----
  {
    id: 'aadhar', label: 'आधार यादी', icon: '🆔', module: 'ahval_aadhar_list',
    keywords: ['aadhar', 'aadhaar', 'आधार', 'adhar'],
    steps: wardStep,
    run: openWardReport('aadharReportWard', '/view-aadhar-report', 'आधार यादी'),
  },
  {
    id: 'mobile', label: 'मोबाईल क्रमांक यादी', icon: '📞', module: 'ahval_mobile_list',
    keywords: ['mobile', 'मोबाईल', 'मोबाइल', 'mobail'],
    steps: wardStep,
    run: openWardReport('mobileReportWard', '/view-mobile-report', 'मोबाईल यादी'),
  },
  {
    id: 'pani', label: 'पिण्याचे पाणी यादी', icon: '💧', module: 'ahval_pani_list',
    keywords: ['pani', 'पाणी', 'water', 'panyachi'],
    steps: wardStep,
    run: openWardReport('paniReportWard', '/view-pani-report', 'पाणी यादी'),
  },
  {
    id: 'shouchalay', label: 'शौचालय यादी', icon: '🚻', module: 'ahval_shouchalay_list',
    keywords: ['shouchalay', 'शौचालय', 'toilet', 'sauchalay'],
    steps: wardStep,
    run: openWardReport('shouchalayReportWard', '/view-shouchalay-report', 'शौचालय यादी'),
  },

  // ---- Navigation (no steps) ----
  { id: 'nav-dashboard', label: 'डॅशबोर्ड', icon: '📊', module: 'dashboard', keywords: ['dashboard', 'डॅशबोर्ड', 'home'], steps: [], run: goto('/dashboard', 'डॅशबोर्ड') },
  { id: 'nav-malmatta', label: 'मालमत्ता नोंदणी', icon: '🏠', module: 'malmatta_nodni', keywords: ['malmatta', 'मालमत्ता', 'property', 'nodni list'], steps: [], run: goto('/malmatta-nodni', 'मालमत्ता नोंदणी') },
  { id: 'nav-nodni-form', label: 'नवीन नोंदणी', icon: '➕', module: 'nodni_form', keywords: ['nodni form', 'नवीन नोंदणी', 'add property', 'naya'], steps: [], run: goto('/nodni-form', 'नोंदणी फॉर्म') },
  { id: 'nav-vasuli', label: 'वसुली', icon: '💰', module: 'vasuli', keywords: ['vasuli', 'वसुली', 'collection', 'tax'], steps: [], run: goto('/vasuli', 'वसुली') },
  { id: 'nav-daybook', label: 'दैनिक वसुली रजिस्टर', icon: '📖', module: 'vasuli_daybook', keywords: ['daybook', 'register', 'दैनिक', 'रजिस्टर', 'cashbook'], steps: [], run: goto('/collection-daybook', 'दैनिक रजिस्टर') },
  { id: 'nav-collection', label: 'फिरती वसुली', icon: '📱', module: 'vasuli_field', keywords: ['firti', 'फिरती', 'field collection', 'mobile vasuli'], steps: [], run: goto('/collection-mode', 'फिरती वसुली') },
  { id: 'nav-certificates', label: 'प्रमाणपत्रे', icon: '🏅', keywords: ['certificate', 'pramanpatra', 'प्रमाणपत्र', 'dakhla'], steps: [], run: goto('/certificates', 'प्रमाणपत्रे') },
  { id: 'nav-ferfar', label: 'मालमत्ता फेरफार', icon: '🔁', module: 'malmatta_ferfar', keywords: ['ferfar', 'फेरफार', 'transfer'], steps: [], run: goto('/malmatta-ferfar', 'मालमत्ता फेरफार') },
];

/** Find a flow by free-text (keyword substring match) within a given list. */
export const matchFlow = (text: string, list: Flow[] = FLOWS): Flow | undefined => {
  const t = text.toLowerCase().trim();
  if (!t) return undefined;
  return list.find((f) => f.keywords.some((k) => t.includes(k.toLowerCase())));
};

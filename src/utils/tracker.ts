/**
 * Mixpanel-style frontend event tracker.
 *
 * Captures what the logged-in user does — page views, clicks, and explicit
 * actions — and ships them (batched) to POST /main/tracking/track. The admin
 * "User Tracking" dashboard reads these back.
 *
 * api_logs (API tracking) is separate; this is pure UX/behaviour tracking.
 */
import { api } from '../services/api';

type EventType = 'page_view' | 'click' | 'action' | 'custom';

interface TrackEvent {
  event_type: EventType;
  event_name: string;
  page_path?: string;
  element?: string;
  user_name?: string;
  session_id: string;
  meta?: Record<string, unknown>;
}

// Human (Marathi) names for every route — used for readable page_view events.
const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'डॅशबोर्ड',
  '/nodni-form': 'नोंदणी फॉर्म',
  '/malmatta-nodni': 'मालमत्ता नोंदणी',
  '/malmatta-ferfar': 'मालमत्ता फेरफार',
  '/malmatta-ferfar/ferfar-form': 'फेरफार फॉर्म',
  '/malmatta-ferfar/pdf-management': 'फेरफार PDF व्यवस्थापन',
  '/kar-aakarani': 'कर आकारणी',
  '/vasuli': 'वसुली',
  '/vasuli/vasuli-form': 'वसुली फॉर्म',
  '/view-vasuli': 'वसुली पावती',
  '/ahval': 'अहवाल',
  '/ahval/aadhar-list': 'आधार यादी',
  '/ahval/mobile-list': 'मोबाईल क्रमांक यादी',
  '/ahval/pani-list': 'पिण्याचे पाणी यादी',
  '/ahval/shouchalay-list': 'शौचालय यादी',
  '/ahval/malmatta-durusti': 'मालमत्ता दुरुस्ती यादी',
  '/ahval/namuna8': 'नमुना ८',
  '/ahval/namuna9': 'नमुना ९',
  '/ahval/bill-ward': 'करांच्या मागणीचे बिल (प्रभाग)',
  '/ahval/namuna10': 'नमुना १०',
  '/ahval/imla-kar': 'इमला कर',
  '/profile': 'प्रोफाइल',
  '/change-password': 'पासवर्ड बदला',
  '/components': 'घटक (Components)',
  '/dashboard/chalu-khatedar': 'चालू खातेदार',
  '/dashboard/adhikrut': 'अधिकृत',
  '/dashboard/indira-awas': 'इंदिरा आवास',
  '/dashboard/imlakar': 'इमलाकर',
  '/dashboard/ghar-kar': 'घर कर',
  '/dashboard/audogyik': 'औद्योगिक',
  '/dashboard/manora': 'मनोरा',
};

export const pageName = (path: string): string => {
  if (PAGE_NAMES[path]) return PAGE_NAMES[path];
  // /dashboard/category/123 etc.
  if (path.startsWith('/dashboard/category')) return 'वर्ग तपशील';
  return path;
};

let queue: TrackEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

const isAuthed = () => !!localStorage.getItem('accessToken');

const sessionId = (): string => {
  let id = sessionStorage.getItem('track_sid');
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    sessionStorage.setItem('track_sid', id);
  }
  return id;
};

const userName = (): string | undefined => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u?.email || u?.username || undefined;
  } catch {
    return undefined;
  }
};

const flush = async () => {
  if (!queue.length || !isAuthed()) return;
  const batch = queue;
  queue = [];
  try {
    await api.post('/main/tracking/track', { events: batch });
  } catch {
    // drop on failure (best-effort tracking — never block the UI)
  }
};

const enqueue = (ev: Omit<TrackEvent, 'session_id' | 'user_name'>) => {
  if (!isAuthed()) return;
  queue.push({ ...ev, session_id: sessionId(), user_name: userName() });
  if (queue.length >= 12) flush();
};

export const trackPageView = (path: string) =>
  enqueue({ event_type: 'page_view', event_name: `${pageName(path)} पान पाहिले`, page_path: path });

// Force-send queued events immediately (e.g. just before logout clears the token).
export const flushTracker = () => flush();

export const trackClick = (label: string, path: string) =>
  enqueue({ event_type: 'click', event_name: `Click: ${label}`, element: label, page_path: path });

// For explicit business actions (create/update/delete/pdf/report ...)
export const trackAction = (name: string, meta?: Record<string, unknown>) =>
  enqueue({ event_type: 'action', event_name: name, element: name, page_path: window.location.pathname, meta });

// Start the periodic flush + flush-on-hide. Safe to call once at app start.
export const initTracker = () => {
  if (timer) return;
  timer = setInterval(flush, 4000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
};

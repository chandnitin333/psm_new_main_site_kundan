/**
 * Dynamic branding — admin-set brand name + fonts (English + Marathi), applied
 * to the whole site. Fonts use per-glyph fallback: font-family "English","Marathi"
 * makes Latin text use the English font and Devanagari text the Marathi font.
 */
import { useSyncExternalStore } from 'react';
import { config } from '../config';

export interface Branding { name: string; font_en: string; font_mr: string; }

const DEFAULT: Branding = { name: 'Gram Vikas', font_en: 'Inter', font_mr: 'Noto Sans Devanagari' };
const STORAGE_KEY = 'brand_config';

let current: Branding = DEFAULT;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const getBranding = (): Branding => current;
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

/** React hook — re-renders when branding changes. */
export const useBranding = (): Branding => useSyncExternalStore(subscribe, getBranding, getBranding);

// --- Google Fonts loading (per-family <link>, once) ---
const loaded = new Set<string>();
const loadFont = (family: string) => {
  if (!family || loaded.has(family)) return;
  loaded.add(family);
  const id = 'gf-' + family.replace(/\s+/g, '-').toLowerCase();
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.trim().replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

const applyBranding = (b: Branding) => {
  current = b;
  loadFont(b.font_en);
  loadFont(b.font_mr);
  document.documentElement.style.setProperty('--app-font', `"${b.font_en}", "${b.font_mr}", system-ui, -apple-system, sans-serif`);
  notify();
};

const normalize = (x: unknown): Branding | null => {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim() : DEFAULT.name;
  const font_en = typeof o.font_en === 'string' && o.font_en.trim() ? o.font_en.trim() : DEFAULT.font_en;
  const font_mr = typeof o.font_mr === 'string' && o.font_mr.trim() ? o.font_mr.trim() : DEFAULT.font_mr;
  return { name, font_en, font_mr };
};

let _last = '';
const fetchAndApply = () => {
  fetch(`${config.api.baseUrl.replace(/\/$/, '')}/public/branding`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const b = normalize(json?.data?.branding);
      if (!b) return;
      const sig = JSON.stringify(b);
      if (sig === _last) return;
      _last = sig;
      applyBranding(b);
      try { localStorage.setItem(STORAGE_KEY, sig); } catch { /* ignore */ }
    })
    .catch(() => { /* keep cached/default */ });
};

/** Apply cached branding instantly, fetch authoritative, then poll for live updates. */
export const initBranding = (): void => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const b = cached ? normalize(JSON.parse(cached)) : null;
    if (b) { _last = JSON.stringify(b); applyBranding(b); }
    else applyBranding(DEFAULT);
  } catch { applyBranding(DEFAULT); }
  fetchAndApply();
  setInterval(fetchAndApply, 15000);
  window.addEventListener('focus', fetchAndApply);
};

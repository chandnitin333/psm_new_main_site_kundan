/**
 * Dynamic accent theming.
 *
 * The admin picks ONE accent colour (stored globally on the backend). From it we
 * generate a full 50-900 shade palette and write it into CSS variables that the
 * Tailwind `primary-*` colours reference — so every button, panel, table, border,
 * focus ring and gradient stop that uses `primary-*` re-tints automatically.
 */
import { config } from '../config';

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
// how far each shade is mixed toward white (lighter) or black (darker); 600 = base
const MIX: Record<number, { toward: 'white' | 'black' | 'base'; t: number }> = {
  50: { toward: 'white', t: 0.92 },
  100: { toward: 'white', t: 0.84 },
  200: { toward: 'white', t: 0.70 },
  300: { toward: 'white', t: 0.54 },
  400: { toward: 'white', t: 0.32 },
  500: { toward: 'white', t: 0.14 },
  600: { toward: 'base', t: 0 },
  700: { toward: 'black', t: 0.12 },
  800: { toward: 'black', t: 0.26 },
  900: { toward: 'black', t: 0.42 },
};

const STORAGE_KEY = 'theme_primary';
const DEFAULT_COLOR = '#764ba2';

export type ThemeConfig =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number };

const DEFAULT_THEME: ThemeConfig = { type: 'solid', color: DEFAULT_COLOR };

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB | null => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

/** Generate the 50-900 palette (space-separated RGB strings) from a base hex. */
export const generatePalette = (baseHex: string): Record<number, string> | null => {
  const base = hexToRgb(baseHex);
  if (!base) return null;
  const white: RGB = [255, 255, 255];
  const black: RGB = [0, 0, 0];
  const out: Record<number, string> = {};
  for (const shade of SHADES) {
    const { toward, t } = MIX[shade];
    const target = toward === 'white' ? white : black;
    const rgb: RGB = toward === 'base'
      ? base
      : [mix(base[0], target[0], t), mix(base[1], target[1], t), mix(base[2], target[2], t)];
    out[shade] = `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
  }
  return out;
};

/** Write the generated palette into the document's CSS variables. */
export const applyThemeColor = (baseHex: string): boolean => {
  const palette = generatePalette(baseHex);
  if (!palette) return false;
  const root = document.documentElement;
  for (const shade of SHADES) {
    root.style.setProperty(`--color-primary-${shade}`, palette[shade]);
  }
  return true;
};

/**
 * Apply a theme (solid or gradient):
 *  - always regenerate the primary palette from the base colour (solid colour, or
 *    a gradient's start colour) so text/borders/rings/tables/gradient-shades match;
 *  - for a gradient, also expose --brand-gradient and flag data-brand="gradient",
 *    which index.css uses to paint primary button/panel surfaces with the gradient.
 */
export const applyTheme = (theme: ThemeConfig): boolean => {
  const base = theme.type === 'gradient' ? theme.from : theme.color;
  if (!applyThemeColor(base)) return false;
  const root = document.documentElement;
  if (theme.type === 'gradient') {
    root.style.setProperty('--brand-gradient', `linear-gradient(${theme.angle ?? 135}deg, ${theme.from}, ${theme.to})`);
    root.setAttribute('data-brand', 'gradient');
  } else {
    root.style.removeProperty('--brand-gradient');
    root.setAttribute('data-brand', 'solid');
  }
  return true;
};

const normalizeTheme = (t: unknown): ThemeConfig | null => {
  if (!t || typeof t !== 'object') return null;
  const o = t as Record<string, unknown>;
  if (o.type === 'gradient' && typeof o.from === 'string' && typeof o.to === 'string') {
    return { type: 'gradient', from: o.from, to: o.to, angle: Number(o.angle) || 135 };
  }
  if ((o.type === 'solid' || o.type === undefined) && typeof o.color === 'string') {
    return { type: 'solid', color: o.color };
  }
  return null;
};

let _lastApplied = '';

/** Fetch the authoritative theme and apply it if it changed (live update, no refresh). */
const fetchAndApply = (): void => {
  const url = `${config.api.baseUrl.replace(/\/$/, '')}/public/theme`;
  fetch(url, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const t = normalizeTheme(json?.data?.theme);
      if (!t) return;
      const sig = JSON.stringify(t);
      if (sig === _lastApplied) return;          // no change → skip
      if (applyTheme(t)) {
        _lastApplied = sig;
        try { localStorage.setItem(STORAGE_KEY, sig); } catch { /* ignore */ }
      }
    })
    .catch(() => { /* offline / error → keep cached or default */ });
};

/**
 * Apply the cached theme immediately (no flash), fetch the authoritative theme,
 * then keep polling so an admin change re-themes the open app WITHOUT a refresh.
 * Call once at app start.
 */
export const initThemeColor = (): void => {
  // 1) instant: apply last-known theme from localStorage
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const t = normalizeTheme(JSON.parse(cached));
      if (t) { applyTheme(t); _lastApplied = JSON.stringify(t); }
    }
  } catch { /* ignore */ }

  // 2) fetch now, and poll for live changes
  fetchAndApply();
  setInterval(fetchAndApply, 15000);            // every 15s
  // also re-check when the tab regains focus (instant after switching back)
  window.addEventListener('focus', fetchAndApply);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) fetchAndApply(); });
};

export { DEFAULT_COLOR, DEFAULT_THEME };

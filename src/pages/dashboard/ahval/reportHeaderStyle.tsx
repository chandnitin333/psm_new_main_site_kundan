import type { CSSProperties } from 'react';

/* Shared header-color control for all new-design report cards.
   User कोणताही रंग निवडू शकतो (default gradient, हिरवा, पिवळा, निळा, पांढरा, किंवा custom).
   निवडलेला रंग header background ला लागतो; मजकूराचा रंग auto contrast (गडद/पांढरा). */

// रंगाची luminance वरून मजकूर रंग (हलका bg → गडद text, गडद bg → पांढरा)
export const fgFor = (hex: string): string => {
  const h = hex.replace('#', '');
  if (h.length < 6) return '#ffffff';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 150 ? '#1e293b' : '#ffffff';
};

// report root ला लावायची inline CSS vars (color रिकामा = default gradient, काही override नाही)
export const headerVars = (color: string): CSSProperties | undefined =>
  color ? ({ ['--hdr-bg']: color, ['--hdr-fg']: fgFor(color) } as CSSProperties) : undefined;

export const HEADER_STYLE_CSS = `
  .hdr-custom .dc-head, .hdr-custom .gc-head, .hdr-custom .n9c-head, .hdr-custom .nn-head,
  .hdr-custom .n9g-head, .hdr-custom .b1-head, .hdr-custom .ak-head {
    background: var(--hdr-bg) !important; color: var(--hdr-fg,#fff) !important; border-bottom: 1px solid rgba(0,0,0,.10);
  }
  .hdr-custom .dc-head *, .hdr-custom .gc-head *, .hdr-custom .n9c-head *, .hdr-custom .nn-head *,
  .hdr-custom .n9g-head *, .hdr-custom .b1-head *, .hdr-custom .ak-head * {
    color: var(--hdr-fg,#fff) !important; opacity: 1 !important;
  }
  .hdr-custom .dc-badge, .hdr-custom .n9c-badge, .hdr-custom .b1-copytag {
    background: rgba(128,128,128,.16) !important; border-color: rgba(128,128,128,.32) !important;
  }
`;

const PRESETS: { label: string; v: string }[] = [
  { label: 'रंगीत (Default)', v: '' },
  { label: 'निळा', v: '#1d4ed8' },
  { label: 'हिरवा', v: '#047857' },
  { label: 'पिवळा', v: '#ca8a04' },
  { label: 'लाल', v: '#b91c1c' },
  { label: 'साधा (पांढरा)', v: '#ffffff' },
];

export const HeaderStyleControl = ({ color, onChange }: { color: string; onChange: (c: string) => void }) => {
  const isPreset = PRESETS.some((p) => p.v === color);
  return (
    <span className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
      <style>{HEADER_STYLE_CSS}</style>
      🎨 हेडर रंग:
      <select
        value={isPreset ? color : '__custom'}
        onChange={(e) => { if (e.target.value !== '__custom') onChange(e.target.value); }}
        style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 600, color: '#1e293b', background: '#fff', cursor: 'pointer' }}
      >
        {PRESETS.map((p) => <option key={p.label} value={p.v}>{p.label}</option>)}
        {!isPreset && <option value="__custom">कस्टम</option>}
      </select>
      <input
        type="color"
        value={color && color !== '' ? color : '#4338ca'}
        onChange={(e) => onChange(e.target.value)}
        title="कस्टम रंग निवडा"
        style={{ width: 34, height: 32, border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', cursor: 'pointer', padding: 2 }}
      />
    </span>
  );
};

/**
 * कर भरणा पावती (tax payment receipt) — printable PDF for a single citizen payment.
 * Builds a styled A5 receipt and prints via a hidden iframe (Devanagari-safe, "Save as PDF").
 */
import type { MyPayment } from '../services/vasuliService';
import { getGpSettings } from './gpSettings';

const esc = (s: string): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inr = (n: number | null | undefined): string => '₹ ' + Math.round(Number(n || 0)).toLocaleString('en-IN');

const fmtDate = (v: string | null | undefined): string => {
  if (!v) return '';
  const s = String(v).replace('T', ' ');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s.slice(0, 10);
};

const MODE_LABEL: Record<string, string> = { cash: 'रोख', online: 'ऑनलाइन', cheque: 'धनादेश', upi: 'UPI', card: 'कार्ड' };

/** Receipt number — prefer an actual pavti no, else a stable derived code. */
const receiptNo = (p: MyPayment): string =>
  p.ghar_pavti_no || p.pani_pavti_no || `PSM/${p.year ?? '—'}/${p.id}`;

export function printTaxReceipt(p: MyPayment): void {
  const gs = getGpSettings();
  const fy = p.year ? `${p.year}-${p.to_year || Number(p.year) + 1}` : '—';
  const row = (k: string, v: string) =>
    `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`;
  const amtRow = (k: string, v: string, strong = false) =>
    `<tr class="${strong ? 'tot' : ''}"><td>${esc(k)}</td><td class="amt">${esc(v)}</td></tr>`;

  const ghar = Number(p.ghar_amount || 0);
  const pani = Number(p.pani_amount || 0);
  const amountRows =
    (ghar > 0 ? amtRow('गृहकर व भूमिकर', inr(ghar)) : '') +
    (pani > 0 ? amtRow('पाणी कर', inr(pani)) : '') +
    amtRow('एकूण भरणा', inr(p.amount), true);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>पावती ${esc(receiptNo(p))}</title>
  <style>
    @page { size: A5 portrait; margin: 10mm; }
    * { font-family: 'Noto Sans Devanagari','Mangal','Nirmala UI',Arial,sans-serif; box-sizing: border-box; }
    body { margin: 0; color: #111; }
    .r { border: 2px solid #1e3a8a; border-radius: 8px; padding: 14px 16px; }
    .hd { text-align: center; border-bottom: 1px dashed #999; padding-bottom: 8px; margin-bottom: 10px; }
    .hd .gp { font-size: 17px; font-weight: 800; color: #1e3a8a; }
    .hd .loc { font-size: 11px; color: #555; margin-top: 2px; }
    .hd .ttl { display:inline-block; margin-top:6px; font-size: 13px; font-weight: 700; background:#eef2ff; color:#1e3a8a; padding:2px 12px; border-radius:999px; }
    .meta { display:flex; justify-content:space-between; font-size:11px; color:#444; margin-bottom:8px; }
    table { width: 100%; border-collapse: collapse; }
    .info td { padding: 3px 2px; font-size: 12px; vertical-align: top; }
    .info td.k { color:#666; width: 38%; }
    .info td.v { font-weight: 600; text-align: right; }
    .amtbl { margin-top: 10px; border-top: 1px solid #ccc; }
    .amtbl td { padding: 5px 2px; font-size: 12.5px; }
    .amtbl td.amt { text-align: right; font-weight: 600; }
    .amtbl tr.tot td { border-top: 1px solid #999; font-size: 14px; font-weight: 800; color:#166534; padding-top:7px; }
    .ft { margin-top: 12px; text-align:center; font-size: 10px; color:#888; }
    .paid { display:inline-block; margin-top:6px; border:2px solid #16a34a; color:#16a34a; font-weight:800; font-size:13px; padding:2px 12px; border-radius:6px; transform: rotate(-4deg); }
  </style></head><body onload="window.focus();window.print()">
    <div class="r">
      <div class="hd">
        <div class="gp">${esc(p.gram_panchayat || 'ग्रामपंचायत')}</div>
        <div class="loc">${esc([p.taluka && `ता. ${p.taluka}`, p.district && `जि. ${p.district}`].filter(Boolean).join('  ·  '))}</div>
        ${gs.receipt_header ? `<div class="loc">${esc(gs.receipt_header)}</div>` : ''}
        <div class="ttl">कर भरणा पावती</div>
      </div>
      <div class="meta"><span>पावती क्र.: <b>${esc(receiptNo(p))}</b></span><span>दिनांक: <b>${esc(fmtDate(p.paid_at))}</b></span></div>
      <table class="info">
        ${row('खातेदाराचे नाव', p.khatedharkache_nav || '—')}
        ${row('मालमत्ता क्र.', p.malmatta_number || '—')}
        ${row('प्रभाग / अनु क्र.', `${p.ward_number || '—'} / ${p.anu_kramank || '—'}`)}
        ${row('कर वर्ष', fy)}
        ${row('भरणा पद्धत', MODE_LABEL[String(p.payment_type || '').toLowerCase()] || (p.payment_type || '—'))}
        ${p.reference_no ? row('संदर्भ क्र.', p.reference_no) : ''}
      </table>
      <table class="amtbl">${amountRows}</table>
      ${Number(p.sillak_ekun || 0) > 0 ? `<p style="font-size:11px;color:#b45309;margin:8px 0 0">शिल्लक थकबाकी: <b>${esc(inr(p.sillak_ekun))}</b></p>` : '<div style="text-align:center"><span class="paid">भरणा झाला</span></div>'}
      <div class="ft">${esc(gs.receipt_footer || 'ही संगणकीय पावती आहे — स्वाक्षरीची आवश्यकता नाही.')}<br>PSM — ग्रामपंचायत मालमत्ता व कर व्यवस्थापन प्रणाली</div>
    </div>
  </body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open(); doc.write(html); doc.close();
  const cleanup = () => { try { document.body.removeChild(iframe); } catch { /* noop */ } };
  const w = iframe.contentWindow;
  if (w) { w.onafterprint = cleanup; setTimeout(cleanup, 60000); }
}

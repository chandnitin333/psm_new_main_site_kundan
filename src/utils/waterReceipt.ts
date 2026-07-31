/**
 * पाणी बिल भरणा पावती (water bill payment receipt) — printable PDF for one payment.
 * Styled A5, prints via hidden iframe (Devanagari-safe, "Save as PDF").
 */
import type { WaterPayment } from '../services/waterMeterService';
import { getGpSettings } from './gpSettings';

const esc = (s: string): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inr = (n: number | null | undefined): string => '₹ ' + Math.round(Number(n || 0)).toLocaleString('en-IN');
const fmtDate = (v: string | null | undefined): string => {
  if (!v) return '';
  const m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10);
};
const MODE_LABEL: Record<string, string> = { cash: 'रोख', online: 'ऑनलाइन', cheque: 'धनादेश', upi: 'UPI', card: 'कार्ड' };
const receiptNo = (p: WaterPayment): string => p.receipt_no || `PSM-W/${p.year ?? '—'}/${p.id}`;

export function printWaterReceipt(p: WaterPayment): void {
  const gs = getGpSettings();
  const row = (k: string, v: string) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>पाणी पावती ${esc(receiptNo(p))}</title>
  <style>
    @page { size: A5 portrait; margin: 10mm; }
    * { font-family: 'Noto Sans Devanagari','Mangal','Nirmala UI',Arial,sans-serif; box-sizing: border-box; }
    body { margin: 0; color: #111; }
    .r { border: 2px solid #0369a1; border-radius: 8px; padding: 14px 16px; }
    .hd { text-align: center; border-bottom: 1px dashed #999; padding-bottom: 8px; margin-bottom: 10px; }
    .hd .gp { font-size: 17px; font-weight: 800; color: #0369a1; }
    .hd .loc { font-size: 11px; color: #555; margin-top: 2px; }
    .hd .ttl { display:inline-block; margin-top:6px; font-size: 13px; font-weight: 700; background:#e0f2fe; color:#0369a1; padding:2px 12px; border-radius:999px; }
    .meta { display:flex; justify-content:space-between; font-size:11px; color:#444; margin-bottom:8px; }
    table.info { width: 100%; border-collapse: collapse; }
    .info td { padding: 3px 2px; font-size: 12px; }
    .info td.k { color:#666; width: 40%; }
    .info td.v { font-weight: 600; text-align: right; }
    .amt { margin-top: 10px; border-top: 1px solid #999; padding-top: 8px; text-align:center; }
    .amt .n { font-size: 20px; font-weight: 800; color:#166534; }
    .paid { display:inline-block; margin-top:6px; border:2px solid #16a34a; color:#16a34a; font-weight:800; font-size:12px; padding:2px 12px; border-radius:6px; transform: rotate(-4deg); }
    .ft { margin-top: 12px; text-align:center; font-size: 10px; color:#888; }
  </style></head><body onload="window.focus();window.print()">
    <div class="r">
      <div class="hd">
        <div class="gp">${esc(p.gram_panchayat || 'ग्रामपंचायत')}</div>
        <div class="loc">${esc([p.taluka && `ता. ${p.taluka}`, p.district && `जि. ${p.district}`].filter(Boolean).join('  ·  '))}</div>
        ${gs.receipt_header ? `<div class="loc">${esc(gs.receipt_header)}</div>` : ''}
        <div class="ttl">पाणी बिल भरणा पावती</div>
      </div>
      <div class="meta"><span>पावती क्र.: <b>${esc(receiptNo(p))}</b></span><span>दिनांक: <b>${esc(fmtDate(p.paid_date || p.created_at))}</b></span></div>
      <table class="info">
        ${row('खातेदाराचे नाव', p.khatedar_name || '—')}
        ${row('मीटर क्र.', p.meter_number || '—')}
        ${row('मालमत्ता / प्रभाग', `${p.malmatta_number || '—'} / ${p.ward || '—'}`)}
        ${p.year ? row('कालावधी', `सन ${p.year}`) : ''}
        ${row('भरणा पद्धत', MODE_LABEL[String(p.payment_type || '').toLowerCase()] || (p.payment_type || '—'))}
        ${p.reference_no ? row('संदर्भ क्र.', p.reference_no) : ''}
      </table>
      <div class="amt"><div class="n">${esc(inr(p.amount))}</div><div style="font-size:11px;color:#555">एकूण भरणा</div><div><span class="paid">भरणा झाला</span></div></div>
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

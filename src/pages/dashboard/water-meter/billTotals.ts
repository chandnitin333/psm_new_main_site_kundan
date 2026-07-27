import { type WaterReading } from '../../../services';

/* पाणी बिल totals — carryover model. BillDoc, WaterMeterDetail, WaterMeterMultiReport,
   CitizenWaterBill सर्व वापरतात. (component नसलेला module — Fast Refresh warning टाळण्यासाठी वेगळा.) */

export const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Compute bill totals + display period from a meter's readings (carryover model). */
export const billTotals = (
  rows: WaterReading[],
  opts: { year: number; fromSeq: number; toSeq: number; magil?: string },
) => {
  const { year, fromSeq, toSeq } = opts;
  const inRange = rows.filter((r) => r.month_seq >= fromSeq && r.month_seq <= toSeq && r.total != null);
  const billRows = inRange;
  const lastRow = inRange[inRange.length - 1];
  const paaniDeyak = lastRow ? Math.round(num(lastRow.current_charge)) : 0;
  const magilThak = opts.magil && opts.magil !== '' ? num(opts.magil) : (lastRow ? Math.round(num(lastRow.arrears)) : 0);
  const vilamb = lastRow ? Math.round(num(lastRow.late_fee)) : 0;
  const totalPaid = lastRow ? Math.round(num(lastRow.paid_amount)) : 0;
  const ekunDeyak = magilThak + paaniDeyak + vilamb;
  const netDue = lastRow ? Math.round(num(lastRow.balance)) : 0;
  const seqCal = (seq: number) => ({ m: seq <= 9 ? seq + 3 : seq - 9, y: seq <= 9 ? year : year + 1 });
  const f = seqCal(fromSeq); const t = seqCal(toSeq);
  const periodFrom = `${pad2(1)}-${pad2(f.m)}-${f.y}`;
  const periodTo = `${pad2(new Date(t.y, t.m, 0).getDate())}-${pad2(t.m)}-${t.y}`;
  return { billRows, paaniDeyak, magilThak, vilamb, totalPaid, ekunDeyak, netDue, deyNantar: netDue, periodFrom, periodTo };
};

import { QRCodeSVG } from 'qrcode.react';
import { WATER_MONTHS, type WaterMeter, type WaterReading } from '../../../services';
import { fyLabel } from '../../../utils/fyConfig';

/* पाणी वापर मागणी बिल — दोन प्रती (कार्यालय + ग्राहक) एकाच 9-column border-collapse table मध्ये.
   WaterMeterDetail (single) व WaterMeterMultiReport (multi) दोन्ही वापरतात. */

export interface BillMeta {
  fromSeq: number; toSeq: number; dueDate: string; center: string; centerAddr: string;
  prevReceipt: string; prevDate: string; magilMonth: string; notes: string;
}

interface BillDocProps {
  H: { gp: string; samiti: string; district: string };
  meter: WaterMeter;
  bill: BillMeta;
  year: number; periodFrom: string; periodTo: string;
  billRows: WaterReading[];
  paaniDeyak: number; magilThak: number; ekunDeyak: number; vilamb: number; deyNantar: number; totalPaid: number; netDue: number;
  /** प्रत्येक बिलावर QR (scan करून मीटर/बिल पाहण्यासाठी) */
  qrUrl?: string;
}

const BillDoc = ({ H, meter, bill, year, periodFrom, periodTo, billRows, paaniDeyak, magilThak, ekunDeyak, vilamb, totalPaid, netDue, qrUrl }: BillDocProps) => (
  <div className="grid grid-cols-2 gap-0">
    {['कार्यालय प्रत', 'ग्राहक प्रत'].map((copyLabel, ci) => {
      // सर्व काही एकाच 9-column border-collapse table मध्ये → सर्व border एकसमान 1px
      const bc = 'border border-black px-1 py-0.5 text-[9px] align-middle';
      const bcc = `${bc} text-center`;
      return (
        <div key={ci} className={ci === 0 ? 'border-r-2 border-dashed border-gray-500 pr-3' : 'pl-3'}>
          <table className="w-full border-collapse text-[9px]">
            <tbody>
              {/* branded header band */}
              <tr>
                <td colSpan={9} className="relative border border-black bg-gray-100 px-2 py-1 text-center">
                  {qrUrl && (
                    <span className="absolute right-1 top-1" title="स्कॅन करा">
                      <QRCodeSVG value={qrUrl} size={46} level="M" marginSize={0} />
                    </span>
                  )}
                  <p className="text-[18px] font-extrabold tracking-wide">गट ग्रामपंचायत कार्यालय {H.gp}</p>
                  {meter.water_supply_name && <p className="text-[10px] font-semibold">पाणी पुरवठा योजना — {meter.water_supply_name}</p>}
                  <p className="text-[9px]">पंचायत समिती: {H.samiti} &nbsp;·&nbsp; जिल्हा: {H.district}</p>
                  <div className="mt-0.5 flex items-center justify-center gap-2">
                    <span className="rounded bg-black px-2 py-0.5 text-[10px] font-bold text-white">पाणी वापर मागणी बिल</span>
                    <span className="text-[10px] font-bold">सन {fyLabel(year)}</span>
                    <span className="rounded border border-black px-1.5 text-[9px] font-semibold">{copyLabel}</span>
                  </div>
                </td>
              </tr>
              {/* property grid */}
              <tr>
                {[['अनु क्र', meter.anu_kramank, 2], ['मा. क्र', meter.malmatta_number, 2], ['वार्ड', meter.ward, 2], ['मिटर क्र', meter.meter_number, 3]].map(([lbl, val, cs], i) => (
                  <td key={i} colSpan={cs as number} className={bc}>
                    <div className="text-[8px] text-gray-600">{lbl as string}</div>
                    <div className="font-bold">{(val as string) || '-'}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td colSpan={2} className={`${bc} text-gray-600`}>खातेदार</td>
                <td colSpan={7} className={bc}><b>{meter.khatedar_name || '-'}</b>{meter.bhogwatdar_name ? <> &nbsp;·&nbsp; <span className="text-gray-600">भोगवटदार:</span> <b>{meter.bhogwatdar_name}</b></> : null}</td>
              </tr>
              <tr>
                <td colSpan={2} className={`${bc} text-gray-600`}>पत्ता</td>
                <td colSpan={7} className={bc}>{meter.address || '-'}</td>
              </tr>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={2} className={bc}>बिल कालावधी</td>
                <td colSpan={3} className={bcc}>{WATER_MONTHS[bill.fromSeq - 1]}</td>
                <td colSpan={1} className={bcc}>ते</td>
                <td colSpan={3} className={bcc}>{WATER_MONTHS[bill.toSeq - 1]}</td>
              </tr>
              <tr className="font-semibold">
                <td colSpan={2} className={bc}>दिनांक</td>
                <td colSpan={3} className={bcc}>{periodFrom}</td>
                <td colSpan={1} className={bcc}>ते</td>
                <td colSpan={3} className={bcc}>{periodTo}</td>
              </tr>

              {/* reading — grouped header */}
              <tr className="bg-gray-100 font-bold">
                <td rowSpan={2} className={bcc}>महिना</td>
                <td colSpan={4} className={bcc}>रीडिंग</td>
                <td colSpan={4} className={bcc}>आकारणी / रक्कम</td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                {['चालू रिडिंग', 'मागील रिडिंग', 'एकूण रिडिंग', 'दर', 'चालु आकारणी', 'मागील थकबाकी', 'भरणा', 'एकूण'].map((h, i) => (
                  <td key={i} className={bcc}>{h}</td>))}
              </tr>
              {billRows.map((r) => (
                <tr key={r.month_seq}>
                  <td className={bcc}>{r.month_name}</td>
                  <td className={bcc}>{r.current_reading || ''}</td>
                  <td className={bcc}>{r.previous_reading || ''}</td>
                  <td className={bcc}>{r.ekun_reading ?? ''}</td>
                  <td className={bcc}>{r.rate ?? ''}</td>
                  <td className={bcc}>{r.current_charge ?? ''}</td>
                  <td className={bcc}>{r.arrears ?? ''}</td>
                  <td className={bcc}>{r.paid_amount ?? ''}</td>
                  <td className={`${bcc} font-bold`}>{r.balance ?? ''}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={7} className={`${bc} text-right`}>एकूण भरणा / देय →</td>
                <td className={bcc}>{totalPaid}</td>
                <td className={bcc}>{netDue}</td>
              </tr>

              {/* payment details (left) + amount summary (right) — side-by-side */}
              <tr className="bg-gray-100">
                <td colSpan={4} rowSpan={7} className={`${bc} align-top`}>
                  <div className="space-y-1.5 py-0.5">
                    <div><span className="text-gray-600">मागील भरणा पावती क्रमांक:</span> <b>{bill.prevReceipt || '—'}</b></div>
                    <div><span className="text-gray-600">मागील भरणा दिनांक:</span> <b>{bill.prevDate || '—'}</b></div>
                    <div><span className="text-gray-600">बिल भरणा केंद्र:</span> <b>{bill.center || '—'}</b>{bill.centerAddr ? ` (${bill.centerAddr})` : ''}</div>
                    <div><span className="text-gray-600">बिल भरण्याचा अखेरचा दिनांक:</span> <b>{bill.dueDate || '—'}</b> पर्यंत</div>
                  </div>
                </td>
                <td colSpan={5} className={`${bc} text-center font-bold tracking-wide`}>देयक रक्कम (रुपये)</td>
              </tr>
              {[
                { l: `मागील थकबाकी${bill.magilMonth ? ` (माहे ${bill.magilMonth})` : ''}`, v: magilThak },
                { l: 'पाणी वापर देयक (चालू)', v: paaniDeyak },
                { l: 'विलंब शुल्क', v: vilamb },
              ].map((x, i) => (
                <tr key={i}>
                  <td colSpan={3} className={`${bc} text-gray-700`}>{x.l}</td>
                  <td colSpan={2} className={`${bc} text-right tabular-nums`}>{`₹ ${x.v}`}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={3} className={bc}>एकुण मागणी</td>
                <td colSpan={2} className={`${bc} text-right tabular-nums`}>{`₹ ${ekunDeyak}`}</td>
              </tr>
              <tr>
                <td colSpan={3} className={`${bc} text-gray-700`}>वजा : भरणा झाले</td>
                <td colSpan={2} className={`${bc} text-right tabular-nums`}>{`− ₹ ${totalPaid}`}</td>
              </tr>
              <tr className="font-bold text-white">
                <td colSpan={3} className="border border-black bg-gray-900 px-2 py-1.5 text-[11px]">एकूण देय रक्कम</td>
                <td colSpan={2} className="border border-black bg-gray-900 px-2 py-1.5 text-right text-[12px] tabular-nums">{`₹ ${netDue}`}</td>
              </tr>

              {/* सूचना */}
              <tr>
                <td colSpan={9} className={`${bc} leading-snug`}><b>सूचना:</b> {bill.notes || '—'}</td>
              </tr>
              {/* signatures */}
              <tr>
                <td colSpan={4} className="border border-black px-1 py-1 text-center align-bottom text-[9px] font-bold" style={{ height: '52px' }}>वसुलीकर्ता</td>
                <td colSpan={5} className="border border-black px-1 py-1 text-center align-bottom text-[9px]" style={{ height: '52px' }}>
                  <div className="font-bold">सरपंच / सचिव</div>
                  <div>गट ग्रामपंचायत कार्यालय {H.gp}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    })}
  </div>
);

export default BillDoc;


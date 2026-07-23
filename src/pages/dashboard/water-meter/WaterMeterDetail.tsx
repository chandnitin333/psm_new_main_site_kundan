import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Save, Droplet, Receipt } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { can } from '../../../utils/permissions';
import { trackAction } from '../../../utils/tracker';
import { waterMeterService, WATER_MONTHS, type WaterMeter, type WaterReading } from '../../../services';
import YearPicker from '../../../components/common/YearPicker';
import { DatePicker } from '../../../components/common';

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fyStart = () => { const d = new Date(); return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; };

// gram panchayat header from the logged-in user (dynamic per village)
const gpHeader = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      gp: u.gat_gram_panchayat || u.gram_panchayat || u.gram_panchayat_name || '',
      samiti: u.taluka || u.taluka_name || '',
      district: u.district || u.district_name || '',
    };
  } catch { return { gp: '', samiti: '', district: '' }; }
};

const emptyRow = (year: number, seq: number): WaterReading => ({
  year, month_seq: seq, month_name: WATER_MONTHS[seq - 1],
  current_reading: '', previous_reading: '', units: null, ekun_reading: '', rate: null,
  current_charge: null, arrears: null, late_fee: null, total: null,
  receipt_no: '', receipt_date: '', paid_amount: null, balance: null, remark: '',
});

const WaterMeterDetail = () => {
  const { id } = useParams();
  const meterId = Number(id);
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const [meter, setMeter] = useState<WaterMeter | null>(null);
  const [year, setYear] = useState(fyStart());
  const [rows, setRows] = useState<WaterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSeq, setSavingSeq] = useState<number | null>(null);
  const [printMode, setPrintMode] = useState<'' | 'register' | 'bill'>('');
  const [tab, setTab] = useState<'register' | 'bill'>('register');
  // extra bill details (Sheet2) — entered before printing the demand bill
  const [bill, setBill] = useState({
    fromSeq: 1, toSeq: 12, dueDate: '', center: '', centerAddr: '', magil: '',
    prevReceipt: '', magilMonth: '',
    notes: 'घरगुती वापर प्रतीमहा 15 एम.एस.व्यास नळ कनेक्शन किमान देयक रुपये 100 (शंभर रुपये) आकारणी निश्चीत करण्यात आलेली आहे. (0 ते 15 घ.मी पाणी वर)',
  });
  // top controls for the reading grid
  const [readingType, setReadingType] = useState<'average' | 'reading'>('average');
  const [topRate, setTopRate] = useState('');
  const [vilambType, setVilambType] = useState<'percent' | 'amount'>('amount');
  const [vilambVal, setVilambVal] = useState('');
  // once a reading is saved for this year, freeze the reading-type selection
  const [typeLocked, setTypeLocked] = useState(false);
  const canEdit = can('malmatta_nodni', 'water_meter');
  const H = gpHeader();

  const round2 = (n: number) => Math.round(n * 100) / 100;

  // row मध्ये काहीही entry आहे का (जतन button फक्त भरलेल्या row ला दाखवा).
  const rowFilled = (r: WaterReading): boolean => {
    const cr = String(r.current_reading ?? '');
    const pr = String(r.previous_reading ?? '');
    return [
      cr === 'आवरेज' ? '' : cr,
      pr === 'बिल' ? '' : pr,
      r.ekun_reading, r.current_charge, r.arrears,
      r.receipt_no, r.receipt_date, r.paid_amount, r.remark,
    ].some((v) => String(v ?? '') !== '');
  };

  // पेमेंट झाले का — भरणा रक्कम + पावती क्रमांक दोन्ही असल्यास.
  const isPaid = (r: WaterReading): boolean =>
    String(r.paid_amount ?? '') !== '' && num(r.paid_amount) > 0 && String(r.receipt_no ?? '').trim() !== '';

  // whole-array recompute with CARRYOVER (महिना-क्रमाने):
  //  थकीत(row) = मागील row ची थकबाकी  (पहिली row = opening; reading मध्ये पहिली = मागील×दर)
  //  एकूण = चालु आकारणी + थकीत + विलंब दंड
  //  थकबाकी = एकूण − भरणा
  //  reading: चालु आकारणी = चालु रीडिंग×दर;  पुढील मागील रीडिंग = एकूण रीडिंग × न भरलेले प्रमाण (partial payment)
  const recompute = (list: WaterReading[], rt = readingType, vt = vilambType, vv = vilambVal, rateStr = topRate): WaterReading[] => {
    const rateNum = String(rateStr ?? '') === '' ? null : num(rateStr);
    const vilNum = String(vv ?? '') === '' ? null : num(vv);
    const ordered = [...list].sort((a, b) => a.month_seq - b.month_seq);
    let prevBal: number | null = null;           // थकबाकी → पुढील थकीत
    let prevUnpaidReading: number | null = null; // reading: न भरलेली युनिट्स → पुढील मागील रीडिंग

    return ordered.map((r, i) => {
      const row: WaterReading = { ...r };
      const first = i === 0;
      const lateOf = (base: number | null): number | null =>
        vt === 'percent' ? (base != null ? round2(num(base) * num(vilNum) / 100) : null) : vilNum;

      if (rt === 'average') {
        row.current_reading = 'आवरेज';
        row.previous_reading = 'बिल';
        const cc = String(row.current_charge ?? '') === '' ? null : num(row.current_charge);
        const openThak = first && String(row.arrears ?? '') !== '' ? num(row.arrears) : null;
        // row तेव्हाच active — जेव्हा या row मध्ये user ने स्वतः काही भरले (फक्त carryover ने नाही)
        const active = cc != null || String(row.ekun_reading ?? '') !== '' || openThak != null;
        if (!active) {
          if (!first) row.arrears = null;
          row.rate = null; row.late_fee = null; row.total = null; row.balance = null;
          return row;
        }
        const thak = first ? openThak : prevBal;
        row.rate = rateNum;
        row.arrears = thak;
        const late = lateOf(thak);
        row.late_fee = late;
        const total = round2(num(cc) + num(thak) + num(late));
        row.total = total;
        const bal = round2(total - num(row.paid_amount));
        row.balance = bal;
        prevBal = bal;
        return row;
      }

      // reading mode
      if (row.current_reading === 'आवरेज') row.current_reading = '';
      if (first) { if (row.previous_reading === 'बिल') row.previous_reading = ''; }
      else row.previous_reading = prevUnpaidReading != null ? String(prevUnpaidReading) : '';
      const hasCur = String(row.current_reading ?? '') !== '';
      const hasPrev = String(row.previous_reading ?? '') !== '';
      const active = hasCur || (first && hasPrev);
      if (!active) {
        row.ekun_reading = ''; row.rate = null; row.current_charge = null; row.arrears = null;
        row.late_fee = null; row.total = null; row.balance = null;
        return row;
      }
      const cr = num(row.current_reading);
      const mr = num(row.previous_reading);
      const ekunReading = cr + mr;
      row.ekun_reading = String(ekunReading);
      row.rate = rateNum;
      const cc = rateNum != null ? round2(cr * rateNum) : null;
      row.current_charge = cc;
      const thak = first ? (rateNum != null ? round2(mr * rateNum) : null) : (prevBal ?? 0);
      row.arrears = thak;
      const late = lateOf(thak);
      row.late_fee = late;
      const total = round2(num(cc) + num(thak) + num(late));
      row.total = total;
      const bharana = num(row.paid_amount);
      const bal = round2(total - bharana);
      row.balance = bal;
      const paidFrac = total > 0 ? Math.min(1, bharana / total) : 0;
      prevUnpaidReading = round2(ekunReading * (1 - paidFrac));
      prevBal = bal;
      return row;
    });
  };

  const onReadingType = (rt: 'average' | 'reading') => {
    setReadingType(rt);
    setRows((prev) => recompute(prev, rt, vilambType, vilambVal));
  };
  const onTopRate = (v: string) => {
    const val = v.replace(/[^0-9.]/g, '');
    setTopRate(val);
    setRows((prev) => recompute(prev, readingType, vilambType, vilambVal, val));
  };
  const onVilambType = (vt: 'percent' | 'amount') => {
    setVilambType(vt);
    setRows((prev) => recompute(prev, readingType, vt, vilambVal));
  };
  const onVilambVal = (v: string) => {
    const val = v.replace(/[^0-9.]/g, '');
    setVilambVal(val);
    setRows((prev) => recompute(prev, readingType, vilambType, val));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await waterMeterService.getMeter(meterId, year);
      if (res?.success && res.data) {
        setMeter(res.data);
        const existing = res.data.readings || [];
        const savedRow = existing.find((r) => r.id);
        // infer reading-type from saved data (numeric readings => reading mode)
        const hasNumericReading = existing.some((r) => {
          const c = String(r.current_reading ?? '');
          return c !== '' && c !== 'आवरेज' && !Number.isNaN(Number(c));
        });
        const rt: 'average' | 'reading' = hasNumericReading ? 'reading' : 'average';
        // top values: saved असल्यास तिथून, नाहीतर meter वरून (विलंब default रिकामे)
        const effRate = savedRow?.rate ?? res.data.rate ?? null;
        const vv = savedRow?.late_fee != null ? String(savedRow.late_fee) : '';
        const vt: 'percent' | 'amount' = 'amount';
        setReadingType(rt);
        setVilambType(vt);
        setVilambVal(vv);
        setTopRate(effRate != null ? String(effRate) : '');
        setTypeLocked(!!savedRow); // record असल्यास प्रकार + top freeze
        const merged = Array.from({ length: 12 }, (_, i) => {
          const seq = i + 1;
          const found = existing.find((r) => r.month_seq === seq && r.year === year);
          return found ? { ...emptyRow(year, seq), ...found } : emptyRow(year, seq);
        });
        // rows top config नुसार auto-fill/recompute करा (chain + फक्त data असलेल्या row ला दर)
        setRows(recompute(merged, rt, vt, vv, effRate != null ? String(effRate) : ''));
      }
      // prefill bill details from the last saved bill (tracking / no re-typing)
      try {
        const lb = await waterMeterService.latestBill(meterId, year);
        const b = lb?.data as Record<string, unknown> | undefined;
        if (b && b.id) {
          setBill((prev) => ({
            ...prev,
            fromSeq: Number(b.from_seq) || prev.fromSeq,
            toSeq: Number(b.to_seq) || prev.toSeq,
            dueDate: b.due_date ? String(b.due_date).slice(0, 10) : '',
            center: (b.center as string) || '',
            centerAddr: (b.center_addr as string) || '',
            magil: b.magil_amount != null ? String(b.magil_amount) : '',
            prevReceipt: (b.prev_receipt as string) || '',
            magilMonth: (b.magil_month as string) || '',
            notes: (b.notes as string) || prev.notes,
          }));
        }
      } catch { /* ignore */ }
    } catch { toast.error('माहिती लोड करताना त्रुटी'); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meterId, year]);

  useEffect(() => { document.title = 'पाणी मीटर तपशील'; load(); }, [load]);

  // या पेजवर floating widgets (Download App / ग्राम सहायक) लपवा
  useEffect(() => {
    document.body.classList.add('hide-gv-floats');
    return () => document.body.classList.remove('hide-gv-floats');
  }, []);

  const setCell = (seq: number, key: keyof WaterReading, val: string) => {
    setRows((prev) => recompute(prev.map((r) => (r.month_seq === seq ? { ...r, [key]: val } : r))));
  };

  const saveRow = async (r: WaterReading) => {
    setSavingSeq(r.month_seq);
    try {
      const res = await waterMeterService.saveReading(meterId, r);
      const newId = (res?.data as { id?: number } | undefined)?.id;
      if (newId) setRows((prev) => prev.map((x) => (x.month_seq === r.month_seq ? { ...x, id: newId } : x)));
      trackAction(`पाणी रीडिंग जतन — ${meter?.khatedar_name} ${r.month_name}`, { page: '/water-meter', meter_id: meterId, month: r.month_seq });
      setTypeLocked(true); // या वर्षासाठी record आला → रिडिंग प्रकार freeze
      toast.success(`${r.month_name} जतन झाले`);
    } catch (e) { toast.error((e as { message?: string })?.message || 'जतन अयशस्वी'); }
    finally { setSavingSeq(null); }
  };

  const [savingBill, setSavingBill] = useState(false);

  // save the bill to DB (tracking). Returns true on success.
  const saveBillNow = async (): Promise<boolean> => {
    const fr = rows.filter((r) => (r.current_charge != null || r.current_reading) && r.month_seq >= bill.fromSeq && r.month_seq <= bill.toSeq);
    const base = fr.length ? fr : rows.filter((r) => r.current_charge != null || r.current_reading);
    const paani = base.reduce((s, r) => s + num(r.current_charge), 0);
    const magilA = bill.magil !== '' ? num(bill.magil) : base.reduce((s, r) => s + num(r.arrears), 0);
    const ekun = paani + magilA;
    const vil = base.reduce((s, r) => s + num(r.late_fee), 0);
    try {
      await waterMeterService.saveBill(meterId, {
        year, from_seq: bill.fromSeq, to_seq: bill.toSeq, due_date: bill.dueDate || null,
        center: bill.center, center_addr: bill.centerAddr, magil_month: bill.magilMonth,
        magil_amount: magilA, prev_receipt: bill.prevReceipt, notes: bill.notes,
        paani_deyak: paani, ekun_deyak: ekun, vilamb: vil, dey_nantar: ekun + vil,
      });
      trackAction(`पाणी बिल जतन — ${meter?.khatedar_name}`, { page: '/water-meter', meter_id: meterId, year });
      return true;
    } catch { return false; }
  };

  const handleSaveBill = async () => {
    setSavingBill(true);
    const ok = await saveBillNow();
    setSavingBill(false);
    if (ok) toast.success('बिल जतन झाले (Bill saved)');
    else toast.error('बिल जतन अयशस्वी');
  };

  const doPrint = async (mode: 'register' | 'bill') => {
    if (mode === 'bill') await saveBillNow();
    setPrintMode(mode);
    setTimeout(() => { window.print(); setPrintMode(''); }, 200);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  if (!meter) return <div className="p-8 text-center text-gray-500">मीटर सापडला नाही</div>;

  const filled = rows.filter((r) => r.current_charge != null || r.current_reading);
  // display rows = ALL months within पासून–पर्यंत range (value असेल तर value, नाहीतर रिकामे)
  const billRows = rows.filter((r) => r.month_seq >= bill.fromSeq && r.month_seq <= bill.toSeq);
  // totals = फक्त data असलेले महिने (रिकामे 0 धरले जातात)
  const billFilled = filled.filter((r) => r.month_seq >= bill.fromSeq && r.month_seq <= bill.toSeq);
  const totCurRead = billFilled.length ? billFilled : filled;
  const paaniDeyak = totCurRead.reduce((s, r) => s + num(r.current_charge), 0);        // पाणी वापर देयक
  const magilThak = bill.magil !== '' ? num(bill.magil) : totCurRead.reduce((s, r) => s + num(r.arrears), 0); // मागील थकबाकी
  const ekunDeyak = paaniDeyak + magilThak;                                            // एकुण भरणा देयक
  const vilamb = totCurRead.reduce((s, r) => s + num(r.late_fee), 0);                  // विलंब शुल्क
  const deyNantar = ekunDeyak + vilamb;                                                // देय तारखे नंतर

  const inp = 'w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
  // read-only computed cell (auto-calculated in reading mode)
  const inpRO = 'w-full px-1.5 py-1 text-xs text-center text-gray-700 bg-gray-50 dark:bg-gray-700/40 dark:text-gray-300';
  // normal-sized field for the bill config panel (matches the DatePicker height)
  const fieldCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  return (
    <>
      <ToastContainer />
      <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } .no-print{display:none!important} .print-area{display:block!important} body{background:#fff} }
        .print-area{display:none}`}</style>

      {/* ===== SCREEN ===== */}
      <div className="no-print space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/water-meter')} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300"><ArrowLeft className="h-4 w-4" /> मागे</button>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">वर्ष:</label>
            <div className="w-40">
              <YearPicker value={String(year)} onChange={(v) => v && setYear(Number(v))} placeholder="वर्ष निवडा" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">ते</span>
            <input value={year + 1} readOnly title="ते वर्ष (आपोआप)" className="w-24 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200" />
            {tab === 'register'
              ? <button onClick={() => doPrint('register')} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200"><Printer className="h-4 w-4" /> रजिस्टर प्रिंट</button>
              : <button onClick={() => doPrint('bill')} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"><Receipt className="h-4 w-4" /> बिल प्रिंट</button>}
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700/50 w-fit">
          <button onClick={() => setTab('register')} className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === 'register' ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'}`}><Droplet className="h-4 w-4" /> मीटर रीडिंग रजिस्टर</button>
          <button onClick={() => setTab('bill')} className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === 'bill' ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'}`}><Receipt className="h-4 w-4" /> मागणी बिल</button>
        </div>

        {/* meter header */}
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="text-center">
            <p className="font-bold text-gray-900 dark:text-white">गट ग्रामपंचायत कार्यालय {H.gp}</p>
            {meter.water_supply_name && <p className="text-sm text-gray-700 dark:text-gray-300">पाणी पुरवठा {meter.water_supply_name}</p>}
            <p className="text-xs text-gray-500">पंचायत समिती: {H.samiti} · जिल्हा: {H.district} · मिटर रिडिंग रजिस्टर सन {year}-{year + 1}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span><b>अनु क्र:</b> {meter.anu_kramank || '-'}</span>
            <span><b>मालमत्ता क्र:</b> {meter.malmatta_number || '-'}</span>
            <span><b>वॉर्ड:</b> {meter.ward || '-'}</span>
            <span><b>मीटर क्र:</b> {meter.meter_number || '-'}</span>
            <span className="col-span-2"><b>खातेदार:</b> {meter.khatedar_name}</span>
            <span><b>मोबाईल:</b> {meter.mobile || '-'}</span>
            <span><b>दर:</b> {meter.rate ?? 0}</span>
            <span className="col-span-2 sm:col-span-4"><b>पत्ता:</b> {meter.address || '-'}</span>
          </div>
        </div>

        {/* reading grid — register tab */}
        {tab === 'register' && (
        <>
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">रिडिंग प्रकार {typeLocked && <span className="text-amber-600">🔒</span>}</label>
              <select value={readingType} onChange={(e) => onReadingType(e.target.value as 'average' | 'reading')} disabled={!canEdit || typeLocked} className={`${fieldCls} disabled:cursor-not-allowed disabled:opacity-70`}>
                <option value="average">आवरेज (Average)</option>
                <option value="reading">रीडिंग (Reading)</option>
              </select>
              {typeLocked && <p className="mt-0.5 text-[10px] text-gray-400">या वर्षासाठी record आहे — प्रकार बदलता येणार नाही</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">आकारणी दर {typeLocked && <span className="text-amber-600">🔒</span>}</label>
              <input value={topRate} onChange={(e) => onTopRate(e.target.value)} disabled={!canEdit || typeLocked} inputMode="decimal" className={`${fieldCls} disabled:cursor-not-allowed disabled:opacity-70`} placeholder="दर (उदा. 6.5)" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">विलंब दंड प्रकार {typeLocked && <span className="text-amber-600">🔒</span>}</label>
              <select value={vilambType} onChange={(e) => onVilambType(e.target.value as 'percent' | 'amount')} disabled={!canEdit || typeLocked} className={`${fieldCls} disabled:cursor-not-allowed disabled:opacity-70`}>
                <option value="amount">रक्कम (Amount ₹)</option>
                <option value="percent">टक्केवारी (Percent %)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">{vilambType === 'percent' ? 'विलंब दंड %' : 'विलंब दंड ₹'} {typeLocked && <span className="text-amber-600">🔒</span>}</label>
              <input value={vilambVal} onChange={(e) => onVilambVal(e.target.value)} disabled={!canEdit || typeLocked} inputMode="decimal" className={`${fieldCls} disabled:cursor-not-allowed disabled:opacity-70`} placeholder={vilambType === 'percent' ? 'उदा. 5' : 'उदा. 10'} />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            {readingType === 'reading'
              ? 'रीडिंग: चालु रीडिंग टाका → एकूण=चालु+मागील, चालु आकारणी=चालु×दर आपोआप. थकीत=मागील महिन्याची थकबाकी. एकूण=चालु आकारणी+थकीत+विलंब. थकबाकी=एकूण−भरणा. आंशिक भरणा केल्यास न भरलेली युनिट्स पुढील महिन्याची मागील रीडिंग होते. भरणा + पावती क्र. टाकल्यास पेमेंट नोंद होते.'
              : 'आवरेज: चालु="आवरेज"/मागील="बिल". एकूण रीडिंग 0/15 (free). चालु आकारणी स्वतः टाका. थकीत=मागील थकबाकी (पहिला महिना opening). एकूण=चालु आकारणी+थकीत+विलंब. थकबाकी=एकूण−भरणा.'}
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">
          <table className="min-w-[1100px] border-collapse text-xs">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr className="text-gray-600 dark:text-gray-300">
                {['महिना', 'चालु रिडिंग', 'मागील रिडिंग', 'एकूण', 'दर', 'चालु आकारणी', 'थकीत', 'विलंब दंड', 'एकूण', 'पावती क्र', 'दिनांक', 'भरणा', 'थकबाकी', 'शेरा', ''].map((h, i) => (
                  <th key={i} className="border border-gray-200 px-1.5 py-1 font-semibold dark:border-gray-600">{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isReading = readingType === 'reading';
                return (
                <tr key={r.month_seq} className={r.id ? 'bg-green-50 dark:bg-green-900/15' : ''}>
                  <td className="border border-gray-200 px-1.5 py-1 font-medium text-gray-800 dark:border-gray-600 dark:text-gray-200 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {r.id ? <span title="आधीच जतन केलेले (DB)" className="text-green-600 dark:text-green-400">✓</span> : null}
                      {r.month_name}
                    </span>
                  </td>
                  {/* चालु रीडिंग: reading → editable; average → "आवरेज" readonly */}
                  <td className="border border-gray-200 dark:border-gray-600">
                    {isReading
                      ? <input disabled={!canEdit} inputMode="decimal" value={String(r.current_reading ?? '')} onChange={(e) => setCell(r.month_seq, 'current_reading', e.target.value.replace(/[^0-9.]/g, ''))} className={inp} />
                      : <div className={inpRO}>{r.current_reading ?? ''}</div>}
                  </td>
                  {/* मागील रीडिंग: reading पहिला महिना editable, बाकी आपोआप (न भरलेली युनिट्स); average → "बिल" readonly */}
                  <td className="border border-gray-200 dark:border-gray-600" title={isReading && r.month_seq !== 1 ? 'मागील महिन्याच्या न भरलेल्या युनिट्सवरून आपोआप' : undefined}>
                    {isReading && r.month_seq === 1
                      ? <input disabled={!canEdit} inputMode="decimal" value={String(r.previous_reading ?? '')} onChange={(e) => setCell(r.month_seq, 'previous_reading', e.target.value.replace(/[^0-9.]/g, ''))} className={inp} />
                      : <div className={inpRO}>{r.previous_reading ?? ''}</div>}
                  </td>
                  {/* एकूण रीडिंग: reading → चालु+मागील (आपोआप); average → free text 0/15 */}
                  <td className="border border-gray-200 dark:border-gray-600">
                    {isReading
                      ? <div className={inpRO}>{r.ekun_reading ?? ''}</div>
                      : <input disabled={!canEdit} value={String(r.ekun_reading ?? '')} onChange={(e) => setCell(r.month_seq, 'ekun_reading', e.target.value)} className={inp} placeholder="उदा. 0/15" />}
                  </td>
                  {/* दर: top वरून (readonly) */}
                  <td className="border border-gray-200 dark:border-gray-600"><div className={inpRO}>{r.rate ?? ''}</div></td>
                  {/* चालु आकारणी: average → editable; reading → चालु×दर (आपोआप) */}
                  <td className="border border-gray-200 dark:border-gray-600">
                    {isReading
                      ? <div className={inpRO}>{r.current_charge ?? ''}</div>
                      : <input disabled={!canEdit} inputMode="decimal" value={String(r.current_charge ?? '')} onChange={(e) => setCell(r.month_seq, 'current_charge', e.target.value.replace(/[^0-9.]/g, ''))} className={inp} />}
                  </td>
                  {/* थकीत: पहिला महिना opening (average मध्ये editable), बाकी = मागील थकबाकी (आपोआप) */}
                  <td className="border border-gray-200 dark:border-gray-600" title={r.month_seq !== 1 ? 'मागील महिन्याच्या थकबाकीवरून आपोआप' : undefined}>
                    {(!isReading && r.month_seq === 1)
                      ? <input disabled={!canEdit} inputMode="decimal" value={String(r.arrears ?? '')} onChange={(e) => setCell(r.month_seq, 'arrears', e.target.value.replace(/[^0-9.]/g, ''))} className={inp} />
                      : <div className={inpRO}>{r.arrears ?? ''}</div>}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-600"><div className={inpRO}>{r.late_fee ?? ''}</div></td>
                  <td className="border border-gray-200 px-1.5 py-1 text-center font-semibold dark:border-gray-600">{r.total ?? ''}</td>
                  <td className="border border-gray-200 dark:border-gray-600"><input disabled={!canEdit} value={String(r.receipt_no ?? '')} onChange={(e) => setCell(r.month_seq, 'receipt_no', e.target.value)} className={inp} /></td>
                  <td className="border border-gray-200 dark:border-gray-600 min-w-[130px]">
                    <DatePicker format="DD-MM-YYYY" disabled={!canEdit} value={String(r.receipt_date ?? '').slice(0, 10)} onChange={(v) => setCell(r.month_seq, 'receipt_date', v)} placeholder="दिनांक" />
                  </td>
                  <td className="border border-gray-200 dark:border-gray-600"><input disabled={!canEdit} inputMode="decimal" value={String(r.paid_amount ?? '')} onChange={(e) => setCell(r.month_seq, 'paid_amount', e.target.value.replace(/[^0-9.]/g, ''))} className={inp} /></td>
                  <td className="border border-gray-200 px-1.5 py-1 text-center font-semibold text-primary-700 dark:border-gray-600 dark:text-primary-300">{r.balance ?? ''}</td>
                  <td className="border border-gray-200 dark:border-gray-600"><input disabled={!canEdit} value={String(r.remark ?? '')} onChange={(e) => setCell(r.month_seq, 'remark', e.target.value)} className={inp} /></td>
                  <td className="border border-gray-200 px-1 dark:border-gray-600">
                    {canEdit && rowFilled(r) && <button onClick={() => saveRow(r)} disabled={savingSeq === r.month_seq} className={`rounded px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50 ${r.id ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-600 hover:bg-primary-700'}`}>{savingSeq === r.month_seq ? '...' : (r.id ? 'अद्यतन' : 'जतन')}</button>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {!canEdit && <p className="mt-2 text-xs text-gray-400">तुम्हाला संपादन परवानगी नाही (view only)</p>}
        </div>
        </>
        )}

        {/* bill config — bill tab */}
        {tab === 'bill' && (
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <h3 className="mb-2 text-sm font-bold text-primary-700 dark:text-primary-300">बिल छपाईसाठी तपशील (मागणी बिल)</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">पासून महिना</label>
              <select value={bill.fromSeq} onChange={(e) => setBill({ ...bill, fromSeq: Number(e.target.value) })} className={fieldCls}>
                {WATER_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">पर्यंत महिना</label>
              <select value={bill.toSeq} onChange={(e) => setBill({ ...bill, toSeq: Number(e.target.value) })} className={fieldCls}>
                {WATER_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">देय दिनांक</label>
              <DatePicker format="DD-MM-YYYY" value={bill.dueDate} onChange={(v) => setBill({ ...bill, dueDate: v })} placeholder="देय दिनांक" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">मागील थकबाकी (₹)</label>
              <input inputMode="decimal" value={bill.magil} onChange={(e) => setBill({ ...bill, magil: e.target.value })} className={fieldCls} placeholder="auto" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">बिल भरणा केंद्र</label>
              <input value={bill.center} onChange={(e) => setBill({ ...bill, center: e.target.value })} className={fieldCls} placeholder="उदा. संस्कृती सभागृह" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">केंद्र पत्ता</label>
              <input value={bill.centerAddr} onChange={(e) => setBill({ ...bill, centerAddr: e.target.value })} className={fieldCls} placeholder="पत्ता" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">मागील भरणा पावती क्र/दिनांक</label>
              <input value={bill.prevReceipt} onChange={(e) => setBill({ ...bill, prevReceipt: e.target.value })} className={fieldCls} placeholder="क्रमांक / दिनांक" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">थकबाकी माहे</label>
              <input value={bill.magilMonth} onChange={(e) => setBill({ ...bill, magilMonth: e.target.value })} className={fieldCls} placeholder="उदा. मार्च 2026" />
            </div>
            <div className="col-span-2 sm:col-span-3 lg:col-span-6">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">सूचना</label>
              <textarea value={bill.notes} onChange={(e) => setBill({ ...bill, notes: e.target.value })} className={fieldCls} rows={2} placeholder="सूचना" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            {canEdit && (
              <button onClick={handleSaveBill} disabled={savingBill} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {savingBill ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />} बिल जतन करा
              </button>
            )}
            <button onClick={() => doPrint('bill')} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"><Receipt className="h-4 w-4" /> बिल प्रिंट</button>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">"बिल जतन" ने DB मध्ये साठवा (tracking). "बिल प्रिंट" दाबल्यावरही आपोआप साठते व २ प्रती छापल्या जातात.</p>
        </div>
        )}
      </div>

      {/* ===== PRINT: REGISTER (Sheet1) ===== */}
      {printMode === 'register' && (
        <div className="print-area bg-white pb-4 pr-4 pt-10 pl-16 text-black" style={{ colorScheme: 'light' }}>
          <div className="text-center">
            <p className="text-[20px] font-bold">गट ग्रामपंचायत कार्यालय {H.gp}</p>
            {meter.water_supply_name && <p className="text-sm">पाणी पुरवठा {meter.water_supply_name}</p>}
            <p className="text-xs">पंचायत समिती: {H.samiti} · जिल्हा: {H.district}</p>
            <p className="mt-1 text-sm font-bold">मिटर रिडिंग रजिस्टर सन {year}-{year + 1}</p>
          </div>
          <div className="mt-2 border border-black text-[15px]">
            <div className="grid grid-cols-6">
              {[['अनु क्र.', meter.anu_kramank], ['मालमत्ता क्र', meter.malmatta_number], ['वार्ड क्र', meter.ward], ['प्लॉट क्र', meter.plot_number], ['मिटर क्र', meter.meter_number], ['मोबाईल क्र', meter.mobile]].map(([lbl, val], i) => (
                <div key={i} className={`px-2 py-1 ${i < 5 ? 'border-r border-black' : ''}`}>
                  <div className="whitespace-nowrap text-[15px] text-gray-700">{lbl as string}</div>
                  <div className="font-bold">{(val as string) || '-'}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 border-t border-black">
              <div className="border-r border-black px-2 py-1"><span className="whitespace-nowrap text-gray-700">खातेदाराचे नाव: </span><b>{meter.khatedar_name || '-'}</b></div>
              <div className="px-2 py-1"><span className="whitespace-nowrap text-gray-700">भोगवटदाराचे नाव: </span><b>{meter.bhogwatdar_name || '-'}</b></div>
            </div>
            <div className="border-t border-black px-2 py-1"><span className="whitespace-nowrap text-gray-700">पत्ता: </span><b>{meter.address || '-'}</b></div>
          </div>
          <table className="mt-2 w-full border-collapse text-[15px]">
            <colgroup>
              {['', '', '6%', '', '', '7%', '', '', '', '', '', '', '', ''].map((w, i) => (
                <col key={i} style={w ? { width: w } : undefined} />))}
            </colgroup>
            <thead>
              <tr>{['महिना', 'चालु रिडिंग', 'मागील रिडिंग', 'एकूण', 'दर', 'चालु आकारणी', 'थकीत', 'विलंब', 'एकूण', 'पावती क्र', 'दिनांक', 'भरणा', 'थकबाकी', 'शेरा'].map((h, i) => (
                <th key={i} className="border border-black px-1 py-1">{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month_seq}>
                  <td className="border border-black px-1 py-1 text-center">{r.month_name}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.current_reading || ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.previous_reading || ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.ekun_reading ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.rate ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.current_charge ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.arrears ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.late_fee ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center font-bold">{r.total ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.receipt_no || ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.receipt_date ? String(r.receipt_date).slice(0, 10) : ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.paid_amount ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.balance ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center">{r.remark || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 text-right text-xs font-bold">सरपंच / सचिव सही</p>
        </div>
      )}

      {/* ===== PRINT: DEMAND BILL (Sheet2 — two copies) ===== */}
      {printMode === 'bill' && (
        <div className="print-area bg-white p-2 text-black" style={{ colorScheme: 'light' }}>
          <div className="grid grid-cols-2 gap-2">
            {['कार्यालय प्रत', 'ग्राहक प्रत'].map((copyLabel, ci) => (
              <div key={ci} className={ci === 0 ? 'pr-1' : 'pl-1'}>
               <div className="border-2 border-black">
                {/* branded header band */}
                <div className="border-b border-black bg-gray-100 px-2 py-1 text-center">
                  <p className="text-[13px] font-extrabold tracking-wide">गट ग्रामपंचायत कार्यालय {H.gp}</p>
                  {meter.water_supply_name && <p className="text-[10px] font-semibold">पाणी पुरवठा योजना — {meter.water_supply_name}</p>}
                  <p className="text-[9px]">पंचायत समिती: {H.samiti} &nbsp;·&nbsp; जिल्हा: {H.district}</p>
                  <div className="mt-0.5 flex items-center justify-center gap-2">
                    <span className="rounded bg-black px-2 py-0.5 text-[10px] font-bold text-white">पाणी वापर मागणी बिल</span>
                    <span className="text-[10px] font-bold">सन {year}-{year + 1}</span>
                    <span className="rounded border border-black px-1.5 text-[9px] font-semibold">{copyLabel}</span>
                  </div>
                </div>
                {/* property grid — bordered cells */}
                <div className="grid grid-cols-4 border-b border-black text-[9px]">
                  {[['अनु क्र', meter.anu_kramank], ['मा. क्र', meter.malmatta_number], ['वार्ड', meter.ward], ['मिटर क्र', meter.meter_number]].map(([lbl, val], i) => (
                    <div key={i} className={`px-1.5 py-1 ${i < 3 ? 'border-r border-black' : ''}`}>
                      <div className="text-[8px] text-gray-600">{lbl as string}</div>
                      <div className="font-bold">{(val as string) || '-'}</div>
                    </div>
                  ))}
                </div>
                <div className="border-b border-black px-1.5 py-0.5 text-[9px]"><span className="text-gray-600">खातेदार:</span> <b>{meter.khatedar_name}</b>{meter.bhogwatdar_name ? <> &nbsp;·&nbsp; <span className="text-gray-600">भोगवटदार:</span> <b>{meter.bhogwatdar_name}</b></> : null}</div>
                <div className="border-b border-black px-1.5 py-0.5 text-[9px]"><span className="text-gray-600">पत्ता:</span> {meter.address || '-'}</div>
                <div className="flex justify-between bg-gray-50 px-1.5 py-0.5 text-[9px] font-semibold">
                  <span>बिल कालावधी: {WATER_MONTHS[bill.fromSeq - 1]} ते {WATER_MONTHS[bill.toSeq - 1]}</span>
                  {bill.dueDate && <span>देय दिनांक: {bill.dueDate}</span>}
                </div>
               </div>

                <table className="mt-1 w-full border-collapse text-[9px]">
                  <thead>
                    <tr>{['महिना', 'चालू रिडिंग', 'मागील रिडिंग', 'एकूण रिडिंग', 'दर', 'चालु', 'मागील', 'एकूण'].map((h, i) => (
                      <th key={i} className="border border-black px-0.5 py-0.5">{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {billRows.map((r) => (
                      <tr key={r.month_seq}>
                        <td className="border border-black px-0.5 py-0.5 text-center">{r.month_name}</td>
                        <td className="border border-black px-0.5 py-0.5 text-center">{r.current_reading || ''}</td>
                        <td className="border border-black px-0.5 py-0.5 text-center">{r.previous_reading || ''}</td>
                        <td className="border border-black px-0.5 py-0.5 text-center">{r.ekun_reading ?? ''}</td>
                        <td className="border border-black px-0.5 py-0.5 text-center">{r.rate ?? ''}</td>
                        <td className="border border-black px-0.5 py-0.5 text-center">{r.current_charge ?? ''}</td>
                        <td className="border border-black px-0.5 py-0.5 text-center">{r.arrears ?? ''}</td>
                        <td className="border border-black px-0.5 py-0.5 text-center font-bold">{r.total ?? ''}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="border border-black px-0.5 py-0.5">एकूण</td>
                      <td className="border border-black" colSpan={4} />
                      <td className="border border-black px-0.5 py-0.5 text-center">{paaniDeyak}</td>
                      <td className="border border-black px-0.5 py-0.5 text-center">{magilThak}</td>
                      <td className="border border-black px-0.5 py-0.5 text-center">{paaniDeyak + magilThak}</td>
                    </tr>
                  </tbody>
                </table>

                {/* payment details + amount summary — bordered, professional */}
                <div className="mt-1 grid grid-cols-2 gap-1 text-[9px]">
                  {/* left — payment / center details */}
                  <div className="flex flex-col border border-black">
                    <div className="border-b border-black bg-gray-100 px-1.5 py-0.5 text-center font-bold">देयक भरणा तपशील</div>
                    <div className="flex-1 space-y-1 px-1.5 py-1">
                      <div><span className="text-gray-600">मागील भरणा पावती क्र./दिनांक:</span> <b>{bill.prevReceipt || '—'}</b></div>
                      <div><span className="text-gray-600">भरण्याचा अखेरचा दिनांक:</span> <b>{bill.dueDate || '—'}</b></div>
                      <div><span className="text-gray-600">बिल भरणा केंद्र:</span> <b>{bill.center || '—'}</b></div>
                      {bill.centerAddr && <div className="text-gray-700">{bill.centerAddr}</div>}
                    </div>
                  </div>
                  {/* right — amount summary table */}
                  <div className="border border-black">
                    <div className="border-b border-black bg-gray-100 px-1.5 py-0.5 text-center font-bold">देयक रक्कम (रुपये)</div>
                    <table className="w-full border-collapse">
                      <tbody>
                        {[
                          { l: `मागील थकबाकी ${bill.magilMonth ? `(माहे ${bill.magilMonth})` : ''}`, v: magilThak },
                          { l: 'पाणी वापर देयक', v: paaniDeyak },
                          { l: 'एकुण भरणा देयक', v: ekunDeyak, b: true },
                          { l: 'विलंब शुल्क', v: vilamb },
                        ].map((x, i) => (
                          <tr key={i} className={x.b ? 'font-bold' : ''}>
                            <td className="border-b border-r border-black px-1.5 py-0.5">{x.l}</td>
                            <td className="border-b border-black px-1.5 py-0.5 text-right">{x.v}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-900 font-bold text-white">
                          <td className="px-1.5 py-1">देय तारखे नंतर एकूण</td>
                          <td className="px-1.5 py-1 text-right">{deyNantar}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* सूचना */}
                <div className="mt-1 border border-black text-[9px]">
                  <div className="border-b border-black bg-gray-100 px-1.5 py-0.5 font-bold">सूचना</div>
                  <div className="px-1.5 py-1 leading-snug">{bill.notes || '—'}</div>
                </div>

                {/* signatures */}
                <div className="mt-1 grid grid-cols-2 border border-black text-[9px]">
                  <div className="flex h-16 flex-col justify-end border-r border-black px-1.5 py-1 text-center font-bold">वसुलीकर्ता</div>
                  <div className="flex h-16 flex-col justify-end px-1.5 py-1 text-center">
                    <div className="font-bold">सरपंच / सचिव</div>
                    <div>गट ग्रामपंचायत कार्यालय {H.gp}</div>
                    {meter.water_supply_name && <div>पाणी पुरवठा {meter.water_supply_name}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default WaterMeterDetail;

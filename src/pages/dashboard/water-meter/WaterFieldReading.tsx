import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplet, Loader2, Check, Search, AlertTriangle, Camera, X } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { waterMeterService, commonDdlService, WATER_MONTHS, type FieldMeter } from '../../../services';
import { can } from '../../../utils/permissions';
import { fyOfDate, fyLabel } from '../../../utils/fyConfig';
import YearPicker from '../../../components/common/YearPicker';
import { compressImageToDataUrl, base64Bytes } from '../../../utils/imageCompress';

/* पाणी मीटर रीडिंग (फिल्ड) — mobile-friendly quick entry. Ward + महिना निवडा → meter-by-meter
   आताचे reading daalo → auto units/आकारणी/एकूण → जतन. permission: malmatta_nodni.water_meter. */

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

// current calendar month -> FY month_seq (एप्रिल=1)
const currentSeq = () => { const m = new Date().getMonth() + 1; return m >= 4 ? m - 3 : m + 9; };

const WaterFieldReading = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const allowed = can('malmatta_nodni', 'water_meter');
  const [wards, setWards] = useState<(string | number)[]>([]);
  const [ward, setWard] = useState('');
  const [year, setYear] = useState(fyOfDate());
  const [monthSeq, setMonthSeq] = useState(currentSeq());
  const [search, setSearch] = useState('');
  const [meters, setMeters] = useState<FieldMeter[]>([]);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [photos, setPhotos] = useState<Record<number, string>>({}); // meter_id -> compressed base64 (newly captured)
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const onPhoto = async (meterId: number, file: File | null | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file, 1000, 0.6);
      if (base64Bytes(dataUrl) > 900 * 1024) {
        // still too big — re-compress smaller
        const smaller = await compressImageToDataUrl(file, 800, 0.5);
        setPhotos((p) => ({ ...p, [meterId]: smaller }));
      } else {
        setPhotos((p) => ({ ...p, [meterId]: dataUrl }));
      }
    } catch { toast.error('फोटो घेता आला नाही'); }
  };
  const clearPhoto = (meterId: number) => setPhotos((p) => { const n = { ...p }; delete n[meterId]; return n; });

  useEffect(() => {
    document.title = 'पाणी मीटर रीडिंग (फिल्ड)';
    if (!allowed) return;
    (async () => {
      try {
        const res = await commonDdlService.getWards();
        if (res.success) setWards(((res.data as { ward_number: string | number }[]) || []).map((w) => w.ward_number).filter((w) => w !== null && w !== undefined && w !== ''));
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await waterMeterService.fieldMeters(year, monthSeq, ward || undefined, search.trim() || undefined);
      if (res?.success && res.data) {
        setMeters(res.data.meters || []);
        const init: Record<number, string> = {};
        (res.data.meters || []).forEach((m) => { init[m.meter_id] = m.current_reading != null ? String(m.current_reading) : ''; });
        setInputs(init);
      } else setMeters([]);
    } catch { setMeters([]); toast.error('लोड करताना त्रुटी'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (allowed) load(); /* eslint-disable-next-line */ }, [year, monthSeq, ward]);

  const calc = (m: FieldMeter) => {
    const cur = num(inputs[m.meter_id]);
    const prev = num(m.prev_reading);
    // GP model — same as /water-meter/:id : एकून रीडिंग = आत्ताचे + मागील (बेरीज, वजाबाकी नाही).
    const ekun = cur + prev;
    const charge = Math.round(cur * num(m.rate));   // आकारणी = आत्ताचे रीडिंग × दर
    const arrears = Math.round(num(m.arrears));
    const total = charge + arrears;                 // एकूण देय = आकारणी + मागील थकबाकी
    return { cur, prev, ekun, charge, arrears, total };
  };

  const save = async (m: FieldMeter) => {
    const raw = inputs[m.meter_id];
    if (raw === '' || raw == null) { toast.error('आताचे रीडिंग टाका'); return; }
    const { cur, prev, ekun, charge, arrears, total } = calc(m);
    setSavingId(m.meter_id);
    try {
      const photo = photos[m.meter_id];
      const res = await waterMeterService.saveReading(m.meter_id, {
        year, month_seq: monthSeq, month_name: WATER_MONTHS[monthSeq - 1],
        current_reading: String(cur), previous_reading: String(prev),
        units: ekun, ekun_reading: String(ekun), rate: num(m.rate), current_charge: charge,
        arrears, late_fee: 0, total, paid_amount: 0, balance: total,
        ...(photo ? { reading_photo: photo } : {}),
      });
      if (res?.success) {
        toast.success('रीडिंग जतन झाले');
        setMeters((prevList) => prevList.map((x) => x.meter_id === m.meter_id ? { ...x, saved: true, current_reading: String(cur), has_photo: x.has_photo || !!photo } : x));
      } else toast.error(res?.message || 'जतन अयशस्वी');
    } catch (e) { toast.error((e as { message?: string })?.message || 'त्रुटी'); }
    finally { setSavingId(null); }
  };

  const savedCount = useMemo(() => meters.filter((m) => m.saved).length, [meters]);

  if (!allowed) {
    return <div className="flex min-h-[60vh] items-center justify-center px-4 text-center"><div><AlertTriangle className="mx-auto h-10 w-10 text-amber-500" /><p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">या पानाची परवानगी नाही</p></div></div>;
  }

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <button onClick={() => navigate('/water-meter')} className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400"><ArrowLeft className="h-4 w-4" /> पाणी मीटर</button>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white"><Droplet className="h-6 w-6 text-primary-600" /> मीटर रीडिंग (फिल्ड)</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">वॉर्ड + महिना निवडा, आताचे रीडिंग टाका — आपोआप युनिट व आकारणी</p>

        {/* filters */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">वॉर्ड</label>
            <select value={ward} onChange={(e) => setWard(e.target.value)} className={inp}>
              <option value="">सर्व</option>
              {wards.map((w) => <option key={String(w)} value={String(w)}>वॉर्ड {w}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">महिना</label>
            <select value={monthSeq} onChange={(e) => setMonthSeq(Number(e.target.value))} className={inp}>
              {WATER_MONTHS.map((mn, i) => <option key={mn} value={i + 1}>{mn}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">वर्ष</label>
            <YearPicker value={String(year)} onChange={(v) => v && setYear(Number(v))} placeholder="वर्ष" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">शोधा</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} placeholder="मीटर/नाव" className={`${inp} pl-8`} />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">सन {fyLabel(year)} · {WATER_MONTHS[monthSeq - 1]}</span>
          {meters.length > 0 && <span className="font-semibold text-emerald-600 dark:text-emerald-400">{savedCount}/{meters.length} जतन</span>}
        </div>

        {/* meter cards */}
        <div className="mt-3 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
          ) : meters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-600 dark:bg-gray-800">
              <Droplet className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">या निकषात मीटर नाहीत</p>
            </div>
          ) : meters.map((m) => {
            const c = calc(m);
            const busy = savingId === m.meter_id;
            return (
              <div key={m.meter_id} className={`rounded-2xl border p-4 shadow-sm ${m.saved ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-900/10' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{m.khatedar_name || '—'}</p>
                    <p className="text-[11px] text-gray-400">मीटर {m.meter_number || '—'} · वॉर्ड {m.ward || '—'}{m.malmatta_number ? ` · मालमत्ता ${m.malmatta_number}` : ''}</p>
                  </div>
                  {m.saved && <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Check className="h-3 w-3" /> जतन</span>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">मागील</label>
                    <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">{m.prev_reading ?? '—'}</div>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">आताचे *</label>
                    <input type="number" inputMode="numeric" value={inputs[m.meter_id] ?? ''} onChange={(e) => setInputs((s) => ({ ...s, [m.meter_id]: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">एकून रीडिंग</label>
                    <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">{c.ekun}</div>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">एकूण (₹)</label>
                    <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm font-bold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">{c.total}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400">दर ₹{m.rate}/युनिट{c.arrears > 0 ? ` · थकबाकी ₹${c.arrears}` : ''}</span>
                  <div className="flex items-center gap-2">
                    {/* meter photo (compressed) */}
                    {photos[m.meter_id] ? (
                      <div className="relative">
                        <img src={photos[m.meter_id]} alt="मीटर फोटो" className="h-9 w-9 rounded-lg border border-gray-200 object-cover dark:border-gray-600" />
                        <button type="button" onClick={() => clearPhoto(m.meter_id)} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white" title="फोटो काढा"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <label className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${m.has_photo ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'}`} title="मीटरचा फोटो घ्या">
                        <Camera className="h-4 w-4" /> {m.has_photo ? 'फोटो ✓' : 'फोटो'}
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onPhoto(m.meter_id, e.target.files?.[0]); e.target.value = ''; }} />
                      </label>
                    )}
                    <button onClick={() => save(m)} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {m.saved ? 'अद्यतन' : 'जतन'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default WaterFieldReading;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Wallet, Plus, Trash2, Lock, IndianRupee, Pencil, Check, X, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useLoading } from '../../contexts/LoadingContext';
import personalExpenseService, { type ExpenseData, type MonthSheet } from '../../services/personalExpenseService';
import { isCitizen, can } from '../../utils/permissions';
import { MarathiInput } from '../../components/common';
import DatePicker from '../../components/common/DatePicker';
import ExportButtons from '../../components/common/ExportButtons';
import type { ExportColumn } from '../../utils/exportUtils';
import { compressImageToDataUrl, base64Bytes } from '../../utils/imageCompress';

const inr = (n: number) => '₹ ' + Math.round(Number(n || 0)).toLocaleString('en-IN');
const thisMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM
const today = () => new Date().toISOString().slice(0, 10);
const MONTHS = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const emptySheet = (): MonthSheet => ({ budget: 0, expenses: [] });

const PersonalExpense = () => {
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const citizen = isCitizen();
  // citizens manage their OWN data freely; staff need edit/delete permission on this module
  const canEdit = citizen || can('personal_expense', 'edit');
  const canDelete = citizen || can('personal_expense', 'delete');

  const [data, setData] = useState<ExpenseData>({});
  const [month, setMonth] = useState<string>(thisMonth());
  const [autoState, setAutoState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const touched = useRef(false); // becomes true on the first user edit → enables auto-save
  // add-row form
  const [nDate, setNDate] = useState(today());
  const [nName, setNName] = useState('');
  const [nAmt, setNAmt] = useState('');
  const [nImg, setNImg] = useState<string | null>(null); // proof for the new row
  const [viewImg, setViewImg] = useState<string | null>(null); // lightbox
  const nImgRef = useRef<HTMLInputElement>(null); // add-row file input
  const eImgRef = useRef<HTMLInputElement>(null); // edit-row file input

  // compress an image file to a small base64 data URL (proof — cheque/screenshot)
  const pickImage = async (file: File | null | undefined, set: (v: string | null) => void) => {
    if (!file) return;
    try {
      let d = await compressImageToDataUrl(file, 1000, 0.6);
      if (base64Bytes(d) > 900 * 1024) d = await compressImageToDataUrl(file, 800, 0.5);
      set(d);
    } catch { toast.error('फोटो घेता आला नाही'); }
  };

  useEffect(() => {
    document.title = citizen ? 'माझा हिशोब' : 'खर्च नोंद';
    (async () => {
      showLoader('लोड होत आहे...');
      try {
        const res = await personalExpenseService.get();
        if (res?.success && res.data?.data) setData(res.data.data);
      } catch { toast.error('माहिती लोड करता आली नाही'); }
      finally { hideLoader(); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sheet = data[month] || emptySheet();
  const totalExpense = useMemo(() => sheet.expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [sheet]);
  const remaining = Number(sheet.budget || 0) - totalExpense;

  // rows for Excel/PDF (print) export — with running शिल्लक per row
  interface ExpFlat { date: string; name: string; amount: number; balance: number }
  const exportRows: ExpFlat[] = useMemo(() => {
    let run = Number(sheet.budget || 0);
    return sheet.expenses.map((e) => { run -= Number(e.amount || 0); return { date: e.date, name: e.name, amount: e.amount, balance: run }; });
  }, [sheet]);
  const exportCols: ExportColumn<ExpFlat>[] = [
    { header: 'दिनांक', value: (r) => r.date },
    { header: 'खर्चाचे नाव', value: (r) => r.name },
    { header: 'रक्कम', value: (r) => r.amount },
    { header: 'शिल्लक', value: (r) => r.balance },
  ];

  const setSheet = (patch: Partial<MonthSheet>) => {
    touched.current = true; // any edit → auto-save kicks in
    setData((d) => ({ ...d, [month]: { ...emptySheet(), ...(d[month] || {}), ...patch } }));
  };

  const setBudget = (v: string) => setSheet({ budget: Number(v) || 0 });

  const addRow = () => {
    const amt = Number(nAmt);
    if (!nName.trim()) { toast.error('खर्चाचे नाव टाका'); return; }
    if (!amt || amt <= 0) { toast.error('रक्कम टाका'); return; }
    const row = { id: Date.now(), date: nDate || today(), name: nName.trim(), amount: amt, img: nImg || null };
    setSheet({ expenses: [...(sheet.expenses || []), row] });
    setNName(''); setNAmt(''); setNDate(today()); setNImg(null);
  };

  const delRow = (id: number) => setSheet({ expenses: sheet.expenses.filter((e) => e.id !== id) });

  // inline edit of an existing row
  const [editId, setEditId] = useState<number | null>(null);
  const [eDate, setEDate] = useState('');
  const [eName, setEName] = useState('');
  const [eAmt, setEAmt] = useState('');
  const [eImg, setEImg] = useState<string | null>(null);
  const startEdit = (e: { id: number; date: string; name: string; amount: number; img?: string | null }) => {
    setEditId(e.id); setEDate(e.date); setEName(e.name); setEAmt(String(e.amount)); setEImg(e.img || null);
  };
  const cancelEdit = () => setEditId(null);
  const saveEdit = () => {
    const amt = Number(eAmt);
    if (!eName.trim()) { toast.error('खर्चाचे नाव टाका'); return; }
    if (!amt || amt <= 0) { toast.error('रक्कम टाका'); return; }
    setSheet({ expenses: sheet.expenses.map((x) => (x.id === editId ? { ...x, date: eDate || today(), name: eName.trim(), amount: amt, img: eImg || null } : x)) });
    setEditId(null);
  };

  // Auto-save: no manual "जतन" button — any change (add / edit / delete / budget) is
  // saved automatically (debounced). Encrypted server-side.
  const doSave = useCallback(async (d: ExpenseData) => {
    try {
      const res = await personalExpenseService.save(d);
      setAutoState(res?.success ? 'saved' : 'error');
    } catch { setAutoState('error'); }
  }, []);

  useEffect(() => {
    if (!touched.current) return;      // don't save the just-loaded data
    setAutoState('saving');
    const t = setTimeout(() => doSave(data), 700);
    return () => clearTimeout(t);
  }, [data, doSave]);

  // ---- View mode + Year / multi-year report ----
  const [mode, setMode] = useState<'entry' | 'report'>('entry');
  const [reportYear, setReportYear] = useState<string>(String(new Date().getFullYear()));

  const availableYears = useMemo(() => {
    const ys = new Set<string>();
    Object.keys(data).forEach((m) => { const y = m.slice(0, 4); if (/^\d{4}$/.test(y)) ys.add(y); });
    const arr = Array.from(ys).sort().reverse();
    return arr.length ? arr : [String(new Date().getFullYear())];
  }, [data]);

  // year options for the entry month/year selector (current ±, + any years with data)
  const pickYears = useMemo(() => {
    const cur = new Date().getFullYear();
    const set = new Set<number>();
    for (let y = cur - 6; y <= cur + 1; y++) set.add(y);
    availableYears.forEach((y) => set.add(Number(y)));
    set.add(Number(month.slice(0, 4)));
    return Array.from(set).filter((y) => y > 1900).sort((a, b) => b - a).map(String);
  }, [availableYears, month]);

  // DATE-WISE detailed report: every expense (कोणत्या दिनांकाला काय), date-sorted,
  // with a running शिल्लक (period's total budget − cumulative expense).
  const fmtDMY = (d: string) => { const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(d); };
  interface DetailRow { date: string; name: string; amount: number; balance: number }
  const { reportDetail, reportTotals } = useMemo(() => {
    const keys = Object.keys(data).filter((m) => reportYear === 'all' || m.startsWith(reportYear + '-')).sort();
    let budget = 0;
    const items: { date: string; name: string; amount: number }[] = [];
    keys.forEach((k) => {
      const s = data[k];
      budget += Number(s.budget || 0);
      (s.expenses || []).forEach((e) => items.push({ date: e.date, name: e.name, amount: Number(e.amount || 0) }));
    });
    items.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    let run = budget;
    const detail: DetailRow[] = items.map((it) => { run -= it.amount; return { ...it, balance: run }; });
    const expense = items.reduce((a, x) => a + x.amount, 0);
    return { reportDetail: detail, reportTotals: { budget, expense, balance: budget - expense } };
  }, [data, reportYear]);

  const reportCols: ExportColumn<DetailRow>[] = [
    { header: 'दिनांक', value: (r) => fmtDMY(r.date) },
    { header: 'खर्चाचे नाव', value: (r) => r.name },
    { header: 'रक्कम', value: (r) => r.amount },
    { header: 'शिल्लक', value: (r) => r.balance },
  ];

  // running remaining after each row (budget - cumulative)
  let running = Number(sheet.budget || 0);

  const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  return (
    <>
      <ToastContainer />
      <div className="mx-auto max-w-6xl space-y-5 p-4">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              <Wallet className="h-6 w-6 text-primary-600" /> {citizen ? 'माझा हिशोब' : 'खर्च नोंद (GP)'}
            </h1>
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Lock className="h-3 w-3" /> {citizen ? 'तुमचा वैयक्तिक हिशोब — एनक्रिप्टेड व फक्त तुम्हाला दिसतो.' : 'ग्रामपंचायतीचा खर्च — एनक्रिप्टेड व फक्त तुम्हाला दिसतो.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* auto-save status — no manual save button */}
            <span className="flex items-center gap-1 text-xs">
              {autoState === 'saving' ? (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> जतन होत आहे...</span>
              ) : autoState === 'saved' ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> जतन झाले 🔒</span>
              ) : autoState === 'error' ? (
                <span className="text-red-500">⚠ जतन अयशस्वी</span>
              ) : null}
            </span>
            {/* view mode toggle */}
            <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
              {(['entry', 'report'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-sm font-medium ${mode === m ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 dark:bg-gray-700 dark:text-gray-200'}`}>
                  {m === 'entry' ? 'महिना' : 'अहवाल'}
                </button>
              ))}
            </div>
            {mode === 'entry' ? (
              <>
                {/* custom month + year selector — full-width own row (same as अहवाल) */}
                <div className="flex w-full items-center gap-2">
                  <select value={Number(month.slice(5, 7))} onChange={(e) => setMonth(`${month.slice(0, 4)}-${String(e.target.value).padStart(2, '0')}`)} className={`${inp} min-w-0 flex-1`}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={month.slice(0, 4)} onChange={(e) => setMonth(`${e.target.value}-${month.slice(5, 7)}`)} className={`${inp} !w-28 shrink-0`}>
                    {pickYears.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <ExportButtons columns={exportCols} rows={exportRows} filename={`kharch-${month}`}
                  title={`खर्च नोंद — ${month}`}
                  subtitle={`मासिक रक्कम: ${inr(sheet.budget || 0)} · एकूण खर्च: ${inr(totalExpense)} · शिल्लक: ${inr(remaining)}`} />
              </>
            ) : (
              <>
                <select value={reportYear} onChange={(e) => setReportYear(e.target.value)} className={`${inp} w-auto`}>
                  {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                  <option value="all">सर्व वर्षे</option>
                </select>
                <ExportButtons columns={reportCols} rows={reportDetail} filename={`kharch-report-${reportYear}`}
                  title={`खर्च अहवाल (दिनांकनिहाय) — ${reportYear === 'all' ? 'सर्व वर्षे' : reportYear}`}
                  subtitle={`एकूण रक्कम: ${inr(reportTotals.budget)} · एकूण खर्च: ${inr(reportTotals.expense)} · शिल्लक: ${inr(reportTotals.balance)}`} />
              </>
            )}
          </div>
        </div>

        {mode === 'entry' && (<>
        {/* monthly amount (top) */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">मासिक रक्कम (या महिन्याची):</label>
          <div className="relative">
            <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input inputMode="numeric" value={sheet.budget || ''} onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className={`${inp} w-40 pl-8`} />
          </div>
        </div>

        {/* summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'मासिक रक्कम', v: sheet.budget || 0, c: 'text-primary-700 dark:text-primary-300' },
            { l: 'एकूण खर्च', v: totalExpense, c: 'text-red-600 dark:text-red-400' },
            { l: 'शिल्लक', v: remaining, c: remaining < 0 ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className={`text-lg font-bold tabular-nums ${s.c}`}>{inr(s.v)}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>

        {/* add row — always a single line : छोटी दिनांक · नाव · रक्कम · पुरावा · जोडा */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="w-[8.5rem] shrink-0">
            <DatePicker format="DD-MM-YYYY" value={nDate} onChange={(v) => setNDate(v || today())} placeholder="दिनांक" />
          </div>
          <div className="min-w-0 flex-1">
            <MarathiInput name="exp" value={nName} onChange={(e) => setNName(e.target.value)} placeholder="खर्चाचे नाव (उदा. किराणा)" className={`${inp} w-full`} />
          </div>
          <input inputMode="numeric" value={nAmt} onChange={(e) => setNAmt(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && addRow()} placeholder="रक्कम" className={`${inp} !w-28 shrink-0`} />
          {/* proof (cheque / screenshot) — file input ALWAYS mounted so its ref stays valid
              even after removing an image (fixes re-upload not opening the picker) */}
          {nImg ? (
            <div className="relative shrink-0">
              <img src={nImg} alt="पुरावा" title="क्लिक करून पहा (View)" className="h-10 w-10 cursor-zoom-in rounded-lg border border-gray-300 object-cover ring-1 ring-transparent transition hover:ring-primary-500 dark:border-gray-600" onClick={() => setViewImg(nImg)} />
              <button type="button" onClick={() => setNImg(null)} title="काढा" className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => nImgRef.current?.click()} className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-2 text-xs font-medium text-gray-600 dark:border-gray-600 dark:text-gray-300" title="पुरावा (चेक/स्क्रीनशॉट)">
              <Camera className="h-4 w-4" /> <span className="hidden sm:inline">पुरावा</span>
            </button>
          )}
          <input ref={nImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickImage(e.target.files?.[0], setNImg); e.target.value = ''; }} />
          <button onClick={addRow} title="जोडा" className="flex shrink-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">जोडा</span>
          </button>
        </div>

        {/* table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-3 py-2 font-medium">दिनांक</th>
                <th className="px-3 py-2 font-medium">खर्चाचे नाव</th>
                <th className="px-3 py-2 text-right font-medium">रक्कम</th>
                <th className="px-3 py-2 text-right font-medium">शिल्लक</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {sheet.expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-400">या महिन्यात कोणताही खर्च नाही</td></tr>
              ) : sheet.expenses.map((e) => {
                running -= Number(e.amount || 0);
                const editing = editId === e.id;
                return (
                  <tr key={e.id} className="text-gray-800 dark:text-gray-200">
                    {editing ? (
                      <>
                        <td className="px-2 py-1.5"><DatePicker format="DD-MM-YYYY" value={eDate} onChange={(v) => setEDate(v || today())} placeholder="दिनांक" /></td>
                        <td className="px-2 py-1.5"><MarathiInput name="ename" value={eName} onChange={(ev) => setEName(ev.target.value)} className={inp} /></td>
                        <td className="px-2 py-1.5"><input inputMode="numeric" value={eAmt} onChange={(ev) => setEAmt(ev.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(ev) => ev.key === 'Enter' && saveEdit()} className={`${inp} text-right`} /></td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-400">{inr(running)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {eImg ? (
                              <span className="relative">
                                <img src={eImg} alt="पुरावा" onClick={() => setViewImg(eImg)} className="h-7 w-7 cursor-pointer rounded border border-gray-200 object-cover dark:border-gray-600" />
                                <button type="button" onClick={() => setEImg(null)} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"><X className="h-2.5 w-2.5" /></button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => eImgRef.current?.click()} className="cursor-pointer text-gray-500 hover:text-gray-700" title="पुरावा जोडा">
                                <Camera className="h-4 w-4" />
                              </button>
                            )}
                            <input ref={eImgRef} type="file" accept="image/*" className="hidden" onChange={(ev) => { pickImage(ev.target.files?.[0], setEImg); ev.target.value = ''; }} />
                            <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-800" title="जतन"><Check className="h-4 w-4" /></button>
                            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600" title="रद्द"><X className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">{e.date}</td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            {e.name}
                            {e.img && <img src={e.img} alt="पुरावा" onClick={() => setViewImg(e.img || null)} className="h-7 w-7 shrink-0 cursor-pointer rounded border border-gray-200 object-cover dark:border-gray-600" title="पुरावा पहा" />}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-red-600 dark:text-red-400">− {inr(e.amount)}</td>
                        <td className={`px-3 py-2 text-right font-semibold tabular-nums ${running < 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>{inr(running)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && <button onClick={() => startEdit(e)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400" title="संपादित"><Pencil className="h-4 w-4" /></button>}
                            {canDelete && <button onClick={() => delRow(e.id)} className="text-red-500 hover:text-red-700" title="हटवा"><Trash2 className="h-4 w-4" /></button>}
                            {!canEdit && !canDelete && <span className="text-[11px] text-gray-400">—</span>}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-center text-[11px] text-gray-400">बदल आपोआप जतन होतात 🔒 (Auto-saved)</p>
        </>)}

        {/* ===== अहवाल (Year / multi-year report) ===== */}
        {mode === 'report' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'एकूण रक्कम', v: reportTotals.budget, c: 'text-primary-700 dark:text-primary-300' },
                { l: 'एकूण खर्च', v: reportTotals.expense, c: 'text-red-600 dark:text-red-400' },
                { l: 'शिल्लक', v: reportTotals.balance, c: reportTotals.balance < 0 ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className={`text-lg font-bold tabular-nums ${s.c}`}>{inr(s.v)}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="px-3 py-2 font-medium">दिनांक</th>
                    <th className="px-3 py-2 font-medium">खर्चाचे नाव</th>
                    <th className="px-3 py-2 text-right font-medium">रक्कम</th>
                    <th className="px-3 py-2 text-right font-medium">शिल्लक</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {reportDetail.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-400">या कालावधीसाठी नोंद नाही</td></tr>
                  ) : reportDetail.map((r, i) => (
                    <tr key={i} className="text-gray-800 dark:text-gray-200">
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">{fmtDMY(r.date)}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-600 dark:text-red-400">− {inr(r.amount)}</td>
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${r.balance < 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>{inr(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                {reportDetail.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-bold dark:border-gray-600">
                      <td className="px-3 py-2" colSpan={2}>एकूण खर्च</td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-600">{inr(reportTotals.expense)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-600">{inr(reportTotals.balance)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <p className="text-center text-[11px] text-gray-400">{reportYear === 'all' ? 'सर्व वर्षे' : reportYear} — दिनांकनिहाय संपूर्ण नोंदी · PDF/Excel एक्सपोर्ट करा</p>
          </div>
        )}
      </div>

      {/* proof image lightbox */}
      {viewImg && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4" onClick={() => setViewImg(null)}>
          <img src={viewImg} alt="पुरावा" className="max-h-[90vh] max-w-full rounded-lg object-contain" />
          <button onClick={() => setViewImg(null)} className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"><X className="h-5 w-5" /></button>
        </div>
      )}
    </>
  );
};

export default PersonalExpense;

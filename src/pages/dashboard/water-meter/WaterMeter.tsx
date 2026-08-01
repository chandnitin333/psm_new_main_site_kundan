import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, X, Save, Droplet, FileText, Search } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { can } from '../../../utils/permissions';
import { trackAction } from '../../../utils/tracker';
import { waterMeterService, type WaterMeter as Meter } from '../../../services';
import { MarathiInput } from '../../../components/common';

// Only these two are editable on a meter — everything else comes from the nodni
// (property registration) and is read-only. Same rule as /water-meter/:id.
interface MeterForm { meter_number: string; water_supply_name: string }

const WaterMeter = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [items, setItems] = useState<Meter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMeter, setEditMeter] = useState<Meter | null>(null);
  const [mForm, setMForm] = useState<MeterForm>({ meter_number: '', water_supply_name: '' });
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);

  const canEdit = can('water_meter', 'edit');
  const canDelete = can('water_meter', 'delete');

  const load = useCallback(async (q = '') => {
    try {
      const res = await waterMeterService.list(q);
      setItems(res?.success && Array.isArray(res.data) ? res.data : []);
    } catch { toast.error('मीटर लोड करताना त्रुटी / Error loading'); }
    finally { setIsLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const didLoad = useRef(false);
  useEffect(() => { document.title = 'पाणी मीटर / Water Meter'; if (didLoad.current) return; didLoad.current = true; load(); }, [load]);

  useEffect(() => {
    if (drawerOpen) {
      const b = document.body.style.overflow, h = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
      return () => { document.body.style.overflow = b; document.documentElement.style.overflow = h; };
    }
  }, [drawerOpen]);

  const setMF = (k: keyof MeterForm, v: string) => setMForm((f) => ({ ...f, [k]: v }));
  const openEdit = (m: Meter) => {
    setEditMeter(m);
    setMForm({ meter_number: m.meter_number || '', water_supply_name: m.water_supply_name || '' });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!editMeter) return;
    setSaving(true);
    try {
      const payload = { meter_number: mForm.meter_number || '', water_supply_name: mForm.water_supply_name || '' };
      await waterMeterService.update(editMeter.id, payload);
      trackAction(`पाणी मीटर तपशील अद्यतन — ${editMeter.khatedar_name || ''}`, { page: '/water-meter', mode: 'update', meter_id: editMeter.id });
      toast.success('मीटर तपशील जतन झाले');
      setDrawerOpen(false);
      await load(search);
    } catch (e) { toast.error((e as { message?: string })?.message || 'जतन अयशस्वी'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (delId === null) return;
    try { showLoader('हटवत आहे...'); await waterMeterService.remove(delId); trackAction('पाणी मीटर हटवला', { page: '/water-meter', mode: 'delete', meter_id: delId }); hideLoader(); setDelId(null); toast.success('हटवले'); await load(search); }
    catch (e) { hideLoader(); setDelId(null); toast.error((e as { message?: string })?.message || 'हटवणे अयशस्वी'); }
  };

  const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
  const roCls = `${inp} cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-gray-700/60`;
  const lbl = 'mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400';

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                <Droplet className="h-6 w-6 text-primary-600" /> पाणी मीटर (Water Meter)
              </h1>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">मीटर मालमत्ता नोंदणीमधून तयार होतात — येथे तपासा व संपादित करा.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => navigate('/water-meter/field-reading')} className="flex items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20"><Droplet className="h-4 w-4" /> फिल्ड रीडिंग</button>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(search)}
                placeholder="मीटर क्र / नाव / मोबाईल शोधा" className={`${inp} pl-9`} />
            </div>
            <button onClick={() => load(search)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">शोधा</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>{['अनु क्र', 'मीटर क्र', 'खातेदार', 'मोबाईल', 'वॉर्ड', 'दर', 'कृती'].map((h) => (
                  <th key={h} className="border-b border-gray-200 px-3 py-2 text-left text-xs font-bold uppercase text-gray-700 dark:border-gray-600 dark:text-gray-300">{h}</th>))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (<tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">लोड होत आहे...</td></tr>)
                : items.length === 0 ? (<tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">कोणतेही मीटर नाही — मालमत्ता नोंदणीमधून मीटर तयार करा</td></tr>)
                : items.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{m.anu_kramank || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{m.meter_number || '-'}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">{m.khatedar_name}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{m.mobile || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{m.ward || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{m.rate ?? 0}</td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/water-meter/${m.id}`)} title="रीडिंग / बिल" className="flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300"><FileText className="h-3.5 w-3.5" /> रीडिंग/बिल</button>
                        {canEdit && <button onClick={() => openEdit(m)} title="संपादित" className="text-blue-600 hover:text-blue-800 dark:text-blue-400"><Pencil className="h-4 w-4" /></button>}
                        {canDelete && <button onClick={() => setDelId(m.id)} title="हटवा" className="text-red-600 hover:text-red-800 dark:text-red-400"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit drawer — same as /water-meter/:id : only मीटर क्रमांक + पाणी पुरवठा योजनेचे नाव editable,
          rest read-only from the nodni (property registration). */}
      <div className={`fixed inset-0 z-[1001] bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setDrawerOpen(false)} />
      <div className={`fixed right-0 top-0 z-[1002] flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-800 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-gray-200 bg-primary-600 px-5 py-4 text-white dark:border-gray-700">
          <h3 className="text-lg font-bold">मीटर तपशील संपादित करा</h3>
          <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-white/20"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <p className="mb-3 text-[11px] text-gray-400">फक्त मीटर क्रमांक व पाणी पुरवठा योजनेचे नाव संपादित करता येईल. बाकी तपशील नोंदणी (nodni) फॉर्ममधून येतो — read-only.</p>
          {/* editable */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className={`${lbl} text-primary-700 dark:text-primary-300`}>मीटर क्रमांक</label><MarathiInput name="mn" value={mForm.meter_number || ''} onChange={(e) => setMF('meter_number', e.target.value)} className={inp} placeholder="मीटर क्रमांक" /></div>
            <div><label className={`${lbl} text-primary-700 dark:text-primary-300`}>पाणी पुरवठा योजनेचे नाव</label><MarathiInput name="ws" value={mForm.water_supply_name || ''} onChange={(e) => setMF('water_supply_name', e.target.value)} className={inp} placeholder="उदा. बोरखेडी (फाटक)" /></div>
          </div>
          {/* read-only — from nodni */}
          <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">नोंदणी तपशील (read-only)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {([['अनु क्र', editMeter?.anu_kramank], ['मालमत्ता क्र', editMeter?.malmatta_number], ['वॉर्ड क्र', editMeter?.ward], ['प्लॉट क्र', editMeter?.plot_number], ['मोबाईल', editMeter?.mobile], ['खातेदाराचे नाव', editMeter?.khatedar_name], ['भोगवटदाराचे नाव', editMeter?.bhogwatdar_name], ['पत्ता', editMeter?.address]] as [string, string | undefined][]).map(([l, v], i) => (
              <div key={i} className={l === 'खातेदाराचे नाव' || l === 'भोगवटदाराचे नाव' || l === 'पत्ता' ? 'sm:col-span-2' : ''}>
                <label className={lbl}>{l}</label>
                <input value={v || '-'} readOnly disabled className={roCls} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <button onClick={() => setDrawerOpen(false)} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200">रद्द</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">{saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />} जतन करा</button>
        </div>
      </div>

      {delId !== null && (
        <div className="fixed inset-0 z-[1003] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">हटवण्याची पुष्टी</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">हा मीटर व त्याचे रीडिंग हटवायचे का?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelId(null)} className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200">रद्द</button>
              <button onClick={confirmDelete} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700">हटवा</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WaterMeter;

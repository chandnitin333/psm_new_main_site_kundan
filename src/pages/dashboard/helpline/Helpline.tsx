import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Phone, X, Save, LifeBuoy } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { can } from '../../../utils/permissions';
import { trackAction } from '../../../utils/tracker';
import { helplineService, type HelplineContact, type HelplinePayload } from '../../../services';
import { MarathiInput } from '../../../components/common';

const EMPTY: HelplinePayload = {
  category: '', title: '', person_name: '', phone: '',
  alternate_phone: '', address: '', description: '', sort_order: 0, is_active: 1,
};

const Helpline = () => {
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [items, setItems] = useState<HelplineContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<HelplinePayload>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);

  const canAdd = can('helpline', 'add');
  const canEdit = can('helpline', 'edit');
  const canDelete = can('helpline', 'delete');

  // dynamic category suggestions — derived from existing manual entries (grows as new ones are added)
  const categories = Array.from(
    new Set(items.filter((i) => i.source !== 'member' && i.category).map((i) => String(i.category).trim())),
  ).filter(Boolean).sort();

  const load = useCallback(async () => {
    try {
      const res = await helplineService.list();
      setItems(res?.success && Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('हेल्पलाईन लोड करताना त्रुटी / Error loading');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const didLoad = useRef(false);
  useEffect(() => {
    document.title = 'हेल्पलाईन व्यवस्थापन / Helpline';
    if (didLoad.current) return;   // guard StrictMode double-invoke in dev
    didLoad.current = true;
    load();
  }, [load]);

  // lock outer page scroll while the drawer is open (only the drawer scrolls)
  useEffect(() => {
    if (modalOpen) {
      const b = document.body.style.overflow, h = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => { document.body.style.overflow = b; document.documentElement.style.overflow = h; };
    }
  }, [modalOpen]);

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c: HelplineContact) => {
    setEditingId(c.id);
    setForm({
      category: c.category || '', title: c.title || '', person_name: c.person_name || '',
      phone: c.phone || '', alternate_phone: c.alternate_phone || '', address: c.address || '',
      description: c.description || '', sort_order: c.sort_order || 0, is_active: c.is_active ?? 1,
    });
    setModalOpen(true);
  };
  const setF = (k: keyof HelplinePayload, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!String(form.title || '').trim()) { toast.error('शीर्षक आवश्यक आहे (Title required)'); return; }
    if (!String(form.phone || '').trim()) { toast.error('फोन क्रमांक आवश्यक आहे (Phone required)'); return; }
    setIsSaving(true);
    try {
      if (editingId) {
        await helplineService.update(editingId, form);
        trackAction(`हेल्पलाईन अपडेट केली — ${form.title}`, { page: '/helpline', mode: 'update', helpline_id: editingId });
        toast.success('अपडेट झाले (Updated)');
      } else {
        await helplineService.create(form);
        trackAction(`नवीन हेल्पलाईन जोडली — ${form.title}`, { page: '/helpline', mode: 'create' });
        toast.success('जतन झाले (Saved)');
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      toast.error((e as { message?: string })?.message || 'जतन अयशस्वी (Save failed)');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (c: HelplineContact) => {
    const next = c.is_active ? 0 : 1;
    // optimistic
    setItems((prev) => prev.map((i) => (i.source === c.source && i.id === c.id ? { ...i, is_active: next } : i)));
    try {
      await helplineService.update(c.id, { is_active: next });
      trackAction(`हेल्पलाईन ${next ? 'सक्रिय' : 'निष्क्रिय'} केली — ${c.title}`, { page: '/helpline', mode: 'toggle', helpline_id: c.id });
    } catch (e) {
      // revert on failure
      setItems((prev) => prev.map((i) => (i.source === c.source && i.id === c.id ? { ...i, is_active: c.is_active } : i)));
      toast.error((e as { message?: string })?.message || 'स्थिती बदलणे अयशस्वी (Failed)');
    }
  };

  const confirmDelete = async () => {
    if (delId === null) return;
    const rec = items.find((i) => i.id === delId);
    try {
      showLoader('हटवत आहे... (Deleting...)');
      await helplineService.remove(delId);
      trackAction(`हेल्पलाईन हटवली — ${rec?.title || ''}`, { page: '/helpline', mode: 'delete', helpline_id: delId });
      hideLoader();
      setDelId(null);
      toast.success('हटवले (Deleted)');
      await load();
    } catch (e) {
      hideLoader();
      setDelId(null);
      toast.error((e as { message?: string })?.message || 'हटवणे अयशस्वी (Delete failed)');
    }
  };

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <LifeBuoy className="h-6 w-6 text-primary-600" /> हेल्पलाईन (Helpline)
            </h1>
            {canAdd && (
              <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700">
                <Plus className="h-4 w-4" /> नवीन क्रमांक
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['श्रेणी', 'शीर्षक', 'व्यक्ती', 'फोन', 'पत्ता', 'स्थिती', 'कृती'].map((h) => (
                    <th key={h} className="border-b border-gray-200 px-3 py-2 text-left text-xs font-bold uppercase text-gray-700 dark:border-gray-600 dark:text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">लोड होत आहे...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">कोणतेही क्रमांक नाहीत (No records)</td></tr>
                ) : items.map((c) => {
                  const isMember = c.source === 'member';
                  return (
                  <tr key={`${c.source || 'h'}-${c.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {c.category || '-'}
                      {isMember && <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">स्वयं / auto</span>}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">{c.title}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{c.person_name || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-400" />{c.phone}{c.alternate_phone ? `, ${c.alternate_phone}` : ''}</span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{c.address || '-'}</td>
                    <td className="px-3 py-2 text-sm">
                      {isMember || !canEdit ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-200 text-gray-500 dark:bg-gray-600'}`}>
                          {c.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!!c.is_active}
                          onClick={() => toggleActive(c)}
                          title={c.is_active ? 'सक्रिय — बंद करण्यासाठी क्लिक करा' : 'निष्क्रिय — सुरू करण्यासाठी क्लिक करा'}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${c.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${c.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {isMember ? (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button onClick={() => openEdit(c)} title="संपादित करा" className="text-blue-600 hover:text-blue-800 dark:text-blue-400"><Pencil className="h-4 w-4" /></button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDelId(c.id)} title="हटवा" className="text-red-600 hover:text-red-800 dark:text-red-400"><Trash2 className="h-4 w-4" /></button>
                          )}
                          {!canEdit && !canDelete && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit drawer — slides in from the right */}
      <div
        className={`fixed inset-0 z-[1001] bg-black/40 transition-opacity duration-300 ${modalOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setModalOpen(false)}
      />
      <div
        className={`fixed right-0 top-0 z-[1002] flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-800 ${modalOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-primary-600 px-5 py-4 text-white dark:border-gray-700">
          <h3 className="text-lg font-bold">{editingId ? 'हेल्पलाईन संपादित करा' : 'नवीन हेल्पलाईन'}</h3>
          <button onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 hover:bg-white/20"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">श्रेणी / Category</label>
              <MarathiInput name="category" value={form.category || ''} onChange={(e) => setF('category', e.target.value)} className={inputCls} placeholder="टाइप करा (उदा. वैद्यकीय)" />
              {categories.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setF('category', c)}
                      className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                        form.category === c
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] text-gray-400">नवीन श्रेणी टाइप करा किंवा वरील पर्याय निवडा</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">शीर्षक / Title *</label>
              <MarathiInput name="title" value={form.title || ''} onChange={(e) => setF('title', e.target.value)} className={inputCls} placeholder="उदा. रेल्वे स्टेशन चौकशी" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">व्यक्तीचे नाव / Person</label>
              <MarathiInput name="person_name" value={form.person_name || ''} onChange={(e) => setF('person_name', e.target.value)} className={inputCls} placeholder="उदा. डॉ. शर्मा" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">फोन / Phone *</label>
              <input value={form.phone} onChange={(e) => setF('phone', e.target.value.replace(/[^0-9,+\s]/g, ''))} className={inputCls} placeholder="9876543210" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">पर्यायी फोन / Alternate</label>
              <input value={form.alternate_phone} onChange={(e) => setF('alternate_phone', e.target.value.replace(/[^0-9,+\s]/g, ''))} className={inputCls} placeholder="कॉमाने वेगळे करा" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">क्रम / Sort order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setF('sort_order', Number(e.target.value) || 0)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">पत्ता / Address</label>
              <MarathiInput name="address" value={form.address || ''} onChange={(e) => setF('address', e.target.value)} className={inputCls} placeholder="पत्ता" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">तपशील / Description</label>
              <MarathiInput multiline rows={2} name="description" value={form.description || ''} onChange={(e) => setF('description', e.target.value)} className={inputCls} placeholder="अतिरिक्त माहिती" />
            </div>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => setF('is_active', e.target.checked ? 1 : 0)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-gray-200">सक्रिय (नागरिकांना दिसेल) / Active (visible to citizens)</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <button onClick={() => setModalOpen(false)} disabled={isSaving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">रद्द</button>
          <button onClick={save} disabled={isSaving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />} जतन करा
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {delId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">हटवण्याची पुष्टी</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">हा हेल्पलाईन क्रमांक हटवायचा आहे का? / Delete this contact?</p>
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

export default Helpline;

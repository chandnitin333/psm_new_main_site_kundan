import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Save, Megaphone, Pin, Upload } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { can } from '../../../utils/permissions';
import { trackAction } from '../../../utils/tracker';
import { postService, type GpPost, type GpPostPayload } from '../../../services';
import { MarathiInput, DatePicker } from '../../../components/common';
import { config } from '../../../config';

const backendBase = config.api.baseUrl.replace(/\/api$/, '');
const EMPTY: GpPostPayload = { category: '', title: '', body: '', image_path: '', is_pinned: 0, publish_at: '', expiry_at: '', is_active: 1 };

const Posts = () => {
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [items, setItems] = useState<GpPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<GpPostPayload>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const canAdd = can('gp_posts', 'add');
  const canEdit = can('gp_posts', 'edit');
  const canDelete = can('gp_posts', 'delete');

  const categories = Array.from(new Set(items.filter((i) => i.category).map((i) => String(i.category).trim()))).filter(Boolean).sort();

  const load = useCallback(async () => {
    try {
      const res = await postService.list();
      setItems(res?.success && Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('सूचना लोड करताना त्रुटी / Error loading');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { document.title = 'सूचना व्यवस्थापन / Posts'; load(); }, [load]);

  useEffect(() => {
    if (drawerOpen) {
      const b = document.body.style.overflow, h = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
      return () => { document.body.style.overflow = b; document.documentElement.style.overflow = h; };
    }
  }, [drawerOpen]);

  const setF = (k: keyof GpPostPayload, v: string | number) => setForm((p) => ({ ...p, [k]: v }));
  const openAdd = () => { setEditingId(null); setForm(EMPTY); setDrawerOpen(true); };
  const openEdit = (p: GpPost) => {
    setEditingId(p.id);
    setForm({
      category: p.category || '', title: p.title || '', body: p.body || '', image_path: p.image_path || '',
      is_pinned: p.is_pinned ?? 0, is_active: p.is_active ?? 1,
      publish_at: p.publish_at || '', expiry_at: p.expiry_at || '',
    });
    setDrawerOpen(true);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('कृपया वैध इमेज निवडा'); return; }
    setUploading(true);
    try {
      const res = await postService.uploadImage(file);
      if (res?.success && res.data?.image_path) { setF('image_path', res.data.image_path); toast.success('इमेज अपलोड झाली'); }
      else throw new Error();
    } catch { toast.error('इमेज अपलोड अयशस्वी'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const save = async () => {
    if (!String(form.title || '').trim()) { toast.error('शीर्षक आवश्यक आहे (Title required)'); return; }
    setIsSaving(true);
    try {
      if (editingId) {
        await postService.update(editingId, form);
        trackAction(`सूचना अपडेट केली — ${form.title}`, { page: '/posts', mode: 'update', post_id: editingId });
        toast.success('अपडेट झाले');
      } else {
        await postService.create(form);
        trackAction(`नवीन सूचना प्रकाशित केली — ${form.title}`, { page: '/posts', mode: 'create' });
        toast.success('जतन झाले');
      }
      setDrawerOpen(false);
      await load();
    } catch (e) {
      toast.error((e as { message?: string })?.message || 'जतन अयशस्वी');
    } finally { setIsSaving(false); }
  };

  const toggleActive = async (p: GpPost) => {
    const next = p.is_active ? 0 : 1;
    setItems((prev) => prev.map((i) => (i.id === p.id ? { ...i, is_active: next } : i)));
    try {
      await postService.update(p.id, { is_active: next });
      trackAction(`सूचना ${next ? 'सक्रिय' : 'निष्क्रिय'} केली — ${p.title}`, { page: '/posts', mode: 'toggle', post_id: p.id });
    } catch {
      setItems((prev) => prev.map((i) => (i.id === p.id ? { ...i, is_active: p.is_active } : i)));
      toast.error('स्थिती बदलणे अयशस्वी');
    }
  };

  const confirmDelete = async () => {
    if (delId === null) return;
    const rec = items.find((i) => i.id === delId);
    try {
      showLoader('हटवत आहे...');
      await postService.remove(delId);
      trackAction(`सूचना हटवली — ${rec?.title || ''}`, { page: '/posts', mode: 'delete', post_id: delId });
      hideLoader(); setDelId(null); toast.success('हटवले'); await load();
    } catch (e) { hideLoader(); setDelId(null); toast.error((e as { message?: string })?.message || 'हटवणे अयशस्वी'); }
  };

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <Megaphone className="h-6 w-6 text-primary-600" /> सूचना (Posts)
            </h1>
            {canAdd && (
              <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                <Plus className="h-4 w-4" /> नवीन सूचना
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['श्रेणी', 'शीर्षक', 'पिन', 'स्थिती', 'कृती'].map((h) => (
                    <th key={h} className="border-b border-gray-200 px-3 py-2 text-left text-xs font-bold uppercase text-gray-700 dark:border-gray-600 dark:text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">लोड होत आहे...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">कोणतीही सूचना नाही (No records)</td></tr>
                ) : items.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{p.category || '-'}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">{p.title}</td>
                    <td className="px-3 py-2 text-sm">{p.is_pinned ? <Pin className="h-4 w-4 text-amber-500" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-sm">
                      {canEdit ? (
                        <button type="button" role="switch" aria-checked={!!p.is_active} onClick={() => toggleActive(p)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${p.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${p.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{p.is_active ? 'सक्रिय' : 'निष्क्रिय'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        {canEdit && <button onClick={() => openEdit(p)} title="संपादित करा" className="text-blue-600 hover:text-blue-800 dark:text-blue-400"><Pencil className="h-4 w-4" /></button>}
                        {canDelete && <button onClick={() => setDelId(p.id)} title="हटवा" className="text-red-600 hover:text-red-800 dark:text-red-400"><Trash2 className="h-4 w-4" /></button>}
                        {!canEdit && !canDelete && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit drawer */}
      <div className={`fixed inset-0 z-[1001] bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setDrawerOpen(false)} />
      <div className={`fixed right-0 top-0 z-[1002] flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-800 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-gray-200 bg-primary-600 px-5 py-4 text-white dark:border-gray-700">
          <h3 className="text-lg font-bold">{editingId ? 'सूचना संपादित करा' : 'नवीन सूचना'}</h3>
          <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-white/20"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">श्रेणी / Category</label>
              <MarathiInput name="category" value={form.category || ''} onChange={(e) => setF('category', e.target.value)} className={inputCls} placeholder="उदा. सूचना, योजना, कार्यक्रम" />
              {categories.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button key={c} type="button" onClick={() => setF('category', c)}
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${form.category === c ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300'}`}>{c}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">शीर्षक / Title *</label>
              <MarathiInput name="title" value={form.title || ''} onChange={(e) => setF('title', e.target.value)} className={inputCls} placeholder="सूचनेचे शीर्षक" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">तपशील / Body</label>
              <MarathiInput multiline rows={4} name="body" value={form.body || ''} onChange={(e) => setF('body', e.target.value)} className={inputCls} placeholder="सविस्तर मजकूर" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">प्रकाशित दिनांक व वेळ / Publish</label>
              <DatePicker showTime defaultTime="start" format="DD-MM-YYYY" value={form.publish_at || ''} onChange={(v) => setF('publish_at', v)} placeholder="दिनांक व वेळ निवडा" />
              <p className="mt-1 text-[11px] text-gray-400">डीफॉल्ट सकाळी १२:०० — वेळ बदलता येईल</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">समाप्ती दिनांक व वेळ / Expiry</label>
              <DatePicker showTime defaultTime="end" format="DD-MM-YYYY" value={form.expiry_at || ''} onChange={(v) => setF('expiry_at', v)} placeholder="दिनांक व वेळ निवडा" />
              <p className="mt-1 text-[11px] text-gray-400">डीफॉल्ट रात्री ११:५९ — वेळ बदलता येईल</p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">इमेज / Image</label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                  {uploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /> : <Upload className="h-4 w-4" />} इमेज निवडा
                  <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
                </label>
                {form.image_path && <img src={`${backendBase}/${form.image_path}`} alt="" className="h-12 w-16 rounded object-cover" />}
                {form.image_path && <button type="button" onClick={() => setF('image_path', '')} className="text-xs text-red-500">काढा</button>}
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.is_pinned} onChange={(e) => setF('is_pinned', e.target.checked ? 1 : 0)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-gray-200">महत्त्वाचे (वर पिन करा) / Pin on top</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => setF('is_active', e.target.checked ? 1 : 0)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-gray-200">सक्रिय (नागरिकांना दिसेल) / Active</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <button onClick={() => setDrawerOpen(false)} disabled={isSaving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200">रद्द</button>
          <button onClick={save} disabled={isSaving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />} जतन करा
          </button>
        </div>
      </div>

      {delId !== null && (
        <div className="fixed inset-0 z-[1003] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">हटवण्याची पुष्टी</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">ही सूचना हटवायची आहे का? / Delete this post?</p>
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

export default Posts;

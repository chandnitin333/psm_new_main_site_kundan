import { useState } from 'react';
import { X, Split } from 'lucide-react';
import { nodniService } from '../services';
import { useToast } from '../hooks/useToast';

/* मालमत्ता विभाजन modal — source record नंतर नवीन (भाऊ/वारस) record.
   त्याच ward चे पुढील anu_kramank आपोआप +1 shift होतात (backend transaction). */

type SourceRec = {
  id: number;
  anu_kramank?: string | number | null;
  ward_kramnak?: string | number | null;
  ghar_malkache_nav?: string | null;
  malmatta_number?: string | null;
};

const PropertyDivideModal = ({ source, onClose, onDone }: { source: SourceRec; onClose: () => void; onDone?: () => void }) => {
  const { toast, ToastContainer } = useToast();
  const srcAnu = Number(source.anu_kramank || 0);
  const newAnu = srcAnu + 1;
  const [f, setF] = useState({
    ghar_malkache_nav: '',
    patni_mulache_nav: '',
    bhogavat_darache_nav: '',
    malmatta_number: source.malmatta_number ? `${source.malmatta_number}/A` : '',
    mobile_number: '',
    aadahar_card_number: '',
    matdar_card_number: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.ghar_malkache_nav.trim()) { toast.error('नवीन खातेधारकाचे नाव आवश्यक'); return; }
    setSaving(true);
    try {
      const res = await nodniService.divide(source.id, f);
      if (res?.success) {
        toast.success(res.message || 'विभाजन यशस्वी');
        setTimeout(() => { onDone?.(); onClose(); }, 700);
      } else {
        toast.error(res?.message || 'विभाजन अयशस्वी');
      }
    } catch (e) {
      toast.error((e as { message?: string })?.message || 'विभाजन अयशस्वी');
    } finally { setSaving(false); }
  };

  const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
  const lbl = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300';

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Split className="h-5 w-5 text-primary-600" /> मालमत्ता विभाजन
            </h3>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
          </div>

          <div className="space-y-3 px-5 py-4">
            <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
              मूळ: <b>{source.ghar_malkache_nav || '-'}</b> · वॉर्ड <b>{String(source.ward_kramnak ?? '-')}</b> · अनु.क्र <b>{srcAnu || '-'}</b>
              <br />नवीन नोंद अनु.क्र <b>{newAnu}</b> वर येईल; पुढील सर्व अनु.क्र आपोआप +1 सरकतील.
            </div>

            <div>
              <label className={lbl}>नवीन खातेधारकाचे नाव *</label>
              <input value={f.ghar_malkache_nav} onChange={(e) => set('ghar_malkache_nav', e.target.value)} className={inp} placeholder="उदा. Kunal Kotangale" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>मालमत्ता क्र.</label>
                <input value={f.malmatta_number} onChange={(e) => set('malmatta_number', e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>मोबाईल</label>
                <input value={f.mobile_number} onChange={(e) => set('mobile_number', e.target.value)} className={inp} inputMode="numeric" />
              </div>
            </div>
            <div>
              <label className={lbl}>पत्नी / मुलांचे नाव</label>
              <input value={f.patni_mulache_nav} onChange={(e) => set('patni_mulache_nav', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>भोगवटदाराचे नाव</label>
              <input value={f.bhogavat_darache_nav} onChange={(e) => set('bhogavat_darache_nav', e.target.value)} className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>आधार कार्ड</label>
                <input value={f.aadahar_card_number} onChange={(e) => set('aadahar_card_number', e.target.value)} className={inp} inputMode="numeric" />
              </div>
              <div>
                <label className={lbl}>वोटर कार्ड</label>
                <input value={f.matdar_card_number} onChange={(e) => set('matdar_card_number', e.target.value)} className={inp} />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              पत्ता, खसरा/सर्वे, क्षेत्रफळ, कर आकारणी इ. मूळ मालमत्तेवरून कॉपी होतील (नंतर संपादित करता येतील).
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">रद्द</button>
            <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
              <Split className="h-4 w-4" /> {saving ? 'सुरू...' : 'विभाजन करा'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyDivideModal;

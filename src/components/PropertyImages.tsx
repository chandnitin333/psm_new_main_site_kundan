import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X, Loader2, History } from 'lucide-react';
import { nodniService } from '../services';
import { useToast } from '../hooks/useToast';
import config from '../config';

/* मालमत्ता फोटो — ek property (nodni) ka photo. Model = existing nodni flow jaisa:
   REPLACE + ARCHIVE. Nayi photo upload karo to wo CURRENT ban jaati hai (report me yahi aati)
   aur purani "जुने फोटो (संदर्भ)" me chali jaati hai — kab kya badla dekhne ke liye.
   Koi delete nahi. Upload sirf canManage (image_upload permission). */

const IMG_BASE = config.api.baseUrl.replace(/\/api\/?$/, '');
const imageUrl = (path: string) => `${IMG_BASE}/${String(path || '').replace(/^\/+/, '')}`;
const fmtD = (v?: string | null) => { if (!v) return ''; const m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10); };

interface PropImage { id: number; nodni_id: number; image_path: string; created_at?: string; }

interface Props {
  nodniId: number;
  canManage?: boolean;
  title?: string;
}

const PropertyImages = ({ nodniId, canManage = false, title = 'मालमत्ता फोटो' }: Props) => {
  const { toast, ToastContainer } = useToast();
  const [current, setCurrent] = useState<PropImage[]>([]);
  const [old, setOld] = useState<PropImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cur, arch] = await Promise.all([
        nodniService.getImagesByNodni(nodniId),
        nodniService.getOldImagesByNodni(nodniId),
      ]);
      setCurrent(cur?.success && Array.isArray(cur.data) ? (cur.data as PropImage[]) : []);
      setOld(arch?.success && Array.isArray(arch.data) ? (arch.data as PropImage[]) : []);
    } catch { setCurrent([]); setOld([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (nodniId) load(); /* eslint-disable-next-line */ }, [nodniId]);

  // single-file replace + archive (same as existing nodni image flow)
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast.error('कृपया इमेज फाईल निवडा'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('इमेज ५MB पेक्षा लहान असावी'); return; }
    setUploading(true);
    try {
      const r = await nodniService.uploadImage(nodniId, file);
      if (r?.success) { toast.success(current.length ? 'फोटो बदलला — जुना संदर्भात जतन झाला' : 'फोटो अपलोड झाला'); load(); }
      else toast.error(r?.message || 'अपलोड अयशस्वी');
    } catch { toast.error('अपलोड करताना त्रुटी'); }
    finally { setUploading(false); }
  };

  const Thumb = ({ img, faded }: { img: PropImage; faded?: boolean }) => (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
      <img src={imageUrl(img.image_path)} alt="property" loading="lazy"
        onClick={() => setLightbox(imageUrl(img.image_path))}
        className={`h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105 ${faded ? 'opacity-80' : ''}`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }} />
      {img.created_at && (
        <span className="absolute bottom-0 left-0 right-0 bg-black/45 px-1 py-0.5 text-center text-[10px] text-white">{fmtD(img.created_at)}</span>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <ToastContainer />
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
          <ImageIcon className="h-4 w-4 text-primary-600" /> {title}
        </h2>
        {canManage && (
          <>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} {current.length ? 'फोटो बदला' : 'फोटो अपलोड'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary-500" /></div>
      ) : (
        <>
          {/* current photo (report मध्ये हीच येते) */}
          {current.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
              <ImageIcon className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">कोणताही फोटो नाही</p>
            </div>
          ) : (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">सध्याचा फोटो (अहवालात येतो)</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {current.map((img) => <Thumb key={img.id} img={img} />)}
              </div>
            </div>
          )}

          {/* archived / reference photos */}
          {old.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
              <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                <History className="h-3.5 w-3.5" /> जुने फोटो (संदर्भ) — {old.length}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {old.map((img) => <Thumb key={`old-${img.id}`} img={img} faded />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"><X className="h-5 w-5" /></button>
          <img src={lightbox} alt="फोटो" className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default PropertyImages;

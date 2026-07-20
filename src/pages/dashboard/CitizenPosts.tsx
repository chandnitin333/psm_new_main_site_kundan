import { useState, useEffect } from 'react';
import { Megaphone, Pin, Calendar, Bell, BellRing } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { postService, type GpPost } from '../../services';
import { config } from '../../config';
import { trackAction } from '../../utils/tracker';
import { pushSupported, isPushSubscribed, enablePush } from '../../utils/push';

const backendBase = config.api.baseUrl.replace(/\/api$/, '');

const fmtDate = (v: unknown) => {
  if (!v) return '';
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const CitizenPosts = () => {
  const { toast, ToastContainer } = useToast();
  const [posts, setPosts] = useState<GpPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => { isPushSubscribed().then(setPushOn); }, []);

  const handleEnablePush = async () => {
    setPushBusy(true);
    const r = await enablePush();
    setPushBusy(false);
    if (r.ok) { setPushOn(true); toast.success('सूचना सुरू झाल्या! नवीन सूचना आल्यावर तुम्हाला कळेल.'); }
    else if (r.reason === 'denied') toast.error('परवानगी नाकारली — ब्राउझर सेटिंग्जमधून सुरू करा');
    else if (r.reason === 'unsupported') toast.error('या डिव्हाइसवर पुश सूचना उपलब्ध नाहीत');
    else toast.error('सूचना सुरू करण्यात अयशस्वी');
  };

  useEffect(() => {
    document.title = 'सूचना / Notices';
    (async () => {
      try {
        const res = await postService.list();
        setPosts(res?.success && Array.isArray(res.data) ? res.data : []);
        // opening the feed clears the unread badge
        postService.markRead().catch(() => {});
        trackAction('नागरिक — सूचना उघडल्या (Citizen opened notices)', { page: '/posts' });
      } catch {
        setPosts([]);
        toast.error('सूचना मिळवण्यात अयशस्वी / Error loading notices');
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ToastContainer />
      <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                <Megaphone className="h-7 w-7 text-primary-600" /> सूचना / Notices
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                ग्रामपंचायतीच्या सूचना व बातम्या / Announcements from your gram panchayat
              </p>
            </div>
            {pushSupported() && (
              pushOn ? (
                <span className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <BellRing className="h-4 w-4" /> सूचना सुरू आहेत
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={pushBusy}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
                >
                  {pushBusy ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Bell className="h-4 w-4" />}
                  सूचना सुरू करा
                </button>
              )
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-600 dark:bg-gray-800">
              <Megaphone className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">सध्या कोणतीही सूचना नाही</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No notices right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  {p.image_path && (
                    <img src={`${backendBase}/${p.image_path}`} alt={p.title || ''} className="max-h-80 w-full object-cover" />
                  )}
                  <div className="p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {p.is_pinned ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <Pin className="h-3 w-3" /> महत्त्वाचे
                        </span>
                      ) : null}
                      {p.category && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">{p.category}</span>
                      )}
                      <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400">
                        <Calendar className="h-3 w-3" /> {fmtDate(p.publish_at || p.created_at)}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{p.title}</h2>
                    {p.body && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{p.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CitizenPosts;

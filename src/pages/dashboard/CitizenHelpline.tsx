import { useState, useEffect } from 'react';
import { Phone, MapPin, User, PhoneCall, LifeBuoy } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { helplineService, type HelplineContact } from '../../services';

const splitPhones = (v: string | null | undefined) =>
  String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

const CitizenHelpline = () => {
  const { toast, ToastContainer } = useToast();
  const [items, setItems] = useState<HelplineContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'हेल्पलाईन / Helpline';
    (async () => {
      try {
        const res = await helplineService.list();
        setItems(res?.success && Array.isArray(res.data) ? res.data : []);
      } catch {
        setItems([]);
        toast.error('हेल्पलाईन माहिती मिळवण्यात अयशस्वी / Error loading helpline');
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // group by category
  const groups = items.reduce<Record<string, HelplineContact[]>>((acc, it) => {
    const key = (it.category || 'इतर / Other').trim() || 'इतर / Other';
    (acc[key] = acc[key] || []).push(it);
    return acc;
  }, {});

  return (
    <>
      <ToastContainer />
      <div className="-mx-4 min-h-full bg-gray-50 px-4 py-5 dark:bg-gray-900 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              <LifeBuoy className="h-7 w-7 text-primary-600" /> हेल्पलाईन / Helpline
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              गावातील उपयुक्त संपर्क क्रमांक / Useful contact numbers in your village
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-600 dark:bg-gray-800">
              <LifeBuoy className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">कोणतेही हेल्पलाईन क्रमांक उपलब्ध नाहीत</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No helpline numbers available yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groups).map(([cat, list]) => (
                <div key={cat}>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary-700 dark:text-primary-300">{cat}</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {list.map((c) => (
                      <div key={`${c.source || 'h'}-${c.id}`} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white">{c.title}</p>
                            {c.person_name && (
                              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                <User className="h-3.5 w-3.5" /> {c.person_name}
                              </p>
                            )}
                          </div>
                        </div>

                        {c.address && (
                          <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" /> {c.address}
                          </p>
                        )}
                        {c.description && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{c.description}</p>
                        )}

                        {/* phones — tap to call */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[...splitPhones(c.phone), ...splitPhones(c.alternate_phone)].map((ph, i) => (
                            <a
                              key={i}
                              href={`tel:${ph}`}
                              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              {i === 0 ? <PhoneCall className="h-4 w-4" /> : <Phone className="h-4 w-4" />} {ph}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
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

export default CitizenHelpline;

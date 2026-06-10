import { useEffect, useState } from 'react';
import { MapPin, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { config } from '../../config';
import { Sk } from '../../components/common/Skeleton';

interface CmsItem {
  id: number;
  image: string | null;
  heading: string | null;     // gram panchayat name
  sub_heading: string | null; // taluka
  body: string | null;        // address
  link: string | null;        // district
  seq: number;
}
interface CmsSection {
  section_key: string;
  heading: string | null;
  sub_heading: string | null;
  items: CmsItem[];
}

const API_ORIGIN = config.api.baseUrl.replace(/\/api$/, '');
const imgUrl = (p?: string | null): string => {
  if (!p) return '';
  if (/^https?:\/\//.test(p)) return p;
  return `${API_ORIGIN}/${String(p).replace(/^\/+/, '')}`;
};

interface Partner {
  id: number; name: string; taluka: string; district: string; address: string; image: string;
}

const Partners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [title, setTitle] = useState('आमचे सहयोगी / Partners');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = 'Partners - आमचे सहयोगी';
    api.get<CmsSection[]>('/public/page/home')
      .then((res) => {
        const data = (res?.data || []) as CmsSection[];
        const sec = Array.isArray(data) ? data.find((s) => s.section_key === 'partners') : null;
        if (sec) {
          if (sec.heading) setTitle(sec.heading);
          setPartners((sec.items || []).map((it) => ({
            id: it.id,
            name: it.heading || '',
            taluka: it.sub_heading || '',
            district: it.link || '',
            address: it.body || '',
            image: imgUrl(it.image),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="absolute top-0 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-0 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" /> सहभागी ग्रामपंचायती
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold">{title}</h1>
          <p className="mt-3 text-primary-100 max-w-2xl mx-auto">
            आमच्यासोबत जोडलेल्या सर्व ग्रामपंचायतींची माहिती
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {!loaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/5">
                  <Sk className="w-full h-44 rounded-none" />
                  <div className="p-5">
                    <Sk className="h-5 w-3/4 mb-3" />
                    <Sk className="h-3.5 w-1/2 mb-2" />
                    <Sk className="h-3.5 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : partners.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-16">
              अद्याप कोणतीही ग्रामपंचायत जोडलेली नाही.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl ring-1 ring-black/5 dark:ring-white/5 transition-all hover:-translate-y-1"
                >
                  <div className="relative w-full h-44 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <Building2 className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {p.name || 'ग्रामपंचायत'}
                    </h3>
                    {(p.taluka || p.district) && (
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {p.taluka && <span>तालुका: <span className="font-medium text-gray-800 dark:text-gray-200">{p.taluka}</span></span>}
                        {p.taluka && p.district && <span className="text-gray-300 dark:text-gray-600">•</span>}
                        {p.district && <span>जिल्हा: <span className="font-medium text-gray-800 dark:text-gray-200">{p.district}</span></span>}
                      </p>
                    )}
                    {p.address && (
                      <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">{p.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Partners;

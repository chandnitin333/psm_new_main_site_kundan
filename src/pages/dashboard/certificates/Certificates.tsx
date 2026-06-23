import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Search, ChevronRight } from 'lucide-react';
import { CERTIFICATES } from '../../../constants/certificates';
import IssuedCertificates from './IssuedCertificates';

const Certificates = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'new' | 'issued'>('new');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CERTIFICATES;
    return CERTIFICATES.filter((c) =>
      `${c.marathi} ${c.name} ${c.purpose}`.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40">
          <Award className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">प्रमाणपत्रे (Certificates)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">ग्रामपंचायतीमार्फत दिली जाणारी प्रमाणपत्रे</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {([['new', 'नवीन प्रमाणपत्र'], ['issued', 'जारी केलेली प्रमाणपत्रे']] as const).map(([key, lbl]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'issued' ? (
        <IssuedCertificates />
      ) : (
      <>
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="प्रमाणपत्र शोधा..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => navigate(`/certificates/${c.slug}`)}
            className="group flex flex-col rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30">
                <Award className="h-5 w-5" />
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  c.category === 'issued'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}
              >
                {c.category === 'issued' ? 'GP द्वारे' : 'पडताळणी'}
              </span>
            </div>
            <p className="font-bold text-gray-900 dark:text-white">{c.marathi}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.name}</p>
            <p className="mt-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{c.purpose}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:gap-2 transition-all">
              {c.built ? 'उघडा' : 'लवकरच'} <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
      </>
      )}
    </div>
  );
};

export default Certificates;

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Building2, Wallet, Award } from 'lucide-react';
import { searchService, type SearchResult } from '../../services/searchService';

/**
 * Header global search — one box to find a property/owner, a vasuli record or an
 * issued certificate across the whole gram panchayat. Debounced; results grouped
 * by type. Clicking a result deep-links to the relevant page (prefilled).
 */
const TYPE_META: Record<SearchResult['type'], { label: string; Icon: typeof Building2; color: string }> = {
  property: { label: 'मालमत्ता / खातेदार', Icon: Building2, color: 'text-blue-600 dark:text-blue-400' },
  vasuli: { label: 'वसुली', Icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400' },
  certificate: { label: 'प्रमाणपत्र', Icon: Award, color: 'text-purple-600 dark:text-purple-400' },
};

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // debounced search
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchService.global(term);
        setResults((res?.data?.results as SearchResult[]) || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (r: SearchResult) => {
    if (r.type === 'property') {
      const p = new URLSearchParams();
      if (r.anu_kramank) p.set('anu_kramank', String(r.anu_kramank));
      if (r.ward_kramnak) p.set('ward_kramnak', String(r.ward_kramnak));
      navigate(`/malmatta-nodni${p.toString() ? `?${p}` : ''}`);
    } else if (r.type === 'vasuli') {
      const p = new URLSearchParams();
      if (r.anu_kramank) p.set('anu_kramank', String(r.anu_kramank));
      if (r.ward_number) p.set('ward_number', String(r.ward_number));
      navigate(`/vasuli${p.toString() ? `?${p}` : ''}`);
    } else if (r.type === 'certificate' && r.cert_type) {
      navigate(`/certificates/${r.cert_type}?id=${r.id}`);
    }
    setOpen(false);
    setQ('');
    setResults([]);
  };

  // group results by type, preserving order property -> vasuli -> certificate
  const groups: SearchResult['type'][] = ['property', 'vasuli', 'certificate'];

  return (
    <div ref={boxRef} className="relative hidden md:block">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder="शोधा... (मालमत्ता / नाव / प्रमाणपत्र)"
          className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-7 text-sm text-gray-800 transition-all focus:w-72 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-800"
        />
        {q && (
          <button
            onClick={() => { setQ(''); setResults([]); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="साफ करा"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute right-0 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">शोधत आहे...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">काही आढळले नाही</p>
          ) : (
            groups.map((g) => {
              const items = results.filter((r) => r.type === g);
              if (!items.length) return null;
              const meta = TYPE_META[g];
              return (
                <div key={g} className="py-1">
                  <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {meta.label}
                  </p>
                  {items.map((r) => {
                    const { Icon, color } = meta;
                    return (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => go(r)}
                        className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60"
                      >
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">{r.label}</span>
                          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{r.sublabel}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

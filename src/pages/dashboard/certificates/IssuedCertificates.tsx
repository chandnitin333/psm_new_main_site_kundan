import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { certificateService } from '../../../services';
import { CERTIFICATES } from '../../../constants/certificates';
import { Select2, type Select2Option } from '../../../components/common';

// label carries both Marathi + English so typing either script finds it
const TYPE_OPTIONS: Select2Option[] = CERTIFICATES.map((c) => ({
  value: c.slug,
  label: `${c.marathi} (${c.name})`,
}));

interface IssuedRow {
  id: number;
  cert_type: string;
  cert_name: string;
  applicant_name: string;
  outward_no: string;
  created_at: string;
}

/* List of certificates already issued (GP-scoped). Search + pagination; each row
   re-opens the certificate prefilled for re-view / re-print. */
const IssuedCertificates = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<IssuedRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [certType, setCertType] = useState('');
  const [loading, setLoading] = useState(true);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await certificateService.list(page, perPage, certType || undefined, search.trim() || undefined);
        if (active && res.success) {
          const d = res.data as { records: IssuedRow[]; total: number };
          setRows(d.records || []);
          setTotal(d.total || 0);
        }
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    }, 250); // debounce search
    return () => { active = false; clearTimeout(t); };
  }, [page, search, certType]);

  // reset to page 1 on search/type change
  useEffect(() => { setPage(1); }, [search, certType]);

  const fmt = (d: string) => { const x = new Date(d); return isNaN(x.getTime()) ? (d || '-') : x.toLocaleDateString('en-GB'); };
  const th = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300';
  const td = 'px-4 py-3 text-sm text-gray-800 dark:text-gray-100 whitespace-nowrap';
  const startIdx = useMemo(() => (total === 0 ? 0 : (page - 1) * perPage + 1), [page, total]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="आवेदक / जावक क्र. शोधा..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-96">
          <Select2
            options={TYPE_OPTIONS}
            value={certType}
            onChange={(v) => setCertType(String(v))}
            placeholder="सर्व प्रकार — प्रकार निवडा"
            searchable
            clearable
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/60">
              <tr>
                <th className={th}>#</th>
                <th className={th}>आवेदक</th>
                <th className={th}>प्रकार</th>
                <th className={th}>जावक क्र.</th>
                <th className={th}>दिनांक</th>
                <th className={`${th} text-right`}>कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td className={`${td} text-center`} colSpan={6}>लोड होत आहे...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className={`${td} text-center text-gray-500`} colSpan={6}>अद्याप कोणतेही प्रमाणपत्र जारी केलेले नाही</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className={td}>{startIdx + i}</td>
                    <td className={`${td} font-medium`}>{r.applicant_name || '-'}</td>
                    <td className={td}>{r.cert_name || r.cert_type}</td>
                    <td className={td}>{r.outward_no || '-'}</td>
                    <td className={td}>{fmt(r.created_at)}</td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        onClick={() => navigate(`/certificates/${r.cert_type}?id=${r.id}`)}
                        className="inline-flex items-center gap-1 rounded-md border border-primary-300 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/30"
                      >
                        <Eye className="h-3.5 w-3.5" /> पहा
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && total > 0 && (
        <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-gray-400">{startIdx}–{Math.min(page * perPage, total)} / {total}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">मागे</button>
            <span className="px-2 text-sm text-gray-600 dark:text-gray-300">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">पुढे</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuedCertificates;

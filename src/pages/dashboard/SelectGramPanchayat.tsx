import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Check } from 'lucide-react';
import { commonDdlService } from '../../services';
import { MarathiInput } from '../../components/common';
import { setActiveGp } from '../../utils/activeGp';
import { getLandingPath } from '../../utils/permissions';

interface GpRow {
  gram_panchayat_id: number;
  gram_panchayat_name: string;
  taluka_id: number;
  taluka_name: string;
  district_id: number;
  district_name: string;
}

/* super_user lands here after login: a searchable table of every gram panchayat
   (District / Taluka / Gram Panchayat). Search or scroll, then निवडा to start
   working in it — the choice is stored as the active GP context. */
const SelectGramPanchayat = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<GpRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const loaded = useRef(false);

  useEffect(() => {
    document.title = 'ग्रामपंचायत निवडा';
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const res = await commonDdlService.getAllGramPanchayats();
        if (res.success) setRows((res.data as GpRow[]) || []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.district_name || ''} ${r.taluka_name || ''} ${r.gram_panchayat_name || ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  // pagination (client-side): 10 per page; reset to page 1 when the search changes
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  useEffect(() => { setPage(1); }, [search]);

  const handleSelect = async (row: GpRow) => {
    setSelectingId(row.gram_panchayat_id);
    let gatId = 0;
    let gatName = '';
    try {
      const res = await commonDdlService.getGatGramPanchayats(row.gram_panchayat_id);
      const list = (res.success ? (res.data as Record<string, unknown>[]) : []) || [];
      if (list.length) {
        gatId = Number(list[0].id);
        gatName = String(list[0].name ?? list[0].gat_gram_panchayat_name ?? '');
      }
    } catch { /* gat optional */ }
    setActiveGp({
      district_id: row.district_id,
      taluka_id: row.taluka_id,
      gram_panchayat_id: row.gram_panchayat_id,
      gat_gram_panchayat_id: gatId,
      name: row.gram_panchayat_name,
      district_name: row.district_name,
      taluka_name: row.taluka_name,
      gat_name: gatName,
    });
    navigate(getLandingPath());
  };

  const th = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300';
  const td = 'px-4 py-3 text-sm text-gray-800 dark:text-gray-100 whitespace-nowrap';

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40">
            <MapPin className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ग्रामपंचायत निवडा</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">शोधा किंवा यादीतून निवडा — कोणत्या ग्रामपंचायतीसाठी काम करायचे</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <MarathiInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="जिल्हा / तालुका / ग्रामपंचायत शोधा..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="max-h-[65vh] overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700/60">
                <tr>
                  <th className={th}>जिल्हा</th>
                  <th className={th}>तालुका</th>
                  <th className={th}>ग्रामपंचायत</th>
                  <th className={`${th} text-right`}>कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr><td className={`${td} text-center`} colSpan={4}>लोड होत आहे...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className={`${td} text-center text-gray-500`} colSpan={4}>कोणतीही ग्रामपंचायत आढळली नाही</td></tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.gram_panchayat_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className={td}>{r.district_name || '-'}</td>
                      <td className={td}>{r.taluka_name || '-'}</td>
                      <td className={`${td} font-medium`}>{r.gram_panchayat_name || '-'}</td>
                      <td className={`${td} text-right`}>
                        <button
                          type="button"
                          onClick={() => handleSelect(r)}
                          disabled={selectingId !== null}
                          className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {selectingId === r.gram_panchayat_id ? 'निवडत आहे...' : 'निवडा'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-xs text-gray-400">
              {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} / {filtered.length} ग्रामपंचायत
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                मागे
              </button>
              <span className="px-2 text-sm text-gray-600 dark:text-gray-300">{safePage} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                पुढे
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectGramPanchayat;

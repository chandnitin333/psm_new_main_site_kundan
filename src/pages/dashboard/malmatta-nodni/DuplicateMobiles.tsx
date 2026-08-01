import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Phone, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import { nodniService } from '../../../services';
import authService from '../../../services/authService';
import ExportButtons from '../../../components/common/ExportButtons';
import type { ExportColumn } from '../../../utils/exportUtils';

interface DupProperty {
  id: number;
  malmatta_number: string | null;
  ward_kramnak: string | null;
  ghar_malkache_nav: string | null;
  patni_mulache_nav?: string | null;
  bhogavat_darache_nav?: string | null;
}
interface DupGroup {
  mobile_number: string;
  count: number;
  distinct_names: string[];
  same_name: boolean;
  properties: DupProperty[];
}

// One flat row per property — for Excel/PDF export
interface FlatRow {
  mobile_number: string;
  count: number;
  ghar_malkache_nav: string;
  ward_kramnak: string;
  malmatta_number: string;
  same_name: string;
}

const DuplicateMobiles = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();

  const [groups, setGroups] = useState<DupGroup[]>([]);
  const [summary, setSummary] = useState<{ total_mobiles: number; total_properties: number }>({
    total_mobiles: 0,
    total_properties: 0,
  });
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  const gpName = useMemo(() => {
    try {
      const u = authService.getCurrentUser() as { gram_panchayat?: string } | null;
      return (u?.gram_panchayat || '').trim();
    } catch { return ''; }
  }, []);

  useEffect(() => {
    document.title = 'एकच मोबाईल – अनेक मालमत्ता';
    (async () => {
      showLoader('तपासत आहे... (Scanning...)');
      try {
        const res = await nodniService.duplicateMobiles();
        if (res?.success && res.data) {
          const d = res.data as { groups: DupGroup[]; summary: typeof summary };
          setGroups(d.groups || []);
          setSummary(d.summary || { total_mobiles: 0, total_properties: 0 });
        } else {
          toast.error(res?.message || 'माहिती मिळवण्यात अयशस्वी');
        }
      } catch {
        toast.error('माहिती मिळवण्यात त्रुटी आली');
      } finally {
        hideLoader();
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filter (mobile or any owner name)
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return groups;
    return groups.filter(
      (g) =>
        g.mobile_number.toLowerCase().includes(s) ||
        g.distinct_names.some((n) => n.toLowerCase().includes(s))
    );
  }, [groups, search]);

  const exportRows: FlatRow[] = useMemo(
    () =>
      filtered.flatMap((g) =>
        g.properties.map((p) => ({
          mobile_number: g.mobile_number,
          count: g.count,
          ghar_malkache_nav: p.ghar_malkache_nav || '',
          ward_kramnak: String(p.ward_kramnak ?? ''),
          malmatta_number: String(p.malmatta_number ?? ''),
          same_name: g.same_name ? 'होय' : 'नाही',
        }))
      ),
    [filtered]
  );

  const exportColumns: ExportColumn<FlatRow>[] = [
    { header: 'मोबाईल क्रमांक', value: (r) => r.mobile_number },
    { header: 'एकूण मालमत्ता', value: (r) => r.count },
    { header: 'मालकाचे नाव', value: (r) => r.ghar_malkache_nav },
    { header: 'वार्ड', value: (r) => r.ward_kramnak },
    { header: 'मालमत्ता क्र.', value: (r) => r.malmatta_number },
    { header: 'नाव समान?', value: (r) => r.same_name },
  ];

  return (
    <>
      <ToastContainer />
      <div className="space-y-5 p-1 sm:p-2">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/malmatta-nodni')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              title="मागे (Back)"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                एकच मोबाईल – अनेक मालमत्ता
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                एकाच मोबाईल क्रमांकावर नोंद असलेल्या सर्व मालमत्ता (एका व्यक्तीच्या मालमत्ता ओळखण्यासाठी)
              </p>
            </div>
          </div>
          <ExportButtons
            columns={exportColumns}
            rows={exportRows}
            filename="duplicate-mobiles"
            title="एकच मोबाईल – अनेक मालमत्ता"
            subtitle={gpName}
          />
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{summary.total_mobiles}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">सामाईक मोबाईल</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{summary.total_properties}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">एकूण मालमत्ता</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="मोबाईल किंवा नावाने शोधा..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Groups */}
        {loaded && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            एकही सामाईक मोबाईल आढळला नाही.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((g) => (
              <div
                key={g.mobile_number}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                {/* group header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900/40">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary-600" />
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{g.mobile_number}</span>
                    <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {g.count} मालमत्ता
                    </span>
                  </div>
                  {g.same_name ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> एकच मालक
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> वेगवेगळी नावे ({g.distinct_names.length})
                    </span>
                  )}
                </div>

                {/* properties table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 dark:text-gray-400">
                        <th className="px-4 py-2 font-medium">मालकाचे नाव</th>
                        <th className="px-4 py-2 font-medium">वार्ड</th>
                        <th className="px-4 py-2 font-medium">मालमत्ता क्र.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {g.properties.map((p) => (
                        <tr key={p.id} className="text-gray-800 dark:text-gray-200">
                          <td className="px-4 py-2">{p.ghar_malkache_nav || '-'}</td>
                          <td className="px-4 py-2 tabular-nums">{p.ward_kramnak ?? '-'}</td>
                          <td className="px-4 py-2 tabular-nums">{p.malmatta_number ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DuplicateMobiles;

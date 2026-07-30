import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ArrowRightLeft, Wallet, Award, Printer, MapPin, Phone, Split } from 'lucide-react';
import { nodniService, type PropertyHistory as PH } from '../../../services/nodniService';
import { useToast } from '../../../hooks/useToast';
import { can } from '../../../utils/permissions';
import PropertyDivideModal from '../../../components/PropertyDivideModal';

/* Property 360° — one place to see a property's full history:
   master details + ownership transfers (ferfar) + year-wise vasuli + certificates. */
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');
const inr = (n: number) => '₹ ' + Math.round(n).toLocaleString('en-IN');

const PropertyHistory = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const id = Number(params.get('id'));
  const [data, setData] = useState<PH | null>(null);
  const [loading, setLoading] = useState(true);
  const [divideOpen, setDivideOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) { setLoading(false); return; }
    (async () => {
      try {
        const res = await nodniService.getHistory(id);
        if (res.success && res.data) setData(res.data as PH);
        else toast.error(res.message || 'इतिहास लोड करता आला नाही');
      } catch {
        toast.error('इतिहास लोड करताना त्रुटी');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="p-10 text-center text-gray-500">लोड होत आहे...</div>;
  if (!data) return <div className="p-10 text-center text-gray-500">मालमत्ता आढळली नाही</div>;

  const p = data.property as Record<string, string>;
  const owner = p.ghar_malkache_nav || '—';
  const totalBaki = data.vasuli.reduce((s, v) => s + (v.baki || 0), 0);
  const totalJama = data.vasuli.reduce((s, v) => s + (v.jama || 0), 0);

  const card = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800';
  const head = 'mb-3 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white';

  return (
    <div className="p-4 sm:p-6 print:p-0">
      <ToastContainer />

      {/* top actions */}
      <div className="no-print mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/malmatta-nodni')} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> मालमत्ता नोंदणी
        </button>
        <div className="flex items-center gap-2">
          {can('malmatta_nodni', 'divide') && (
            <button onClick={() => setDivideOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
              <Split className="h-4 w-4" /> विभाजन
            </button>
          )}
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>
      {divideOpen && (
        <PropertyDivideModal
          source={{ id: Number(params.get('id')), anu_kramank: p.anu_kramank, ward_kramnak: p.ward_kramnak, ghar_malkache_nav: p.ghar_malkache_nav, malmatta_number: p.malmatta_number }}
          onClose={() => setDivideOpen(false)}
          onDone={() => navigate('/malmatta-nodni')}
        />
      )}

      {/* property summary */}
      <div className={`${card} mb-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Home className="h-5 w-5 text-primary-600" /> {owner}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              मालमत्ता क्र.: <b>{p.malmatta_number || '—'}</b> · वॉर्ड {p.ward_kramnak || '—'} / अनु.क्र. {p.anu_kramank || '—'}
            </p>
            {p.bhogavat_darache_nav && <p className="text-sm text-gray-500 dark:text-gray-400">भोगवटदार: {p.bhogavat_darache_nav}</p>}
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              {p.mobile_number && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{p.mobile_number}</span>}
              {p.patta_nagar_layout_society && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.patta_nagar_layout_society}</span>}
            </p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="rounded-lg bg-emerald-50 px-4 py-2 dark:bg-emerald-900/20">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{inr(totalJama)}</div>
              <div className="text-xs text-gray-500">एकूण वसूल</div>
            </div>
            <div className="rounded-lg bg-rose-50 px-4 py-2 dark:bg-rose-900/20">
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{inr(totalBaki)}</div>
              <div className="text-xs text-gray-500">एकूण बाकी</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Transfers / Ferfar */}
        <div className={card}>
          <h2 className={head}><ArrowRightLeft className="h-5 w-5 text-amber-600" /> मालकी बदल (फेरफार) <span className="text-sm font-normal text-gray-400">({data.transfers.length})</span></h2>
          {data.transfers.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">कोणताही फेरफार नाही</p>
          ) : (
            <ol className="relative space-y-4 border-l-2 border-amber-200 pl-4 dark:border-amber-800">
              {data.transfers.map((t) => (
                <li key={t.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-amber-500" />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{t.from_name || '—'}</span>
                    <ArrowRightLeft className="mx-1 inline h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{t.to_name || '—'}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {fmtDate(t.dinank_date)} {t.tharav_kramnak ? `· ठराव क्र. ${t.tharav_kramnak}` : ''} {t.year ? `· वर्ष ${t.year}` : ''}
                  </div>
                  {t.shera_tip && <div className="text-xs italic text-gray-400">{t.shera_tip}</div>}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Vasuli by year */}
        <div className={card}>
          <h2 className={head}><Wallet className="h-5 w-5 text-emerald-600" /> वर्षनिहाय वसुली <span className="text-sm font-normal text-gray-400">({data.vasuli.length})</span></h2>
          {data.vasuli.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">वसुली नोंद नाही</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-gray-700">
                    <th className="py-2">वर्ष</th>
                    <th className="py-2 text-right">मागणी</th>
                    <th className="py-2 text-right">वसूल</th>
                    <th className="py-2 text-right">बाकी</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vasuli.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 dark:border-gray-700/60">
                      <td className="py-2 font-medium text-gray-800 dark:text-gray-200">{v.year}</td>
                      <td className="py-2 text-right tabular-nums">{inr(v.magni)}</td>
                      <td className="py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{inr(v.jama)}</td>
                      <td className="py-2 text-right tabular-nums text-rose-600 dark:text-rose-400">{inr(v.baki)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Certificates */}
        <div className={`${card} lg:col-span-2`}>
          <h2 className={head}><Award className="h-5 w-5 text-purple-600" /> या मालकाच्या नावे प्रमाणपत्रे <span className="text-sm font-normal text-gray-400">({data.certificates.length})</span></h2>
          {data.certificates.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">कोणतेही प्रमाणपत्र नाही</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.certificates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/certificates/${c.cert_type}?id=${c.id}`)}
                  className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-left text-sm transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/40"
                >
                  <span className="block font-medium text-purple-800 dark:text-purple-200">{c.cert_name}</span>
                  <span className="block text-xs text-gray-500">{fmtDate(c.created_at)}{c.outward_no ? ` · जावक ${c.outward_no}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyHistory;

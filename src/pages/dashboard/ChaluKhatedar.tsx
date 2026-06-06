import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLoading } from '../../contexts/LoadingContext';
import { useToast } from '../../hooks/useToast';
import { nodniService } from '../../services';

/* चालू खातेदार — active account holders list. Opened from the dashboard card.
   Same as old `chalu-khatedar` page. */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const PAGE_SIZE = 10;

interface ChaluKhatedarProps {
  title?: string;   // page heading (default चालू खातेदार)
  prakar?: string;  // optional मिळकत प्रकार filter (adhikrut / imlakar / gharkul)
}

const ChaluKhatedar = ({ title = 'चालू खातेदार', prakar }: ChaluKhatedarProps) => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const { toast, ToastContainer } = useToast();
  const [records, setRecords] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const fetched = useRef(false);

  useEffect(() => {
    document.title = title;
    if (fetched.current) return; // guard StrictMode double-run (avoid double toast)
    fetched.current = true;
    (async () => {
      showLoader('लोड होत आहे... (Loading...)');
      try {
        const res = await nodniService.getChaluKhatedar(prakar);
        const data = (res.success ? (res.data as Row[]) : []) || [];
        if (data.length === 0) {
          toast.warning('कोणतेही चालू खातेदार आढळले नाहीत (No records found)');
        }
        setRecords(data);
      } catch (e) {
        console.error('Failed to load chalu khatedar', e);
        toast.error('माहिती मिळवण्यात त्रुटी (Error loading data)');
      } finally {
        hideLoader();
      }
    })();
  }, []);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const pageData = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const th = 'border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-bold text-left text-gray-700 dark:text-gray-200';
  const td = 'border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-gray-100';

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          title="मागे"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className={th}>#</th>
              <th className={th}>अनु.क्रमांक</th>
              <th className={th}>मिळकत क्रं.</th>
              <th className={th}>वार्ड क्रं.</th>
              <th className={th}>खसरा क्रं.</th>
              <th className={th}>खातेधारकाचे नाव</th>
              <th className={th}>भोगवटदाराचे नाव</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td className={`${td} text-center`} colSpan={7}>कोणताही डेटा उपलब्ध नाही</td>
              </tr>
            ) : (
              pageData.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className={td}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className={td}>{s(item.anu_kramank)}</td>
                  <td className={td}>{s(item.malmatta_number)}</td>
                  <td className={td}>{s(item.ward_kramnak)}</td>
                  <td className={td}>{s(item.khasara_number)}</td>
                  <td className={td}>{s(item.ghar_malkache_nav)}</td>
                  <td className={td}>{s(item.bhogavat_darache_nav)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {records.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              एकूण {records.length} खातेदार — पान {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                मागील
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                पुढील
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChaluKhatedar;

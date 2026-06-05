import type {
  KarAakaraniRecord,
  KarAakaraniTotals,
  KarAakaraniPagination,
} from '../../../interfaces/dashboard/kar-aakarani/KarAakarani.types';

interface KarAakaraniTableProps {
  records: KarAakaraniRecord[];
  totals: KarAakaraniTotals;
  pagination: KarAakaraniPagination;
  onPageChange: (page: number) => void;
}

const fmt = (value: number) => (Number(value) || 0).toFixed(2);

const KarAakaraniTable = ({ records, totals, pagination, onPageChange }: KarAakaraniTableProps) => {
  const { current_page, per_page, total_records, total_pages } = pagination;
  const firstIndex = total_records === 0 ? 0 : (current_page - 1) * per_page + 1;
  const lastIndex = Math.min(current_page * per_page, total_records);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {[
                'Dr. No.',
                'Year',
                'To Year',
                'Ward No',
                'Khatedarkache Nav',
                'Gruhkar V Bhumikar',
                'Viz/Divabattikar',
                'Aarogya Rakshan Kar',
                'Safae Kar',
                'Samanya Pani Kar',
                'Vishesh Pani Kar',
                'Ekun Magil Baki',
                'Ekun Imarat Kar',
                'Ekun',
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 whitespace-nowrap"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {records.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  कोणतीही नोंद आढळली नाही (No records found)
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.drNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.year}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.toYear}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.wardNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.khatedarkacheNav}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">₹ {record.gruhkarVBhumikar}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">₹ {record.vizDivabattikar}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">₹ {record.aarogyaRakshanKar}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">₹ {record.safaeKar}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">₹ {record.samanyaPaniKar}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">₹ {record.visheshPaniKar}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">₹ {record.ekunMagilBaki}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">₹ {record.ekunImaratKar}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">₹ {record.ekun}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (server-driven) */}
      {total_records > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {firstIndex} to {lastIndex} of {total_records} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(current_page - 1)}
              disabled={current_page <= 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {Array.from({ length: total_pages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => onPageChange(number)}
                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                  current_page === number
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => onPageChange(current_page + 1)}
              disabled={current_page >= total_pages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Total Fields Section (server-computed, over all matching records) */}
      <div className="mt-6 space-y-4">
        {/* First Row - 5 Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण खातेदार</label>
            <input type="text" value={totals.ekun_khatedar} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण मागील बाकी</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_magil_baki)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण इमारत कर</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_imarat_kar)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण विज/दिवाबत्ती कर</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_viz_divabattikar)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण जमीन कर</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_jamin_kar)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
        </div>

        {/* Second Row - 5 Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण सफाई कर</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_safae_kar)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण आरोग्य रक्षण कर</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_aarogya_rakshan_kar)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण विशेष पाणी कर</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_vishesh_pani_kar)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण सामान्य पाणी कर</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_samanya_pani_kar)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">एकूण कर</label>
            <input type="text" value={`₹ ${fmt(totals.ekun_kar)}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KarAakaraniTable;

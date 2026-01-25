import { useState } from 'react';
import type { KarAakaraniRecord } from '../../../interfaces/dashboard/kar-aakarani/KarAakarani.types';

interface KarAakaraniTableProps {
  records: KarAakaraniRecord[];
}

const KarAakaraniTable = ({ records }: KarAakaraniTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // Filter records based on search term
  const filteredRecords = records.filter(record =>
    record.drNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.wardNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.khatedarkacheNav.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Calculate totals from all records
  const calculateTotals = () => {
    const totals = {
      ekunKhatedar: filteredRecords.length.toString(),
      ekunMagilBaki: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.ekunMagilBaki) || 0), 0).toFixed(2),
      ekunImaratKar: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.ekunImaratKar) || 0), 0).toFixed(2),
      ekunVizDivabattikar: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.vizDivabattikar) || 0), 0).toFixed(2),
      ekunJaminKar: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.gruhkarVBhumikar) || 0), 0).toFixed(2),
      ekunSafaeKar: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.safaeKar) || 0), 0).toFixed(2),
      ekunAarogyaRakshanKar: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.aarogyaRakshanKar) || 0), 0).toFixed(2),
      ekunVisheshPaniKar: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.visheshPaniKar) || 0), 0).toFixed(2),
      ekunSamanyaPaniKar: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.samanyaPaniKar) || 0), 0).toFixed(2),
      ekunKar: filteredRecords.reduce((sum, record) => sum + (parseFloat(record.ekun) || 0), 0).toFixed(2),
    };
    return totals;
  };

  const totals = calculateTotals();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="शोधा... (Search by Dr. No., Year, Ward No, or Name)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Dr. No.
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                To Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Ward No
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Khatedarkache Nav
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Gruhkar V Bhumikar
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Viz/Divabattikar
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Aarogya Rakshan Kar
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Safae Kar
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Samanya Pani Kar
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Vishesh Pani Kar
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Ekun Magil Baki
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Ekun Imarat Kar
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Ekun
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentRecords.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.drNo}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.year}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.toYear}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.wardNo}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.khatedarkacheNav}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  ₹ {record.gruhkarVBhumikar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  ₹ {record.vizDivabattikar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  ₹ {record.aarogyaRakshanKar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  ₹ {record.safaeKar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  ₹ {record.samanyaPaniKar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  ₹ {record.visheshPaniKar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  ₹ {record.ekunMagilBaki}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  ₹ {record.ekunImaratKar}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ₹ {record.ekun}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredRecords.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                  currentPage === number
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Total Fields Section */}
      <div className="mt-6 space-y-4">
        {/* First Row - 5 Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण खातेदार
            </label>
            <input
              type="text"
              value={totals.ekunKhatedar}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण मागील बाकी
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunMagilBaki}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण इमारत कर
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunImaratKar}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण विज/दिवाबत्ती कर
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunVizDivabattikar}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण जमीन कर
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunJaminKar}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>
        </div>

        {/* Second Row - 5 Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण सफाई कर
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunSafaeKar}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण आरोग्य रक्षण कर
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunAarogyaRakshanKar}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण विशेष पाणी कर
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunVisheshPaniKar}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण सामान्य पाणी कर
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunSamanyaPaniKar}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              एकूण कर
            </label>
            <input
              type="text"
              value={`₹ ${totals.ekunKar}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KarAakaraniTable;

import { Edit2, Trash2 } from 'lucide-react';
import type { ManoryachData } from '../../../interfaces/dashboard/nodni-form/ManoryachModal.types';

interface ManoryachTableProps {
  records: ManoryachData[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

const ManoryachTable = ({ records, onEdit, onDelete }: ManoryachTableProps) => {
  if (records.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        मनोऱ्याचे कर आकारणी नोंदी (Entertainment Tax Records)
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                मालमत्तेचे प्रकार
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                मालमत्तेचे वर्णन
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                वापर प्रकार
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                मनोऱ्याचे भाग
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                क्षेत्रफळ पूर्व पश्चिम (फूट)
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                क्षेत्रफळ उत्तर दक्षिण (फूट)
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                एकूण क्षेत्रफळ (चौरस फूट)
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                एकूण क्षेत्रफळ (चौरस मीटर)
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                आकारणी दर
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                कर आकारणी
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                कृती
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {records.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.malmattechePrakar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.malmattecheVarnan}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.vaparPrakar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.manorycheBhag || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimFoot}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalUttarDakshinFoot}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimFoot && record.shetrafalUttarDakshinFoot
                    ? (Number(record.shetrafalPurvPachimFoot) * Number(record.shetrafalUttarDakshinFoot)).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinMeter
                    ? (Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinMeter)).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.aakraniDar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinMeter && record.aakraniDar
                    ? ((Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinMeter) * Number(record.aakraniDar)) / 1000).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(index)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="संपादित करा"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="हटवा"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManoryachTable;

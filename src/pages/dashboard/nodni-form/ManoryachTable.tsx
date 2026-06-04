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
                मजला
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
                  {record.malmattechePrakarName || record.malmattechePrakar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.malmattecheVarnanName || record.malmattecheVarnan}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.vaparPrakar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.manorycheBhagName || record.manorycheBhag || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimFoot}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalUttarDakshinFoot}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.ekunShetrafalChorasFoot || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.ekunShetrafalChorasFoot
                    ? (Number(record.ekunShetrafalChorasFoot) * 0.092903).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.aakraniDar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.majla || '1'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.ekunShetrafalChorasFoot && record.aakraniDar
                    ? (Number(record.ekunShetrafalChorasFoot) * Number(record.aakraniDar) * (Number(record.majla) || 1)).toFixed(2)
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
            {/* Total Row */}
            <tr className="bg-gray-100 dark:bg-gray-700 font-semibold border-t-2 border-gray-300 dark:border-gray-600">
              <td colSpan={4} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">
                एकूण (Total):
              </td>
              {/* क्षेत्रफळ पूर्व पश्चिम (फूट) */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, r) => sum + (Number(r.shetrafalPurvPachimFoot) || 0), 0).toFixed(2)}
              </td>
              {/* क्षेत्रफळ उत्तर दक्षिण (फूट) */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, r) => sum + (Number(r.shetrafalUttarDakshinFoot) || 0), 0).toFixed(2)}
              </td>
              {/* एकूण क्षेत्रफळ (चौरस फूट) */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, r) => sum + (Number(r.ekunShetrafalChorasFoot) || 0), 0).toFixed(2)}
              </td>
              {/* एकूण क्षेत्रफळ (चौरस मीटर) */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, r) => sum + (r.ekunShetrafalChorasFoot ? Number(r.ekunShetrafalChorasFoot) * 0.092903 : 0), 0).toFixed(2)}
              </td>
              {/* आकारणी दर - skip */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">-</td>
              {/* मजला - skip */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">-</td>
              {/* कर आकारणी */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, r) =>
                  sum + (r.ekunShetrafalChorasFoot && r.aakraniDar
                    ? Number(r.ekunShetrafalChorasFoot) * Number(r.aakraniDar) * (Number(r.majla) || 1)
                    : 0), 0
                ).toFixed(2)}
              </td>
              {/* कृती - skip */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManoryachTable;

import { Edit2, Trash2 } from 'lucide-react';
import type { KhulaBhukhandData } from '../../../interfaces/dashboard/nodni-form/KhulaBhukhandModal.types';

interface KhulaBhukhandTableProps {
  records: KhulaBhukhandData[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

const KhulaBhukhandTable = ({ records, onEdit, onDelete }: KhulaBhukhandTableProps) => {
  if (records.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        खुला भूखंड कर आकारणी नोंदी (Open Land Tax Records)
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
                गावाचे नाव
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                गवठाण/गवठाण बाहेरचे
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
                जमिनीचे वार्षिक मूल्य
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                आकारणी दर
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                जमिनीचे भांडवली मूल्य
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
                  {record.gavacheNav}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.gavthanBaher}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurabPachimMeter}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalUttarDakshinFoot}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurabPachimMeter && record.shetrafalUttarDakshinFoot
                    ? (Number(record.shetrafalPurabPachimMeter) * Number(record.shetrafalUttarDakshinFoot)).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurabPachimMeter2 && record.shetrafalUttarDakshinMeter
                    ? (Number(record.shetrafalPurabPachimMeter2) * Number(record.shetrafalUttarDakshinMeter)).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.jaminicheVarshikMulya}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.aakraniDar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurabPachimMeter2 && record.shetrafalUttarDakshinMeter && record.jaminicheVarshikMulya
                    ? (Number(record.shetrafalPurabPachimMeter2) * Number(record.shetrafalUttarDakshinMeter) * Number(record.jaminicheVarshikMulya)).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurabPachimMeter2 && record.shetrafalUttarDakshinMeter && record.jaminicheVarshikMulya && record.aakraniDar
                    ? ((Number(record.shetrafalPurabPachimMeter2) * Number(record.shetrafalUttarDakshinMeter) * Number(record.jaminicheVarshikMulya) * Number(record.aakraniDar)) / 1000).toFixed(2)
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
              <td colSpan={5} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">
                एकूण (Total):
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (Number(record.shetrafalPurabPachimMeter) || 0), 0
                ).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (Number(record.shetrafalUttarDakshinFoot) || 0), 0
                ).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (record.shetrafalPurabPachimMeter && record.shetrafalUttarDakshinFoot
                    ? Number(record.shetrafalPurabPachimMeter) * Number(record.shetrafalUttarDakshinFoot)
                    : 0), 0
                ).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (record.shetrafalPurabPachimMeter2 && record.shetrafalUttarDakshinMeter
                    ? Number(record.shetrafalPurabPachimMeter2) * Number(record.shetrafalUttarDakshinMeter)
                    : 0), 0
                ).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                -
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                -
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (record.shetrafalPurabPachimMeter2 && record.shetrafalUttarDakshinMeter && record.jaminicheVarshikMulya
                    ? Number(record.shetrafalPurabPachimMeter2) * Number(record.shetrafalUttarDakshinMeter) * Number(record.jaminicheVarshikMulya)
                    : 0), 0
                ).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (record.shetrafalPurabPachimMeter2 && record.shetrafalUttarDakshinMeter && record.jaminicheVarshikMulya && record.aakraniDar
                    ? (Number(record.shetrafalPurabPachimMeter2) * Number(record.shetrafalUttarDakshinMeter) * Number(record.jaminicheVarshikMulya) * Number(record.aakraniDar)) / 1000
                    : 0), 0
                ).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KhulaBhukhandTable;

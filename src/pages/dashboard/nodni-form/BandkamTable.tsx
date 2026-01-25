import { Edit2, Trash2 } from 'lucide-react';
import type { BandkamData } from '../../../interfaces/dashboard/nodni-form/BandkamModal.types';

interface BandkamTableProps {
  records: BandkamData[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

const BandkamTable = ({ records, onEdit, onDelete }: BandkamTableProps) => {
  if (records.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        बांदकामाची कर आकारणी नोंदी (Building Tax Records)
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
                बांदकाम मजला
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
                वयोमान
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                इमारतीचे बांदकाम वर्ष
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                घसारा दर
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                भारांक
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                आकारणी दर
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                इमारतीचे वार्षिक मूल्य
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                इमारतीचे भांडवली मूल्य
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
                  {record.bandkamMajla}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimMeter}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalUttarDakshinFoot}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinFoot
                    ? (Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinFoot)).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinMeter
                    ? (Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinMeter)).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.vayoman}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.imaraticheBandkamVarsh}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.ghasaraDar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.bharank}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.aakraniDar}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.imaraticheVarshikMulya}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinMeter && record.imaraticheVarshikMulya
                    ? (Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinMeter) * Number(record.imaraticheVarshikMulya)).toFixed(2)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinMeter && record.imaraticheVarshikMulya && record.ghasaraDar && record.bharank && record.aakraniDar
                    ? ((Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinMeter) * Number(record.imaraticheVarshikMulya) * Number(record.ghasaraDar) * Number(record.bharank) * Number(record.aakraniDar)) / 1000).toFixed(2)
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
              {/* Column 5: क्षेत्रफळ पूर्व पश्चिम (फूट) */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (Number(record.shetrafalPurvPachimMeter) || 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 6: क्षेत्रफळ उत्तर दक्षिण (फूट) */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (Number(record.shetrafalUttarDakshinFoot) || 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 7: एकूण क्षेत्रफळ (चौरस फूट) */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinFoot
                    ? Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinFoot)
                    : 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 8: एकूण क्षेत्रफळ (चौरस मीटर) */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinMeter
                    ? Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinMeter)
                    : 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 9: वयोमान - skip */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                -
              </td>
              {/* Column 10: इमारतीचे बांदकाम वर्ष */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (Number(record.imaraticheBandkamVarsh) || 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 11: घसारा दर - skip */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                -
              </td>
              {/* Column 12: भारांक - skip */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                -
              </td>
              {/* Column 13: आकारणी दर */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (Number(record.aakraniDar) || 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 14: इमारतीचे वार्षिक मूल्य */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (Number(record.imaraticheVarshikMulya) || 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 15: इमारतीचे भांडवली मूल्य */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinMeter && record.imaraticheVarshikMulya
                    ? Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinMeter) * Number(record.imaraticheVarshikMulya)
                    : 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 16: कर आकारणी */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {records.reduce((sum, record) =>
                  sum + (record.shetrafalPurvPachimMeter && record.shetrafalUttarDakshinMeter && record.imaraticheVarshikMulya && record.ghasaraDar && record.bharank && record.aakraniDar
                    ? (Number(record.shetrafalPurvPachimMeter) * Number(record.shetrafalUttarDakshinMeter) * Number(record.imaraticheVarshikMulya) * Number(record.ghasaraDar) * Number(record.bharank) * Number(record.aakraniDar)) / 1000
                    : 0), 0
                ).toFixed(2)}
              </td>
              {/* Column 17: कृती - skip */}
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

export default BandkamTable;

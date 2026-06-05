import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useLoading } from '../../../contexts/LoadingContext';
import YearPicker from '../../../components/common/YearPicker';
import KarAakaraniTable from './KarAakaraniTable';
import { Select2, type Select2Option } from '../../../components/common';
import { karAakaraniService } from '../../../services/karAakaraniService';
import { commonDdlService } from '../../../services/commonDdlService';
import {
  EMPTY_TOTALS,
  type KarAakaraniRecord,
  type ApiKarAakaraniRecord,
  type WardListItem,
  type KarAakaraniTotals,
  type KarAakaraniPagination,
  type KarAakaraniListResponse,
} from '../../../interfaces/dashboard/kar-aakarani/KarAakarani.types';

// Map a raw API record to the display shape used by the table.
// "chalu" (current-year) values are used for each tax head.
const toDisplayRecord = (r: ApiKarAakaraniRecord): KarAakaraniRecord => ({
  drNo: r.anu_kramank ?? '',
  year: r.year ?? '',
  toYear: r.to_year ?? '',
  wardNo: r.ward_number ?? '',
  khatedarkacheNav: r.khatedharkache_nav ?? '',
  gruhkarVBhumikar: String(r.chalu_gruhkar_v_bhumikar ?? 0),
  vizDivabattikar: String(r.chalu_viz_divabatti_kar ?? 0),
  aarogyaRakshanKar: String(r.chalu_aarogya_rakshan_kar ?? 0),
  safaeKar: String(r.chalu_safae_kar ?? 0),
  samanyaPaniKar: String(r.chalu_samanya_pani_kar ?? 0),
  visheshPaniKar: String(r.chalu_vishesh_pani_kar ?? 0),
  ekunMagilBaki: String(r.magil_ekun ?? 0),
  ekunImaratKar: String(r.ekun_emarat_kar ?? 0),
  ekun: String(r.chalu_ekun ?? 0),
});

const KarAakarani = () => {
  const { toast, ToastContainer } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [formData, setFormData] = useState({
    wardNo: '',
    year: new Date().getFullYear().toString(),
    toYear: (new Date().getFullYear() + 1).toString(),
  });

  const PER_PAGE = 10;
  const [records, setRecords] = useState<KarAakaraniRecord[]>([]);
  const [totals, setTotals] = useState<KarAakaraniTotals>(EMPTY_TOTALS);
  const [pagination, setPagination] = useState<KarAakaraniPagination>({
    current_page: 1,
    per_page: PER_PAGE,
    total_records: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });
  // Filters that were actually applied (used when paging, independent of live form edits)
  const [appliedFilters, setAppliedFilters] = useState<{ wardNo: string; year: string; toYear: string } | null>(null);
  const [wardNoOptions, setWardNoOptions] = useState<Select2Option[]>([]);

  // Page load: set title, fetch ward list, and auto-load current-year (all wards) records
  useEffect(() => {
    document.title = 'Kar Aakarani - कर आकारणी';
    const loadPage = async () => {
      try {
        const res = await commonDdlService.getWards();
        if (res.success && Array.isArray(res.data)) {
          const options = (res.data as WardListItem[]).map((w) => ({
            value: String(w.ward_number),
            label: `प्रभाग ${w.ward_number} (Ward ${w.ward_number})`,
          }));
          setWardNoOptions(options);
        }
      } catch {
        toast.error('वॉर्ड यादी लोड करण्यात अयशस्वी (Failed to load ward list)');
      }
      // Default view: current year, all wards (no ward filter)
      const initial = {
        wardNo: '',
        year: new Date().getFullYear().toString(),
        toYear: (new Date().getFullYear() + 1).toString(),
      };
      setAppliedFilters(initial);
      await fetchRecords(initial, 1);
    };
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill "To Year" when "Year" changes
  useEffect(() => {
    if (formData.year) {
      const yearNum = parseInt(formData.year);
      if (!isNaN(yearNum)) {
        setFormData(prev => ({
          ...prev,
          toYear: (yearNum + 1).toString()
        }));
      }
    }
  }, [formData.year]);

  const handleYearChange = (year: string) => {
    setFormData(prev => ({ ...prev, year }));
  };

  const handleWardNoChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, wardNo: value as string }));
  };

  // Fetch a page of records for the given filters from the server
  const fetchRecords = async (
    filters: { wardNo: string; year: string; toYear: string },
    page: number,
    notifyEmpty = false
  ) => {
    showLoader('कर आकारणी करत आहे... (Processing Kar Aakarani...)');
    try {
      const res = await karAakaraniService.list({
        ward_number: filters.wardNo,
        year: filters.year,
        to_year: filters.toYear,
        page,
        per_page: PER_PAGE,
      });

      if (res.success && res.data) {
        const data = res.data as KarAakaraniListResponse;
        setRecords((data.records ?? []).map(toDisplayRecord));
        setTotals(data.totals ?? EMPTY_TOTALS);
        if (data.pagination) setPagination(data.pagination);
        if (notifyEmpty) {
          const count = data.pagination?.total_records ?? 0;
          if (count === 0) toast.info('कोणतीही नोंद आढळली नाही (No records found)');
          else toast.success(`${count} नोंदी आढळल्या (records found)`);
        }
      } else {
        toast.error(res.message || 'डेटा लोड करण्यात अयशस्वी (Failed to load data)');
      }
    } catch (err) {
      const message = (err as { message?: string })?.message || 'काहीतरी चूक झाली (Something went wrong)';
      toast.error(message);
    } finally {
      hideLoader();
    }
  };

  const handleKarAakarani = async (e: React.FormEvent) => {
    e.preventDefault();
    const filters = { wardNo: formData.wardNo, year: formData.year, toYear: formData.toYear };
    setAppliedFilters(filters);
    await fetchRecords(filters, 1, true);
  };

  const handlePageChange = (page: number) => {
    if (!appliedFilters || page < 1 || page > pagination.total_pages) return;
    fetchRecords(appliedFilters, page);
  };

  const handleReset = async () => {
    setFormData({
      wardNo: '',
      year: new Date().getFullYear().toString(),
      toYear: (new Date().getFullYear() + 1).toString(),
    });
    setRecords([]);
    setTotals(EMPTY_TOTALS);
    setAppliedFilters(null);
    setPagination({
      current_page: 1,
      per_page: PER_PAGE,
      total_records: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    });
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            कर आकारणी (Kar Aakarani)
          </h1>

          <form onSubmit={handleKarAakarani} className="space-y-6">
            {/* Single Row with all fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {/* Ward No Dropdown */}
              <div>
                <Select2
                  options={wardNoOptions}
                  value={formData.wardNo}
                  onChange={handleWardNoChange}
                  placeholder="सर्व वॉर्ड (All Wards)"
                  label="वॉर्ड क्र. (Ward No)"
                  searchable={true}
                  clearable={true}
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  वर्ष (Year) *
                </label>
                <YearPicker
                  name="year"
                  value={formData.year}
                  onChange={handleYearChange}
                  placeholder="वर्ष निवडा"
                />
              </div>

              {/* To Year (Auto-calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  ते वर्ष (To Year)
                </label>
                <input
                  type="text"
                  name="toYear"
                  value={formData.toYear}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                  placeholder="ते वर्ष"
                />
              </div>

              {/* Kar Aakarani Button */}
              <div>
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  कर आकारणी
                </button>
              </div>

              {/* Reset Button */}
              <div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  रीसेट (Reset)
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Table Component */}
        <KarAakaraniTable
          records={records}
          totals={totals}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
};

export default KarAakarani;

import { useState, useEffect } from 'react';
import Select2, { type Select2Option } from '../../../components/common/Select2';
import YearPicker from '../../../components/common/YearPicker';
import { useToast } from '../../../hooks/useToast';
import { commonDdlService, waterMeterService, WATER_MONTHS, type WaterMeter } from '../../../services';
import { openReportIfData } from '../../../utils/openReport';

/* पाणी मीटर बिल / रजिस्टर — बहु-अहवाल launcher.
   वर्ष / वॉर्ड / पासून–पर्यंत महिना / प्रकार निवडून सर्व मीटरचा एकत्रित अहवाल उघडतो. */

const currentYear = new Date().getFullYear();

const PaniMeterBill = () => {
  const { toast, ToastContainer } = useToast();
  const [wardOptions, setWardOptions] = useState<Select2Option[]>([]);
  const [form, setForm] = useState({ mode: 'both', ward: '', year: String(currentYear), fromSeq: 1, toSeq: 12 });

  useEffect(() => {
    document.title = 'पाणी मीटर बिल / अहवाल';
    (async () => {
      try {
        const res = await commonDdlService.getWards();
        if (res.success) {
          const opts = ((res.data as { ward_number: string | number }[]) || [])
            .filter((w) => w.ward_number !== null && w.ward_number !== undefined && w.ward_number !== '')
            .map((w) => ({ value: String(w.ward_number), label: `प्रभाग ${w.ward_number}` }));
          setWardOptions(opts);
        }
      } catch (e) { console.error('Failed to load wards', e); }
    })();
  }, []);

  const modeOptions: Select2Option[] = [
    { value: 'both', label: 'रजिस्टर + बिल (दोन्ही)' },
    { value: 'register', label: 'फक्त रीडिंग रजिस्टर' },
    { value: 'bill', label: 'फक्त मागणी बिल' },
  ];
  const monthOptions: Select2Option[] = WATER_MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const year = Number(form.year) || currentYear;
    const params = { year, ward: form.ward, fromSeq: form.fromSeq, toSeq: form.toSeq, mode: form.mode };
    openReportIfData<WaterMeter>({
      fetcher: async () => {
        const res = await waterMeterService.report({ year, ward: form.ward !== '' ? form.ward : undefined });
        return res?.success && Array.isArray(res.data) ? (res.data as WaterMeter[]) : [];
      },
      url: '/water-meter-report',
      sessionKey: 'waterMeterReportParams',
      sessionValue: params,
      onEmpty: () => toast.error('या निवडीसाठी मीटर आढळले नाहीत (No meters found)'),
    });
  };

  const reset = () => setForm({ mode: 'both', ward: '', year: String(currentYear), fromSeq: 1, toSeq: 12 });
  const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">पाणी मीटर बिल / अहवाल</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">सर्व मीटरचा एकत्रित रीडिंग रजिस्टर व मागणी बिल — वर्ष/वॉर्ड/महिना निवडा.</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <form onSubmit={submit}>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Select2 label="अहवाल प्रकार" options={modeOptions} value={form.mode} onChange={(v) => setForm({ ...form, mode: v as string })} placeholder="प्रकार निवडा" />
            </div>
            <div>
              <Select2 label="वॉर्ड क्र. (पर्यायी)" options={wardOptions} value={form.ward} onChange={(v) => setForm({ ...form, ward: v as string })} placeholder="सर्व वॉर्ड" searchable clearable />
            </div>
            <div>
              <label className={lbl}>वर्ष</label>
              <YearPicker value={form.year} onChange={(v) => setForm({ ...form, year: v })} placeholder="वर्ष निवडा" />
            </div>
          </div>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Select2 label="पासून महिना" options={monthOptions} value={String(form.fromSeq)} onChange={(v) => setForm({ ...form, fromSeq: Number(v) })} placeholder="पासून" />
            </div>
            <div>
              <Select2 label="पर्यंत महिना" options={monthOptions} value={String(form.toSeq)} onChange={(v) => setForm({ ...form, toSeq: Number(v) })} placeholder="पर्यंत" />
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button type="submit" className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700">अहवाल पहा / प्रिंट</button>
            <button type="button" onClick={reset} className="rounded-lg bg-gray-500 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-600">रीसेट</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaniMeterBill;
